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
 * This module is mostly pure:
 * - No DOM mutations
 * - No element property assignments
 * - No effect creation or binding
 * - Calls to namespaced properties could cause side effects
 *
 * All DOM mutations and bindings are handled in the DOM modules (element.ts, binding.ts, etc.)
 */

import { Signal } from './signals';
import { resolveTemplateProperty, resolveTemplate } from './evaluation';
import { processNamespacedProperty } from '../namespaces/index';


// === UNIVERSAL PROPERTY RETURN FORMAT ===

/**
 * Universal processed property format returned by the properties module.
 * This provides a consistent interface for the binding system to handle all property types.
 */
export interface ProcessedProperty {
  /** The type/type of the processed value (Signal.State, Signal.Computed, string, number, etc.) */
  type: string;
  /** The processed value (signal, primitive, or complex object) */
  value: unknown;
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
 * Creates a reactive computed signal for template strings.
 * Uses safe template resolution with automatic signal dependency tracking.
 */
function createTemplateSignal(template: string, contextNode: Record<string, unknown>): Signal.Computed<string> {
  // Clean context - all contextNode properties accessible via 'this'
  const context = {
    this: contextNode,
    window: globalThis.window,
    document: globalThis.document
  };
  return new Signal.Computed(() => {
    // Synchronously resolve template for computed signal
    return resolveTemplate(template, context);
  });
}

// === PROPERTY PATTERN CLASSIFICATION ===

/**
 * Value type classification with regex patterns
 */
const VALUE_PATTERNS = {
  TEMPLATE: /\$\{/,           // Template literals: 'Hello ${name}'
  ACCESSOR: /^(window\.|document\.|this\.)/,  // Property accessors: 'window.data'
  FUNCTION: (v: unknown) => typeof v === 'function',
  STRING: (v: unknown) => typeof v === 'string',
  OBJECT: (v: unknown) => v !== null && typeof v === 'object' && !Array.isArray(v),
  ARRAY: (v: unknown) => Array.isArray(v),
  PRIMITIVE: (v: unknown) => ['number', 'boolean'].includes(typeof v)
} as const;

/**
 * Classifies a value into a processing pattern.
 * Returns a pattern string that identifies how the value should be processed.
 * 
 * @param value - Property value to classify
 * @returns Pattern string for switch statement matching
 */
export function classifyProperty(value: unknown): string {
  // Determine value pattern (order matters - most specific first)
  if (VALUE_PATTERNS.FUNCTION(value)) {
    return 'function';
  } else if (typeof value === 'string') {
    if (VALUE_PATTERNS.TEMPLATE.test(value)) {
      return 'template';
    } else if (VALUE_PATTERNS.ACCESSOR.test(value)) {
      return 'accessor';
    } else {
      return 'string';
    }
  } else if (VALUE_PATTERNS.OBJECT(value) && (value as any)?.prototype && typeof (value as any).prototype === 'string') {
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
  template: (_key: string, value: string, contextNode: Record<string, unknown>): ProcessedProperty => {
    try {
      const computed = createTemplateSignal(value, contextNode);
      return {
        type: 'Signal.Computed',
        value: computed,
        isValid: validateComputedValue(computed)
      };
    } catch (error) {
      return createErrorProperty(`Template processing failed: ${error}`, value);
    }
  },

  accessor: (_key: string, value: string, contextNode: Record<string, unknown>): ProcessedProperty => {
    try {
      const context = {
        this: contextNode,
        window: globalThis.window,
        document: globalThis.document,
        // ...contextNode
      };
      const resolved = resolveTemplateProperty(context, value);
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

  function: (_key: string, value: Function, contextNode: Record<string, unknown>): ProcessedProperty => ({
    type: 'function',
    value: value.bind(contextNode), // ← Pre-bind to the element
    isValid: true
  }),

  namespaced: (key: string, value: unknown, contextNode: Record<string, unknown>): ProcessedProperty => ({
    type: 'namespaced',
    value: processNamespacedProperty(key, value as any, contextNode),
    isValid: true
  }),

  primitive: (_key: string, value: unknown): ProcessedProperty => ({
    type: getValueType(value),
    value: value,
    isValid: true  // All primitive values are valid for signals
  })
};

/**
 * Creates an error ProcessedProperty.
 */
function createErrorProperty(error: string, originalValue?: unknown): ProcessedProperty {
  return {
    type: 'error',
    value: originalValue || null,
    isValid: false,
    error
  };
}

// === SPECIALIZED PROPERTY PROCESSORS ===

/**
 * Processes scope/reactive properties ($name, $count, etc.).
 * These ALWAYS become signals unless they're functions or namespaced objects.
 * Called during the reactive property initialization phase.
 * 
 * @param key - The scope property name (starts with $)
 * @param value - The property value to process
 * @param contextNode - Context for template/accessor evaluation
 * @returns ProcessedProperty optimized for scope property handling
 */
export function processScopeProperty(
  key: string,
  value: unknown,
  contextNode: Record<string, unknown>
): ProcessedProperty {
  try {
    const pattern = classifyProperty(value);
    // let processed: ProcessedProperty;

    switch (pattern) {
      case 'function':
        // Scope functions remain as functions (unusual but valid)
        return ValueProcessors.function(key, value as Function, contextNode);

      case 'namespaced':
        // Scope namespaced objects
        return ValueProcessors.namespaced(key, value, contextNode);

      case 'template':
        // Template → Computed Signal
        return ValueProcessors.template(key, value as string, contextNode);

      case 'accessor':
        // Accessor → Resolve then wrap in signal if needed
        return ValueProcessors.accessor(key, value as string, contextNode);

      case 'string':
      case 'primitive':
      case 'array':
      case 'object':
      default:
        // Everything else becomes a reactive signal
        const signal = new Signal.State(value);
        return {
          type: 'Signal.State',
          value: signal,
          isValid: true  // All signal values are valid, including empty strings, 0, false, etc.
        };
    }

  } catch (error) {
    return createErrorProperty(`Scope property processing failed for "${key}": ${error}`, value);
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
  value: unknown,
  contextNode: Record<string, unknown>
): ProcessedProperty {
  try {
    const pattern = classifyProperty(value);

    switch (pattern) {
      case 'function':
        // Functions stay as functions (events, callbacks)
        return ValueProcessors.function(key, value as Function, contextNode);

      case 'namespaced':
        // Namespaced objects for complex behaviors
        return ValueProcessors.namespaced(key, value, contextNode);

      case 'template':
        // Templates become computed for reactivity
        return ValueProcessors.template(key, value as string, contextNode);

      case 'accessor':
        // Accessors get resolved
        return ValueProcessors.accessor(key, value as string, contextNode);

      case 'string':
      case 'primitive':
      case 'array':
      case 'object':
      default:
        // Everything else stays as primitive values
        return ValueProcessors.primitive(key, value);
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
  value: unknown,
  contextNode: Record<string, unknown>
): ProcessedProperty {
  try {
    const pattern = classifyProperty(value);

    switch (pattern) {
      case 'template':
        // Templates always become computed for reactive attributes
        return ValueProcessors.template(attributeName, value as string, contextNode);

      case 'accessor':
        // Accessors get resolved
        return ValueProcessors.accessor(attributeName, value as string, contextNode);

      case 'function':
        // Functions become computed signals for reactive attribute updates
        try {
          const computed = new Signal.Computed((value as Function).bind(contextNode));
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
        return ValueProcessors.primitive(attributeName, value);
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
    computed.get();
    return true;
  } catch {
    return false;
  }
}

/**
 * Determines the type/type of a value for the ProcessedProperty format.
 * Handles signals, primitives, objects, arrays, and complex types.
 */
function getValueType(value: unknown): string {
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