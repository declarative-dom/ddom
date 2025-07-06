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
 * @deprecated Use VALUE_PATTERNS.TEMPLATE.test() instead
 */
export function isTemplateLiteral(value: string): boolean {
  return VALUE_PATTERNS.TEMPLATE.test(value);
}

/**
 * Detects if a string is a property accessor expression.
 * Property accessors use JavaScript dot notation to access object properties.
 * Supports patterns like "window.data", "document.settings", "this.parentNode.value"
 * Also supports DDOM-specific scoped property accessors that start with $.
 *
 * @param value - The string to check
 * @returns True if the string appears to be a property accessor
 * @deprecated Use VALUE_PATTERNS.ACCESSOR.test() instead
 * @example
 * ```typescript
 * isPropertyAccessor('window.userData'); // true
 * isPropertyAccessor('this.parentNode.signal'); // true
 * isPropertyAccessor('document.title'); // true
 * isPropertyAccessor('hello world'); // false
 * ```
 */
export function isPropertyAccessor(value: string): boolean {
  return VALUE_PATTERNS.ACCESSOR.test(value);
}

/**
 * Determines if a property should be made reactive based on DDOM rules.
 * Only reactive-prefixed properties become signals - everything else is static.
 * This makes the behavior completely predictable and explicit.
 *
 * @param key - The property name
 * @param value - The property value
 * @returns True if the property should be wrapped in a signal
 * @deprecated This logic is now handled internally by the pattern-based classification system
 */
export function shouldBeSignal(key: string, value: any): boolean {
  const designation = classifyProperty(key, value);
  return designation.startsWith('scoped') && !designation.includes('Function') && !designation.includes('Namespaced');
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

// === PROPERTY PATTERN CLASSIFICATION ===

/**
 * Property scope classification
 */
const SCOPE_PATTERNS = {
  SCOPED: /^\$/,              // Reactive properties: $count, $selected, $items
  NATIVE: /^[a-zA-Z]/,        // Standard DOM: textContent, className, href
  IGNORED: /^_/               // Internal/ignored properties: _internal, _metadata
} as const;

/**
 * Value type classification with regex patterns
 */
const VALUE_PATTERNS = {
  TEMPLATE: /\$\{/,           // Template literals: 'Hello ${name}'
  ACCESSOR: /^(window\.|document\.|this\.)/,  // Property accessors: 'window.data'
  NAMESPACED: /^prototype$/,  // Namespaced objects: { prototype: 'Array' }
  FUNCTION: (v: any) => typeof v === 'function',
  STRING: (v: any) => typeof v === 'string',
  OBJECT: (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v),
  ARRAY: (v: any) => Array.isArray(v),
  PRIMITIVE: (v: any) => ['number', 'boolean'].includes(typeof v)
} as const;

/**
 * Classifies a key/value pair into a processing designation.
 * Returns a designation string that uniquely identifies the processing pattern.
 * 
 * @param key - Property name
 * @param value - Property value
 * @returns Designation string for pattern matching
 */
export function classifyProperty(key: string, value: any): string {
  // Determine scope
  let scope: string;
  if (SCOPE_PATTERNS.SCOPED.test(key)) {
    scope = 'scoped';
  } else if (SCOPE_PATTERNS.IGNORED.test(key)) {
    scope = 'ignored';
  } else {
    scope = 'native';
  }

  // Determine value pattern (order matters - most specific first)
  let valuePattern: string;
  
  if (VALUE_PATTERNS.FUNCTION(value)) {
    valuePattern = 'function';
  } else if (typeof value === 'string') {
    if (VALUE_PATTERNS.TEMPLATE.test(value)) {
      valuePattern = 'template';
    } else if (VALUE_PATTERNS.ACCESSOR.test(value)) {
      valuePattern = 'accessor';
    } else {
      valuePattern = 'string';
    }
  } else if (VALUE_PATTERNS.OBJECT(value) && isNamespacedProperty(value)) {
    valuePattern = 'namespaced';
  } else if (VALUE_PATTERNS.ARRAY(value)) {
    valuePattern = 'array';
  } else if (VALUE_PATTERNS.OBJECT(value)) {
    valuePattern = 'object';
  } else if (VALUE_PATTERNS.PRIMITIVE(value)) {
    valuePattern = 'primitive';
  } else {
    valuePattern = 'unknown';
  }

  // Combine scope and pattern into designation
  return `${scope}${valuePattern.charAt(0).toUpperCase()}${valuePattern.slice(1)}`;
}

// === UNIVERSAL PROPERTY PROCESSING ===

/**
 * Universal property processor - the single source of truth for all property resolution.
 * Uses pattern-based classification for systematic and maintainable property handling.
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

    // Classify the property into a processing designation
    const designation = classifyProperty(key, value);
    
    // Process based on designation pattern
    switch (designation) {
      // === SCOPED PROPERTY PATTERNS ===
      case 'scopedPrimitive':
      case 'scopedString':
      case 'scopedArray':
      case 'scopedObject':
        // Scoped properties become reactive signals
        const signal = new Signal.State(value);
        return {
          prototype: 'Signal.State',
          value: signal,
          isValid: value != null && value !== ''
        };

      case 'scopedFunction':
        // Scoped functions are stored as-is (unusual but possible)
        return {
          prototype: 'function',
          value: value,
          isValid: true
        };

      case 'scopedTemplate':
        // Scoped template becomes computed signal
        const scopedComputed = computedTemplate(value, contextNode);
        return {
          prototype: 'Signal.Computed',
          value: scopedComputed,
          isValid: validateComputedValue(scopedComputed)
        };

      case 'scopedAccessor':
        // Scoped accessor gets resolved and wrapped in signal
        const scopedResolved = resolvePropertyAccessor(value, contextNode);
        if (scopedResolved !== null) {
          return {
            prototype: getValuePrototype(scopedResolved),
            value: scopedResolved,
            isValid: scopedResolved != null && scopedResolved !== ''
          };
        }
        return {
          prototype: 'string',
          value: value,
          isValid: false
        };

      case 'scopedNamespaced':
        // Scoped namespaced properties
        return {
          prototype: 'namespace',
          value: value,
          isValid: true
        };

      // === NATIVE PROPERTY PATTERNS ===
      case 'nativeTemplate':
        // Native template becomes computed signal for reactivity
        const nativeComputed = computedTemplate(value, contextNode);
        return {
          prototype: 'Signal.Computed',
          value: nativeComputed,
          isValid: validateComputedValue(nativeComputed)
        };

      case 'nativeAccessor':
        // Native accessor gets resolved
        const nativeResolved = resolvePropertyAccessor(value, contextNode);
        if (nativeResolved !== null) {
          return {
            prototype: getValuePrototype(nativeResolved),
            value: nativeResolved,
            isValid: nativeResolved != null && nativeResolved !== ''
          };
        }
        return {
          prototype: 'string',
          value: value,
          isValid: false
        };

      case 'nativeFunction':
        // Native functions (events, computed callbacks)
        return {
          prototype: 'function',
          value: value,
          isValid: true
        };

      case 'nativeNamespaced':
        // Native namespaced properties
        return {
          prototype: 'namespace',
          value: value,
          isValid: true
        };

      case 'nativeString':
      case 'nativePrimitive':
      case 'nativeArray':
      case 'nativeObject':
        // Native static values
        return {
          prototype: getValuePrototype(value),
          value: value,
          isValid: value != null && value !== ''
        };

      // === IGNORED PROPERTY PATTERNS ===
      case 'ignoredString':
      case 'ignoredPrimitive':
      case 'ignoredArray':
      case 'ignoredObject':
      case 'ignoredFunction':
      case 'ignoredTemplate':
      case 'ignoredAccessor':
      case 'ignoredNamespaced':
        // Ignored properties pass through as-is
        return {
          prototype: getValuePrototype(value),
          value: value,
          isValid: value != null && value !== ''
        };

      // === FALLBACK ===
      default:
        console.warn(`Unknown property designation: ${designation} for key: ${key}`);
        return {
          prototype: getValuePrototype(value),
          value: value,
          isValid: value != null && value !== ''
        };
    }
    
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
 * Validates a computed signal by safely evaluating it once.
 */
function validateComputedValue(computed: Signal.Computed<any>): boolean {
  try {
    const evaluated = computed.get();
    return evaluated != null && evaluated !== '';
  } catch (error) {
    return false;
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

