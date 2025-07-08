/**
 * Properties Module
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
import { resolveOperand, evaluateExpression, resolveProperty, isNestedProperty } from '../utils/evaluation';


// === UNIVERSAL PROPERTY RETURN FORMAT ===

/**
 * Universal processed property format returned by the properties module.
 * This provides a consistent interface for the binding system to handle all property types.
 */
export interface ProcessedProperty {
  /** The type/type of the processed value (Signal.State, Signal.Computed, string, number, etc.) */
  type: string;
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

// === TEMPLATE LITERAL PROCESSING ===

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
  } else if (VALUE_PATTERNS.OBJECT(value) && value?.prototype && typeof value.prototype === 'string') {
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
        type: 'Signal.Computed',
        value: computed,
        isValid: validateComputedValue(computed)
      };
    } catch (error) {
      return createErrorProperty(`Template processing failed: ${error}`, value);
    }
  },

  accessor: (value: string, contextNode: any): ProcessedProperty => {
    try {
      const resolved = resolveOperand(value, contextNode);
      if (resolved !== null) {
        return {
          type: getValueType(resolved),
          value: resolved,
          isValid: true  // Successfully resolved accessors are valid
        };
      }
      return {
        type: 'string',
        value: value,
        isValid: false  // Failed to resolve, keep as string but mark invalid
      };
    } catch (error) {
      return createErrorProperty(`Accessor resolution failed: ${error}`, value);
    }
  },

  function: (value: Function): ProcessedProperty => ({
    type: 'function',
    value: value,
    isValid: true
  }),

  namespaced: (value: any): ProcessedProperty => ({
    type: 'namespaced',
    value: value,
    isValid: true
  }),

  primitive: (value: any): ProcessedProperty => ({
    type: getValueType(value),
    value: value,
    isValid: true  // All primitive values are valid for signals
  })
};

/**
 * Creates an error ProcessedProperty.
 */
function createErrorProperty(error: string, originalValue?: any): ProcessedProperty {
  return {
    type: 'error',
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
        if (processed.isValid && processed.type !== 'Signal.State' && processed.type !== 'Signal.Computed') {
          return {
            type: 'Signal.State',
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
          type: 'Signal.State',
          value: signal,
          isValid: true  // All signal values are valid, including empty strings, 0, false, etc.
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
export function processProperty(
  key: string,
  value: any,
  contextNode: any
): ProcessedProperty {
  try {
    console.debug('🔍 processProperty:', key, '=', value, 'typeof:', typeof value);
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
            type: 'Signal.Computed',
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
 * Determines the type/type of a value for the ProcessedProperty format.
 * Handles signals, primitives, objects, arrays, and complex types.
 */
function getValueType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  // Handle signals
  if (typeof value === 'object' && value !== null) {
    if (Signal.isState(value)) {
      return 'Signal.State';
    } else if (Signal.isComputed(value)) {
      return 'Signal.Computed';
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