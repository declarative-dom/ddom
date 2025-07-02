/**
 * Consolidated Properties Module
 *
 * This module provides a comprehensive property handling system for DDOM, combining:
 * - Template literals with ${...} expressions and reactive binding
 * - Property accessor strings (window.*, document.*, this.*)
 * - Native ES6 getter/setter support with computed signals
 * - Dynamic property handlers for special DDOM properties
 * - Unified property resolution and binding logic
 *
 * The module uses modern JavaScript patterns with ultra-fine-grained reactivity,
 * automatic cleanup, and optimized performance.
 */

import { define } from './customElements';

import { adoptNode } from './elements';

import { Signal, createEffect, ComponentSignalWatcher } from './signals';

import { insertRules } from './styleSheets';

import { MappedArray, isMappedArrayExpr } from './arrays';

import { isNamespacedProperty, processNamespacedProperty } from './namespaces';

import {
  DocumentSpec,
  DOMNode,
  DOMSpec,
  HTMLElementSpec,
  StyleExpr,
  WindowSpec,
} from '../../types/src';

import { DOMSpecOptions } from './elements';

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

// === REACTIVE PROPERTY CREATION ===

/**
 * Creates a reactive property using a direct Signal.State object or MappedArray.
 * This ensures proper dependency tracking with the TC39 Signals polyfill.
 * Handles MappedArrayExpr objects by creating MappedArray instances and returning their computed signals.
 *
 * @param el - The element to attach the property to
 * @param property - The property name
 * @param initialValue - The initial value for the property (can be MappedArrayExpr)
 * @returns The Signal.State instance or Signal.Computed from MappedArray
 */
export function createReactiveProperty(
  el: any,
  property: string,
  initialValue: any
): Signal.State<any> | Signal.Computed<any> {
  // Handle MappedArrayExpr objects
  if (isMappedArrayExpr(initialValue)) {
    // Create MappedArray instance with element as context
    const mappedArray = new MappedArray(initialValue, el instanceof Element ? el : undefined);
    
    // Store the MappedArray instance for potential cleanup
    if (!el.__ddom_mapped_arrays) {
      el.__ddom_mapped_arrays = [];
    }
    el.__ddom_mapped_arrays.push(mappedArray);
    
    // Return the computed signal from MappedArray
    const computedSignal = mappedArray.getSignal();
    el[property] = computedSignal;
    return computedSignal;
  }
  
  // Handle regular values with Signal.State
  const signal = new Signal.State(initialValue);
  el[property] = signal;
  return signal;
}

// === REACTIVE BINDING UTILITIES ===

/**
 * Creates a reactive binding with automatic cleanup support.
 * Consolidates the common pattern of computed signals + effects + cleanup.
 *
 * @param computedSignal - The computed signal to bind
 * @param updateFn - Function to call when the signal value changes
 * @param shouldUpdate - Optional function to determine if update should occur
 * @returns A cleanup function to dispose of the reactive binding
 */
function createReactiveBinding<T>(
  computedSignal: Signal.Computed<T>,
  updateFn: (value: T) => void,
  shouldUpdate?: (newValue: T, currentValue?: T) => boolean
): () => void {
  const componentWatcher = (globalThis as any).__ddom_component_watcher as
    | ComponentSignalWatcher
    | undefined;

  const cleanup = createEffect(() => {
    const newValue = computedSignal.get();

    // Only update if shouldUpdate returns true (or if no shouldUpdate provided)
    if (!shouldUpdate || shouldUpdate(newValue)) {
      updateFn(newValue);
    }
  }, componentWatcher);

  // Auto-cleanup with AbortController if available
  const signal = (globalThis as any).__ddom_abort_signal;
  if (signal && !signal.aborted) {
    signal.addEventListener('abort', cleanup, { once: true });
  }

  return cleanup;
}

/**
 * Creates a reactive template binding for any update function.
 * Handles template compilation and reactive updates in one place.
 *
 * @param template - The template string to make reactive
 * @param contextNode - The DOM node to use as context
 * @param updateFn - Function to call when the template value changes
 * @param shouldUpdate - Optional function to determine if update should occur
 * @returns A cleanup function to dispose of the reactive binding
 */
function bindReactiveTemplate(
  template: string,
  contextNode: Node,
  updateFn: (value: string) => void,
  shouldUpdate?: (newValue: string, currentValue?: string) => boolean
): () => void {
  const computedValue = computedTemplate(template, contextNode);
  return createReactiveBinding(computedValue, updateFn, shouldUpdate);
}

/**
 * Unified attribute setter with proper type handling.
 * Handles boolean attributes, null/undefined values, and string conversion.
 *
 * @param el - The element to set the attribute on
 * @param name - The attribute name
 * @param value - The attribute value to set
 */
function setAttributeValue(el: Element, name: string, value: any): void {
  if (typeof value === 'boolean') {
    value ? el.setAttribute(name, '') : el.removeAttribute(name);
  } else if (value == null) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, String(value));
  }
}

/**
 * Processes a single attribute with automatic reactive/static detection.
 *
 * @param el - The element to set the attribute on
 * @param attrName - The attribute name
 * @param attrValue - The attribute value (can be string, function, or other types)
 */
function processAttribute(el: Element, attrName: string, attrValue: any): void {
  if (typeof attrValue === 'string' && isTemplateLiteral(attrValue)) {
    // Reactive template expression
    bindAttributeTemplate(el, attrName, attrValue);
  } else if (typeof attrValue === 'function') {
    // Reactive function attribute
    bindAttributeFunction(el, attrName, attrValue);
  } else if (typeof attrValue === 'string') {
    // Static string - evaluate with context
    const evaluatedValue = parseTemplateLiteral(attrValue, el);
    setAttributeValue(el, attrName, evaluatedValue);
  } else {
    // Direct value
    setAttributeValue(el, attrName, attrValue);
  }
}

/**
 * Creates a property handler wrapper to reduce boilerplate.
 * Provides consistent error handling and conditional execution for handlers.
 *
 * @param handlerFn - The handler function to wrap
 * @param condition - Optional condition function to determine if handler should execute
 * @returns A standardized DDOM property handler function
 */
function createHandler(
  handlerFn: (value: any, el: DOMNode, options?: DOMSpecOptions) => void,
  condition?: (el: DOMNode, options?: DOMSpecOptions) => boolean
) {
  return (
    spec: DOMSpec,
    el: DOMNode,
    key: string,
    value: any,
    options: DOMSpecOptions = {}
  ): void => {
    if (!value || (condition && !condition(el, options))) return;

    try {
      handlerFn(value, el, options);
    } catch (error) {
      console.warn(`Handler failed for property "${key}":`, error);
    }
  };
}

//  === HANDLERS ===

/**
 * Type definition for DDOM property handlers.
 * Each handler receives the spec, element, property key, value, and optional options.
 */
export type DDOMPropertyHandler = (
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  value: any,
  options?: DOMSpecOptions
) => void;

/**
 * Handles the `attributes` property - processes declarative attribute objects.
 * Supports reactive templates, function attributes, and static values.
 */
export function handleAttributesProperty(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  value: any,
  _options: DOMSpecOptions = {}
): void {
  if (!value || typeof value !== 'object' || !(el instanceof Element)) return;

  Object.entries(value).forEach(([attrName, attrValue]) =>
    processAttribute(el, attrName, attrValue)
  );
}

/**
 * Simplified async handlers using createHandler wrapper.
 * Handles custom element definitions by delegating to the define function.
 */
export const handleCustomElementsProperty = createHandler((value, _el, _options) =>
  define(value)
);

/**
 * Handles the document property by adopting document specifications.
 * Only executes when the element is the window object.
 */
export const handleDocumentProperty = createHandler(
  (value, _el, options = {}) => adoptNode(value as DocumentSpec, document, options),
  (el) => el === window
);

/**
 * Handles the body property by adopting body specifications.
 * Only executes when the element is the document or has a documentElement property.
 */
export const handleBodyProperty = createHandler(
  (value, _el, options = {}) => adoptNode(value as HTMLElementSpec, document.body, options),
  (el) => el === document || 'documentElement' in el
);

/**
 * Handles the head property by adopting head specifications.
 * Only executes when the element is the document or has a documentElement property.
 */
export const handleHeadProperty = createHandler(
  (value, _el, options = {}) => adoptNode(value as HTMLElementSpec, document.head, options),
  (el) => el === document || 'documentElement' in el
);

/**
 * Handles the window property by adopting window specifications.
 * Adopts window-level DOM specifications into the global window object.
 */
export const handleWindowProperty = createHandler((value, _el, options = {}) =>
  adoptNode(value as WindowSpec, window, options)
);

export const handleStyleProperty = createHandler(
  (value, el, _options = {}) => adoptStyles(el as Element, value),
  (el, options = {}) => el instanceof Element && (options.css !== false)
);

// === VALUE RESOLUTION (Pure Functions) ===

/**
 * Resolves a property value to its final form without side effects.
 * This is a pure function that only transforms values - no DOM manipulation.
 * 
 * @param key - The property name
 * @param value - The property value to resolve
 * @param contextNode - The context for template/accessor evaluation
 * @param options - Optional configuration
 * @returns Resolved value (signals, computed signals, or primitives)
 */
export function resolvePropertyValue(
  key: string,
  value: any,
  contextNode: any, // Accept any context
  options: DOMSpecOptions = {}
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

// === PROPERTY ASSIGNMENT (Side Effects) ===

/**
 * Evaluates a resolved value to its final primitive form with validity checking.
 * This is the counterpart to assignPropertyValue - it extracts values and determines validity.
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

/**
 * Assigns a resolved value to an element property with appropriate DDOM logic.
 * Handles reactive properties, namespaced properties, and DOM binding.
 * 
 * @param el - The element to assign the property to
 * @param key - The property name
 * @param value - The already-resolved property value
 * @param options - Optional configuration
 */
export function assignPropertyValue(
  el: any,
  key: string,
  value: any,
  options: DOMSpecOptions = {}
): void {
  // Handle namespaced properties
  if (isNamespacedProperty(value)) {
    processNamespacedProperty({} as any, el, key, value, options);
    return;
  }

  // Handle reactive properties (only $-prefixed)
  if (shouldBeSignal(key, value)) {
    if (typeof value === 'object' && value !== null && Signal.isState(value)) {
      el[key] = value; // Already a signal
    } else if (typeof value === 'object' && value !== null && Signal.isComputed(value)) {
      el[key] = value; // Already a computed signal
    } else if (isMappedArrayExpr(value)) {
      createReactiveProperty(el, key, value); // Create MappedArray -> Computed Signal
    } else {
      createReactiveProperty(el, key, value); // Create new Signal.State
    }
    return;
  }

  // Handle template literals on regular properties (create reactive DOM binding)
  // FIXED: Check if value is a computed signal from template resolution
  if (typeof value === 'object' && value !== null && Signal.isComputed(value) && !key.startsWith('$')) {
    // For computed signals, we need to create an effect to update the property
    createReactiveBinding(
      value as Signal.Computed<any>,
      (newValue) => (el[key] = newValue),
      (newValue) => el[key] !== newValue
    );
    return;
  }

  // Handle functions
  if (typeof value === 'function') {
    el[key] = value;
    return;
  }

  // Everything else: direct assignment
  el[key] = value;
}

/**
 * Default property handler for properties that don't have specialized handlers.
 * Uses the modular resolve-then-assign pattern directly.
 * 
 * @param spec - The declarative DOM specification
 * @param el - The target DOM node
 * @param key - The property key
 * @param value - The property value
 * @param options - Optional configuration object
 */
export function handleDefaultProperty(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  value: any,
  options: DOMSpecOptions = {}
): void {
  if (!Object.hasOwn(el, key)) {
    // Property doesn't exist - resolve then assign
    const resolvedValue = resolvePropertyValue(key, value, el, options);
    assignPropertyValue(el, key, resolvedValue, options);
  }
}

/**
 * Gets the appropriate handler function for a given property key.
 * Uses a switch statement for optimal performance and clear code organization.
 *
 * @param key - The property key to get a handler for
 * @returns The appropriate handler function for the property
 * @example
 * ```typescript
 * const handler = getDOMHandler('attributes', { class: 'test' });
 * handler(spec, element, 'attributes', value, options);
 * ```
 */
export function getDOMHandler(key: string): DDOMPropertyHandler {
  switch (key) {
    case 'attributes':
      return handleAttributesProperty;

    case 'customElements':
      return handleCustomElementsProperty;

    case 'document':
      return handleDocumentProperty;

    case 'body':
      return handleBodyProperty;

    case 'head':
      return handleHeadProperty;

    case 'style':
      return handleStyleProperty;

    case 'window':
      return handleWindowProperty;

    default:
      return handleDefaultProperty;
  }
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

/**
 * Sets up reactive template binding for a property.
 * Creates a reactive binding that updates the property when the template expression changes.
 *
 * @param el - The element containing the property
 * @param property - The property name to bind to
 * @param template - The template string containing reactive expressions
 * @returns A cleanup function to dispose of the reactive binding
 */
export function bindPropertyTemplate(
  el: any,
  property: string,
  template: string
): () => void {
  return bindReactiveTemplate(
    template,
    el,
    (newValue) => (el[property] = newValue),
    (newValue) => el[property] !== newValue
  );
}

/**
 * Sets up reactive template binding for an attribute.
 * Creates a reactive binding that updates the attribute when the template expression changes.
 *
 * @param el - The element to set the attribute on
 * @param attribute - The attribute name to bind to
 * @param template - The template string containing reactive expressions
 * @returns A cleanup function to dispose of the reactive binding
 */
export function bindAttributeTemplate(
  el: Element,
  attribute: string,
  template: string
): () => void {
  return bindReactiveTemplate(
    template,
    el,
    (newValue) => {
      if (newValue === null || newValue === undefined || newValue === '') {
        el.removeAttribute(attribute);
      } else {
        el.setAttribute(attribute, String(newValue));
      }
    },
    (newValue) => el.getAttribute(attribute) !== newValue
  );
}

/**
 * Sets up reactive function binding for an attribute.
 * Creates a computed signal from the function and binds it to the attribute.
 *
 * @param el - The element to set the attribute on
 * @param attribute - The attribute name to bind to
 * @param attrFunction - The function that computes the attribute value
 * @returns A cleanup function to dispose of the reactive binding
 */
export function bindAttributeFunction(
  el: Element,
  attribute: string,
  attrFunction: () => any
): () => void {
  const computedValue = new Signal.Computed(() => {
    try {
      return attrFunction.call(el);
    } catch (error) {
      console.warn(`Attribute function evaluation failed for "${attribute}":`, error);
      return null;
    }
  });
  
  return createReactiveBinding(
    computedValue,
    (newValue) => setAttributeValue(el, attribute, newValue),
    (newValue) => {
      const currentValue = el.getAttribute(attribute);
      return newValue !== currentValue;
    }
  );
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

/**
 * Processes a property using the appropriate DDOM handler.
 * This is the main entry point for property processing, dispatching to specialized handlers.
 *
 * @param spec - The declarative DOM specification
 * @param el - The target DOM node
 * @param key - The property key
 * @param value - The property value
 * @param options - Optional configuration object with css flag, ignoreKeys and other options
 */
export function processProperty(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  value: any,
  options: DOMSpecOptions = {}
): void {
  const handler = getDOMHandler(key);
  handler(spec, el, key, value, options);
}

// === UTILITY FUNCTIONS ===

/**
 * Adopts CSS styles for an element using scoped selectors.
 * Generates unique selectors and applies styles to the global DDOM stylesheet.
 *
 * @param el - The DOM element to apply styles to
 * @param styles - The declarative CSS properties object
 */
async function adoptStyles(el: Element, styles: StyleExpr): Promise<void> {
  // Generate a unique selector for this element
  const selector = el.id ? `#${el.id}` : generatePathSelector(el);

  insertRules(styles, selector);
}

/**
 * Generates a path-based CSS selector for an element.
 * Creates a unique selector using element hierarchy and nth-of-type selectors.
 *
 * @param el - The element to generate a selector for
 * @returns A unique CSS selector string
 */
/**
 * Generates a path-based CSS selector for an element.
 * Creates a unique selector using element hierarchy and nth-of-type selectors.
 *
 * @param el - The element to generate a selector for
 * @returns A unique CSS selector string
 */
function generatePathSelector(el: Element): string {
  const path: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.documentElement) {
    const tagName = current.tagName.toLowerCase();
    const parent: Element | null = current.parentElement;

    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (child: Element) => child.tagName.toLowerCase() === tagName
      );

      if (siblings.length === 1) {
        path.unshift(tagName);
      } else {
        const index = siblings.indexOf(current) + 1;
        path.unshift(`${tagName}:nth-of-type(${index})`);
      }
    } else {
      path.unshift(tagName);
    }

    current = parent;
  }

  return path.join(' > ');
}
