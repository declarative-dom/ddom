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

// === UNIVERSAL PROPERTY RETURN FORMAT ===

/**
 * Universal processed property format returned by the properties module.
 * This provides a consistent interface for the binding system to handle all property types.
 */
export interface ProcessedProperty {
  /** The prototype/type of the processed value (Signal.State, Signal.Computed, string, number, etc.) */
  prototype: string;
  /** The processed value (signal, primitive, or complex object) */
  value: any;
  /** Whether the processed value is valid for use */
  isValid: boolean;
  /** Error information if processing failed */
  error?: string;
}

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

// === UNIVERSAL PROPERTY PROCESSING ===

/**
 * Universal property processor - the single source of truth for all property resolution.
 * Takes any property key/value pair and returns a standardized ProcessedProperty format.
 * This is the ONLY function that binding.ts should call from properties.ts.
 * 
 * @param key - The property name
 * @param value - The property value to process
 * @param contextNode - The context for template/accessor evaluation
 * @param options - Optional configuration with ignoreKeys
 * @returns ProcessedProperty with prototype, value, isValid, and optional error
 */
export function processProperty(
  key: string,
  value: any,
  contextNode: any,
  options: { ignoreKeys?: string[] } = {}
): ProcessedProperty {
  try {
    const { ignoreKeys = [] } = options;
    
    // Skip ignored keys - return as-is
    if (ignoreKeys.includes(key)) {
      return {
        prototype: typeof value,
        value: value,
        isValid: value != null && value !== ''
      };
    }

    // Case 1: Reactive property with simple value → Signal.State
    if (key.startsWith('$') && typeof value !== 'string' && typeof value !== 'function' && !isNamespacedProperty(value)) {
      const signal = new Signal.State(value);
      return {
        prototype: 'Signal.State',
        value: signal,
        isValid: value != null && value !== ''
      };
    }
    
    // Case 2: Template literal → Signal.Computed
    if (typeof value === 'string' && isTemplateLiteral(value)) {
      const computed = computedTemplate(value, contextNode);
      // Check validity by evaluating the computed signal once
      let isValid = true;
      try {
        const evaluated = computed.get();
        isValid = evaluated != null && evaluated !== '';
      } catch (error) {
        isValid = false;
      }
      return {
        prototype: 'Signal.Computed',
        value: computed,
        isValid
      };
    }
    
    // Case 3: Property accessor → Resolve and return with appropriate prototype
    if (typeof value === 'string' && isPropertyAccessor(value)) {
      const resolved = resolvePropertyAccessor(value, contextNode);
      if (resolved !== null) {
        return {
          prototype: getValuePrototype(resolved),
          value: resolved,
          isValid: resolved != null && resolved !== ''
        };
      }
      // Fallback to original value if resolution failed
      return {
        prototype: 'string',
        value: value,
        isValid: false // Resolution failed
      };
    }
    
    // Case 4: Function → Function (for attributes, events, etc.)
    if (typeof value === 'function') {
      return {
        prototype: 'function',
        value: value,
        isValid: true // Functions are always valid
      };
    }
    
    // Case 5: Namespace property → Delegate to namespace processor
    if (isNamespacedProperty(value)) {
      return {
        prototype: 'namespace',
        value: value,
        isValid: true // Let namespace processor handle validity
      };
    }
    
    // Case 6: Everything else → Return with detected prototype
    return {
      prototype: getValuePrototype(value),
      value: value,
      isValid: value != null && value !== ''
    };
    
  } catch (error) {
    return {
      prototype: 'error',
      value: null,
      isValid: false,
      error: `Property processing failed for "${key}": ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Determines the prototype/type of a value for the ProcessedProperty format.
 * Handles signals, primitives, objects, arrays, and complex types.
 */
function getValuePrototype(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  // Handle signals
  if (typeof value === 'object' && value !== null) {
    if (typeof value.get === 'function') {
      // Try to determine if it's State or Computed
      if (typeof value.set === 'function') {
        return 'Signal.State';
      } else {
        return 'Signal.Computed';
      }
    }
  }
  
  // Handle arrays
  if (Array.isArray(value)) {
    return 'array';
  }
  
  // Handle basic types
  const basicType = typeof value;
  if (['string', 'number', 'boolean', 'function'].includes(basicType)) {
    return basicType;
  }
  
  // Handle objects (including DOM nodes, complex objects, etc.)
  if (basicType === 'object') {
    // Could be extended to detect specific object types like Cookie, Request, etc.
    return 'object';
  }
  
  return 'unknown';
}

/**
 * Legacy compatibility function for existing code that expects the old resolvePropertyValue interface.
 * @deprecated Use processProperty() instead for the new ProcessedProperty format
 */
export function resolvePropertyValue(
  key: string,
  value: any,
  contextNode: any,
  options: { ignoreKeys?: string[] } = {}
): any {
  const processed = processProperty(key, value, contextNode, options);
  if (processed.error) {
    console.warn(processed.error);
    return value;
  }
  return processed.value;
}

// === PURE VALUE EVALUATION ===

/**
 * Evaluates a ProcessedProperty to its final primitive form.
 * This is a pure function that extracts values from signals and determines final validity.
 * 
 * @param processed - The ProcessedProperty to evaluate
 * @returns ProcessedProperty with final primitive value and updated validity
 */
export function evaluateProcessedProperty(processed: ProcessedProperty): ProcessedProperty {
  // If there's an error, return as-is
  if (processed.error) {
    return processed;
  }
  
  try {
    let finalValue = processed.value;
    let isValid = processed.isValid;
    
    // Extract values from signals
    if (processed.prototype === 'Signal.State' || processed.prototype === 'Signal.Computed') {
      if (processed.value && typeof processed.value.get === 'function') {
        finalValue = processed.value.get();
        // Re-evaluate validity based on extracted value
        isValid = finalValue != null && finalValue !== '' && finalValue !== 'undefined';
      }
    }
    
    // Recursively evaluate objects
    if (processed.prototype === 'object' && finalValue && typeof finalValue === 'object' && !Array.isArray(finalValue)) {
      const evaluatedObj: any = {};
      let allValid = true;
      
      Object.entries(finalValue).forEach(([key, nestedValue]) => {
        const nestedProcessed = processProperty(key, nestedValue, null);
        const nestedEvaluated = evaluateProcessedProperty(nestedProcessed);
        evaluatedObj[key] = nestedEvaluated.value;
        if (!nestedEvaluated.isValid) {
          allValid = false;
        }
      });
      
      finalValue = evaluatedObj;
      isValid = allValid && isValid;
    }
    
    // Handle arrays
    if (processed.prototype === 'array' && Array.isArray(finalValue)) {
      let allValid = true;
      const evaluatedArray = finalValue.map(item => {
        const itemProcessed = processProperty('item', item, null);
        const itemEvaluated = evaluateProcessedProperty(itemProcessed);
        if (!itemEvaluated.isValid) {
          allValid = false;
        }
        return itemEvaluated.value;
      });
      
      finalValue = evaluatedArray;
      isValid = allValid && isValid;
    }
    
    return {
      prototype: getValuePrototype(finalValue),
      value: finalValue,
      isValid: isValid
    };
    
  } catch (error) {
    return {
      prototype: 'error',
      value: null,
      isValid: false,
      error: `Property evaluation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Legacy compatibility function for existing code that expects the old evaluatePropertyValue interface.
 * @deprecated Use evaluateProcessedProperty() instead for the new ProcessedProperty format
 */
export function evaluatePropertyValue(value: any): { value: any; isValid: boolean } {
  const processed: ProcessedProperty = {
    prototype: getValuePrototype(value),
    value: value,
    isValid: value != null && value !== ''
  };
  
  const evaluated = evaluateProcessedProperty(processed);
  return { 
    value: evaluated.value, 
    isValid: evaluated.isValid 
  };
}
