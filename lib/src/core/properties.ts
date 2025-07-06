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
  // Scoped properties (starting with $) become signals, except functions and namespaced objects
  if (key.startsWith('$')) {
    const pattern = classifyProperty(value);
    return pattern !== 'function' && pattern !== 'namespaced';
  }
  return false;
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
    console.debug('🔧 parseTemplateLiteral called with template:', template, 'context:', contextNode);
    console.debug('🔧 Context properties:', Object.keys(contextNode as any).filter(k => k.startsWith('$')));
    const result = new Function('return `' + template + '`').call(contextNode);
    console.debug('🔧 Template result:', result);
    return result;
  } catch (error) {
    console.warn(`Template evaluation failed: ${error}, Template: ${template}`);
    console.debug('🔧 Available context properties:', Object.keys(contextNode as any).filter(k => k.startsWith('$')));
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
    console.debug('🔧 bindTemplate called with template:', template, 'context:', context);
    console.debug('🔧 Context properties:', Object.keys(context).filter((k: string) => k.startsWith('$')));
    const result = new Function('return `' + template + '`').call(context);
    console.debug('🔧 Template result:', result);
    return result;
  } catch (error) {
    console.warn(`Template binding failed: ${error}, Template: ${template}`);
    console.debug('🔧 Available context properties:', Object.keys(context).filter((k: string) => k.startsWith('$')));
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
 * Value type classification with regex patterns
 */
const VALUE_PATTERNS = {
  TEMPLATE: /\$\{/,           // Template literals: 'Hello ${name}'
  ACCESSOR: /^(window\.|document\.|this\.)/,  // Property accessors: 'window.data'
  FUNCTION: (v: any) => typeof v === 'function',
  STRING: (v: any) => typeof v === 'string',
  OBJECT: (v: any) => v !== null && typeof v === 'object' && !Array.isArray(v),
  ARRAY: (v: any) => Array.isArray(v),
  PRIMITIVE: (v: any) => ['number', 'boolean'].includes(typeof v)
} as const;

/**
 * Classifies a value into a processing pattern.
 * Returns a pattern string that identifies how the value should be processed.
 * 
 * @param value - Property value to classify
 * @returns Pattern string for switch statement matching
 */
export function classifyProperty(value: any): string {
  // Determine value pattern (order matters - most specific first)
  if (VALUE_PATTERNS.FUNCTION(value)) {
    return 'function';
  } else if (typeof value === 'string') {
    if (VALUE_PATTERNS.TEMPLATE.test(value)) {
      console.debug('🎯 classifyProperty: TEMPLATE detected:', value);
      return 'template';
    } else if (VALUE_PATTERNS.ACCESSOR.test(value)) {
      return 'accessor';
    } else {
      return 'string';
    }
  } else if (VALUE_PATTERNS.OBJECT(value) && isNamespacedProperty(value)) {
    return 'namespaced';
  } else if (VALUE_PATTERNS.ARRAY(value)) {
    return 'array';
  } else if (VALUE_PATTERNS.OBJECT(value)) {
    return 'object';
  } else if (VALUE_PATTERNS.PRIMITIVE(value)) {
    return 'primitive';
  } else {
    return 'unknown';
  }
}

// === SHARED PROCESSING UTILITIES ===

/**
 * Core value processing utilities shared across all property types.
 * These handle the common patterns without caring about scope context.
 */
const ValueProcessors = {
  template: (value: string, contextNode: any): ProcessedProperty => {
    try {
      const computed = computedTemplate(value, contextNode);
      return {
        prototype: 'Signal.Computed',
        value: computed,
        isValid: validateComputedValue(computed)
      };
    } catch (error) {
      return createErrorProperty(`Template processing failed: ${error}`, value);
    }
  },

  accessor: (value: string, contextNode: any): ProcessedProperty => {
    try {
      const resolved = resolvePropertyAccessor(value, contextNode);
      if (resolved !== null) {
        return {
          prototype: getValuePrototype(resolved),
          value: resolved,
          isValid: resolved != null && resolved !== ''
        };
      }
      return {
        prototype: 'string',
        value: value,
        isValid: false
      };
    } catch (error) {
      return createErrorProperty(`Accessor resolution failed: ${error}`, value);
    }
  },

  function: (value: Function): ProcessedProperty => ({
    prototype: 'function',
    value: value,
    isValid: true
  }),

  namespaced: (value: any): ProcessedProperty => ({
    prototype: 'namespace',
    value: value,
    isValid: true
  }),

  primitive: (value: any): ProcessedProperty => ({
    prototype: getValuePrototype(value),
    value: value,
    isValid: value != null && value !== ''
  })
};

/**
 * Creates an error ProcessedProperty.
 */
function createErrorProperty(error: string, originalValue?: any): ProcessedProperty {
  return {
    prototype: 'error',
    value: originalValue || null,
    isValid: false,
    error
  };
}

// === SPECIALIZED PROPERTY PROCESSORS ===

/**
 * Processes scoped/reactive properties ($name, $count, etc.).
 * These ALWAYS become signals unless they're functions or namespaced objects.
 * Called during the reactive property initialization phase.
 * 
 * @param key - The scoped property name (starts with $)
 * @param value - The property value to process
 * @param contextNode - Context for template/accessor evaluation
 * @returns ProcessedProperty optimized for scoped property handling
 */
export function processScopedProperty(
  key: string,
  value: any,
  contextNode: any
): ProcessedProperty {
  try {
    console.debug('🔍 processScopedProperty:', key, '=', value, 'typeof:', typeof value);
    const pattern = classifyProperty(value);
    console.debug('🎯 Classified', key, 'as:', pattern);
    
    switch (pattern) {
      case 'function':
        // Scoped functions remain as functions (unusual but valid)
        return ValueProcessors.function(value);
        
      case 'namespaced':
        // Scoped namespaced objects
        return ValueProcessors.namespaced(value);
        
      case 'template':
        // Template → Computed Signal
        return ValueProcessors.template(value, contextNode);
        
      case 'accessor':
        // Accessor → Resolve then wrap in signal if needed
        const processed = ValueProcessors.accessor(value, contextNode);
        // If resolution succeeded, wrap in signal for reactivity
        if (processed.isValid && processed.prototype !== 'Signal.State' && processed.prototype !== 'Signal.Computed') {
          return {
            prototype: 'Signal.State',
            value: new Signal.State(processed.value),
            isValid: processed.isValid
          };
        }
        return processed;
        
      case 'string':
      case 'primitive':
      case 'array':
      case 'object':
      default:
        // Everything else becomes a reactive signal
        console.debug('📦 Creating Signal.State for', key, 'with value:', value);
        const signal = new Signal.State(value);
        console.debug('📦 Created signal:', signal, 'signal.get():', signal.get());
        return {
          prototype: 'Signal.State',
          value: signal,
          isValid: value != null && value !== ''
        };
    }

  } catch (error) {
    return createErrorProperty(`Scoped property processing failed for "${key}": ${error}`, value);
  }
}

/**
 * Processes native DOM properties (textContent, className, onClick, etc.).
 * These follow different rules: templates become computed, functions stay as functions,
 * primitives stay as primitives unless they need reactivity.
 * Called during the standard DOM property binding phase.
 * 
 * @param key - The native property name
 * @param value - The property value to process
 * @param contextNode - Context for template/accessor evaluation
 * @returns ProcessedProperty optimized for native property handling
 */
export function processNativeProperty(
  key: string,
  value: any,
  contextNode: any
): ProcessedProperty {
  try {
    console.debug('🔍 processNativeProperty:', key, '=', value, 'typeof:', typeof value);
    const pattern = classifyProperty(value);
    console.debug('📊 Pattern classified as:', pattern);
    
    switch (pattern) {
      case 'function':
        // Functions stay as functions (events, callbacks)
        return ValueProcessors.function(value);
        
      case 'namespaced':
        // Namespaced objects for complex behaviors
        return ValueProcessors.namespaced(value);
        
      case 'template':
        // Templates become computed for reactivity
        console.debug('🎨 Processing template:', value);
        return ValueProcessors.template(value, contextNode);
        
      case 'accessor':
        // Accessors get resolved
        return ValueProcessors.accessor(value, contextNode);
        
      case 'string':
      case 'primitive':
      case 'array':
      case 'object':
      default:
        // Everything else stays as primitive values
        return ValueProcessors.primitive(value);
    }

  } catch (error) {
    return createErrorProperty(`Native property processing failed for "${key}": ${error}`, value);
  }
}

/**
 * Processes attribute values for DOM attributes (class, data-*, aria-*, etc.).
 * Attributes have different requirements: they're always strings in the end,
 * and functions should become computed signals for reactive updates.
 * Called during the attributes binding phase.
 * 
 * @param attributeName - The attribute name
 * @param value - The attribute value to process
 * @param contextNode - Context for template/accessor evaluation
 * @returns ProcessedProperty optimized for attribute handling
 */
export function processAttributeValue(
  attributeName: string,
  value: any,
  contextNode: any
): ProcessedProperty {
  try {
    const pattern = classifyProperty(value);
    
    switch (pattern) {
      case 'template':
        // Templates always become computed for reactive attributes
        return ValueProcessors.template(value, contextNode);
        
      case 'accessor':
        // Accessors get resolved
        return ValueProcessors.accessor(value, contextNode);
        
      case 'function':
        // Functions become computed signals for reactive attribute updates
        try {
          const computed = new Signal.Computed(value);
          return {
            prototype: 'Signal.Computed',
            value: computed,
            isValid: validateComputedValue(computed)
          };
        } catch (error) {
          return createErrorProperty(`Function to computed conversion failed: ${error}`, value);
        }
        
      case 'string':
      case 'primitive':
      case 'array':
      case 'object':
      case 'namespaced':
      default:
        // Everything else stays as primitive (will be stringified for attributes)
        return ValueProcessors.primitive(value);
    }

  } catch (error) {
    return createErrorProperty(`Attribute processing failed for "${attributeName}": ${error}`, value);
  }
}

/**
 * Legacy universal processor for backward compatibility.
 * @deprecated Use processScopedProperty, processNativeProperty, or processAttributeValue instead
 */
export function processProperty(
  key: string,
  value: any,
  contextNode: any,
  options: { ignoreKeys?: string[] } = {}
): ProcessedProperty {
  const { ignoreKeys = [] } = options;
  
  // Skip ignored keys
  if (ignoreKeys.includes(key)) {
    return ValueProcessors.primitive(value);
  }

  // Route to appropriate specialized processor based on key pattern
  if (key.startsWith('$')) {
    return processScopedProperty(key, value, contextNode);
  } else {
    return processNativeProperty(key, value, contextNode);
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

