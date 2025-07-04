/**
 * Pure Properties Module
 *
 * This module provides PURE property value resolution for DDOM:
 * - Property value classification and validation
 * - Template literal parsing and computed signal creation
 * - Property accessor string resolution
 * - Signal type detection and creation
 * - Value evaluation and extraction
 *
 * This module is COMPLETELY PURE - it performs NO side effects:
 * - No DOM mutations
 * - No element property assignments
 * - No effect creation or binding
 * - No calls to external modules that cause side effects
 *
 * All DOM mutations and bindings are handled in the DOM modules (element.ts, binding.ts, etc.)
 */

import { Signal } from './signals';
import { isNamespacedProperty } from '../utils/detection';
import { DOMNode, DOMSpec } from '../types';

// === PROPERTY DETECTION AND CLASSIFICATION ===

/**
 * Properties that are immutable after element creation (structural identity).
 * These properties define the fundamental structure and should never be reactive.
 */
export const IMMUTABLE_PROPERTIES = new Set(['id', 'tagName']);

/**
 * Detects if a string is a template literal containing reactive expressions.
 * Simple detection - just looks for ${. To display literal ${} in text,
 * escape the scope sign with a backslash: \${
 *
 * @param value - The string to check
 * @returns True if the string contains reactive expressions
 */
export function isTemplateLiteral(value: string): boolean {
  return value.includes('${');
}

/**
 * Detects if a string is a property accessor expression.
 * Property accessors use JavaScript dot notation to access object properties.
 * Supports patterns like "window.data", "document.settings", "this.parentNode.value"
 * Also supports DDOM-specific scoped property accessors that start with $.
 *
 * @param value - The string to check
 * @returns True if the string appears to be a property accessor
 * @example
 * ```typescript
 * isPropertyAccessor('window.userData'); // true
 * isPropertyAccessor('this.parentNode.signal'); // true
 * isPropertyAccessor('document.title'); // true
 * isPropertyAccessor('hello world'); // false
 * ```
 */
export function isPropertyAccessor(value: string): boolean {
  return (
    value.startsWith('window.') ||
    value.startsWith('document.') ||
    value.startsWith('this.')
  );
}

/**
 * Determines if a property should be made reactive based on DDOM rules.
 * Only reactive-prefixed properties become signals - everything else is static.
 * This makes the behavior completely predictable and explicit.
 *
 * @param key - The property name
 * @param value - The property value
 * @returns True if the property should be wrapped in a signal
 */
export function shouldBeSignal(key: string, value: any): boolean {
  return (
    key.startsWith('$') &&
    !(typeof value === 'string' && value.includes('${')) && // Not a template literal
    typeof value !== 'function' &&
    !isNamespacedProperty(value) // Not a namespaced property
  );
}

// === TEMPLATE LITERAL PROCESSING ===

/**
 * Evaluates JavaScript template literals using DOM nodes as context.
 * Uses explicit .get() calls for signal access in templates.
 *
 * @param template - The template string to evaluate as a JavaScript template literal
 * @param contextNode - The DOM node to use as the context ('this') for template evaluation
 * @returns The template string evaluated with the context
 */
export function parseTemplateLiteral(
  template: string,
  contextNode: Node
): string {
  try {
    return new Function('return `' + template + '`').call(contextNode);
  } catch (error) {
    console.warn(`Template evaluation failed: ${error}, Template: ${template}`);
    return template;
  }
}

/**
 * Creates a template function bound to a specific context.
 *
 * @param template - The template string to bind
 * @returns A function that evaluates the template
 */
export const bindTemplate = (template: string) => (context: any) => {
  try {
    return new Function('return `' + template + '`').call(context);
  } catch (error) {
    console.warn(`Template binding failed: ${error}, Template: ${template}`);
    return template;
  }
};

/**
 * Creates a Computed Signal that automatically re-evaluates a template
 * when its dependencies change. Uses explicit .get() calls for signal access.
 *
 * @param template - The template string to make reactive
 * @param contextNode - The DOM node to use as context
 * @returns A Computed Signal that re-evaluates the template when dependencies change
 */
export function computedTemplate(
  template: string,
  contextNode: Node
): Signal.Computed<string> {
  const templateFn = bindTemplate(template);

  return new Signal.Computed(() => {
    try {
      return templateFn(contextNode);
    } catch (error) {
      console.warn(
        `Computed template evaluation failed: ${error}, Template: ${template}`
      );
      return template;
    }
  });
}

// === PROPERTY ACCESSOR HANDLING ===

/**
 * Resolves a property accessor string to its actual value.
 * Supports any resolvable JavaScript property path, including signals, objects, arrays, functions, etc.
 *
 * @param accessor - The property accessor string
 * @param contextNode - The context node for resolving "this" references
 * @returns The resolved value or null if resolution fails
 * @example
 * ```typescript
 * // Access a signal
 * const signal = resolvePropertyAccessor('this.parentNode.$count', element);
 *
 * // Access any object property
 * const config = resolvePropertyAccessor('window.appConfig', element);
 *
 * // Access nested properties
 * const user = resolvePropertyAccessor('document.currentUser.profile', element);
 *
 * // Access arrays
 * const items = resolvePropertyAccessor('this.parentNode.itemList', element);
 * ```
 */
export function resolvePropertyAccessor(
  accessor: string,
  contextNode: Node
): any {
  try {
    const resolved = new Function('return ' + accessor).call(contextNode);
    return resolved;
  } catch (error) {
    console.warn(`Failed to resolve property accessor "${accessor}":`, error);
    return null;
  }
}

// === PURE VALUE RESOLUTION ===

/**
 * Resolves a property value to its final form without side effects.
 * This is a pure function that only transforms values - no DOM manipulation.
 * 
 * @param key - The property name
 * @param value - The property value to resolve
 * @param contextNode - The context for template/accessor evaluation
 * @param options - Optional configuration with ignoreKeys
 * @returns Resolved value (signals, computed signals, or primitives)
 */
export function resolvePropertyValue(
  key: string,
  value: any,
  contextNode: any, // Accept any context
  options: { ignoreKeys?: string[] } = {}
): any {
  const { ignoreKeys = [] } = options;
  
  // Skip ignored keys - return as-is
  if (ignoreKeys.includes(key)) {
    return value;
  }

  // Handle property accessor strings
  if (typeof value === 'string' && isPropertyAccessor(value)) {
    const resolved = resolvePropertyAccessor(value, contextNode);
    return resolved !== null ? resolved : value;
  }

  // Handle template literals - return computed signal
  if (typeof value === 'string' && isTemplateLiteral(value)) {
    return computedTemplate(value, contextNode);
  }

  // Everything else returns as-is
  return value;
}

// === PURE VALUE EVALUATION ===

/**
 * Evaluates a resolved value to its final primitive form with validity checking.
 * This is a pure function that extracts values and determines validity.
 * Recursively evaluates nested structures and collects validity state from all evaluations.
 * 
 * @param value - The resolved value (could be a signal, object, or primitive)
 * @returns Object with final primitive value and validity flag
 */
export function evaluatePropertyValue(value: any): { value: any; isValid: boolean } {
  let isValid = true;
  
  const evaluate = (val: any): any => {
    // Handle signals - extract their current values
    if (typeof val === 'object' && val !== null && Signal.isState(val)) {
      const extracted = (val as Signal.State<any>).get();
      if (extracted === '' || extracted === null || extracted === undefined || extracted === 'undefined') {
        isValid = false;
      }
      return extracted;
    } else if (typeof val === 'object' && val !== null && Signal.isComputed(val)) {
      const extracted = (val as Signal.Computed<any>).get();
      if (extracted === '' || extracted === null || extracted === undefined || extracted === 'undefined') {
        isValid = false;
      }
      return extracted;
    }
    
    // Handle nested objects recursively
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      const evaluated: any = {};
      Object.entries(val).forEach(([key, nestedValue]) => {
        evaluated[key] = evaluate(nestedValue);
      });
      return evaluated;
    }
    
    // Handle arrays recursively
    if (Array.isArray(val)) {
      return val.map(item => evaluate(item));
    }
    
    // Check primitive validity
    if (val === '' || val === null || val === undefined || val === 'undefined') {
      isValid = false;
    }
    
    // Everything else returns as-is
    return val;
  };
  
  const evaluatedValue = evaluate(value);
  
  return { value: evaluatedValue, isValid };
}
