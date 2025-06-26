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

import { define } from '../customElements';

import { adoptNode } from '../elements';

import {
  Signal,
  createEffect,
  ComponentSignalWatcher,
  createReactiveProperty,
} from '../events';

import { insertRules } from '../styleSheets';

import {
  DocumentSpec,
  DOMNode,
  DOMSpec,
  HTMLElementSpec,
  StyleExpr,
  WindowSpec,
} from '../../../types/src';

// === PROPERTY DETECTION AND CLASSIFICATION ===

/**
 * Properties that are immutable after element creation (structural identity).
 * These properties define the fundamental structure and should never be reactive.
 */
export const IMMUTABLE_PROPERTIES = new Set(['id', 'tagName']);

/**
 * Properties that should use imperative updates rather than signal assignment (mutable state).
 * These are native DOM properties that should be set directly rather than wrapped in signals.
 */
export const IMPERATIVE_PROPERTIES = new Set([
  ...Object.getOwnPropertyNames(Node.prototype),
  ...Object.getOwnPropertyNames(Element.prototype),
  ...Object.getOwnPropertyNames(HTMLElement.prototype),
]);

/**
 * Detects if a string is a template literal containing reactive expressions.
 * Simple detection - just looks for ${. To display literal ${} in text,
 * escape the dollar sign with a backslash: \${
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
 * Detects if a property descriptor contains a getter function.
 *
 * @param descriptor - The property descriptor to check
 * @returns True if the descriptor has a getter
 */
export function isGetterDescriptor(descriptor: PropertyDescriptor): boolean {
  return descriptor.get !== undefined;
}

/**
 * Detects if a property descriptor contains a setter function.
 *
 * @param descriptor - The property descriptor to check
 * @returns True if the descriptor has a setter
 */
export function isSetterDescriptor(descriptor: PropertyDescriptor): boolean {
  return descriptor.set !== undefined;
}

/**
 * Determines if a property should be made reactive based on DDOM rules.
 * Properties are reactive if they are not:
 * - Immutable (id, tagName)
 * - Imperative DOM properties
 * - Internal properties (starting with _)
 * - Functions
 * - Template literals (handled separately)
 * - Property accessors (resolved separately)
 *
 * @param key - The property name
 * @param value - The property value
 * @returns True if the property should be wrapped in a signal
 */
export function shouldBeSignal(key: string, value: any): boolean {
  return (
    !IMMUTABLE_PROPERTIES.has(key) &&
    !IMPERATIVE_PROPERTIES.has(key) &&
    !key.startsWith('_') &&
    typeof value !== 'function' &&
    !(typeof value === 'string' && isTemplateLiteral(value)) &&
    !(typeof value === 'string' && isPropertyAccessor(value))
  );
}

// === REACTIVE BINDING UTILITIES ===

/**
 * Creates a reactive binding with automatic cleanup support.
 * Consolidates the common pattern of computed signals + effects + cleanup.
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
 */
function bindReactiveTemplate(
  template: string,
  contextNode: Node,
  updateFn: (value: string) => void,
  shouldUpdate?: (newValue: string, currentValue?: string) => boolean,
  dollarProperties?: DollarProperties
): () => void {
  const computedValue = computedTemplate(template, contextNode, dollarProperties);
  return createReactiveBinding(computedValue, updateFn, shouldUpdate);
}

/**
 * Unified attribute setter with proper type handling.
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
 */
function processAttribute(el: Element, attrName: string, attrValue: any, dollarProperties?: DollarProperties): void {
  if (typeof attrValue === 'string' && isTemplateLiteral(attrValue)) {
    // Reactive template expression
    bindAttributeTemplate(el, attrName, attrValue, dollarProperties);
  } else if (typeof attrValue === 'function') {
    // Function attribute - evaluate once with dollar properties
    const wrappedFunction = wrapFunctionWithDollarProperties(attrValue, dollarProperties);
    setAttributeValue(el, attrName, wrappedFunction(el));
  } else if (typeof attrValue === 'string') {
    // Static string - evaluate once with dollar properties
    const evaluatedValue = parseTemplateLiteralWithDollarProperties(attrValue, el, dollarProperties);
    setAttributeValue(el, attrName, evaluatedValue);
  } else {
    // Direct value
    setAttributeValue(el, attrName, attrValue);
  }
}

/**
 * Creates an async property handler wrapper to reduce boilerplate.
 */
function createHandler(
  handlerFn: (value: any, el: DOMNode, dollarProperties?: DollarProperties) => void,
  condition?: (el: DOMNode, css?: boolean) => boolean
) {
  return (
    spec: DOMSpec,
    el: DOMNode,
    key: string,
    descriptor: PropertyDescriptor,
    css: boolean = true,
    dollarProperties?: DollarProperties
  ): void => {
    const value = descriptor.value;
    if (!value || (condition && !condition(el, css))) return;

    try {
      handlerFn(value, el, dollarProperties);
    } catch (error) {
      console.warn(`Handler failed for property "${key}":`, error);
    }
  };
}

//  === HANDLERS ===

/**
 * Type definition for dollar property injection data.
 */
export type DollarProperties = {
  names: string[];
  values: any[];
};

/**
 * Type definition for DDOM property handlers.
 * Each handler receives the spec, element, property key, descriptor, optional CSS flag, and dollar properties.
 */
export type DDOMPropertyHandler = (
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  descriptor: PropertyDescriptor,
  css?: boolean,
  dollarProperties?: DollarProperties
) => void;

/**
 * Handles the `attributes` property - processes declarative attribute objects.
 * Supports reactive templates, function attributes, and static values.
 */
export function handleAttributesProperty(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  descriptor: PropertyDescriptor,
  css?: boolean,
  dollarProperties?: DollarProperties
): void {
  const value = descriptor.value;
  if (!value || typeof value !== 'object' || !(el instanceof Element)) return;

  Object.entries(value).forEach(([attrName, attrValue]) =>
    processAttribute(el, attrName, attrValue, dollarProperties)
  );
}

/**
 * Simplified async handlers using createHandler wrapper
 */
export const handleCustomElementsProperty = createHandler((value, el, dollarProperties) =>
  define(value)
);

export const handleDocumentProperty = createHandler(
  (value, el, dollarProperties) => adoptNode(value as DocumentSpec, document, true, [], dollarProperties),
  (el) => el === window
);

export const handleBodyProperty = createHandler(
  (value, el, dollarProperties) => adoptNode(value as HTMLElementSpec, document.body, true, [], dollarProperties),
  (el) => el === document || 'documentElement' in el
);

export const handleHeadProperty = createHandler(
  (value, el, dollarProperties) => adoptNode(value as HTMLElementSpec, document.head, true, [], dollarProperties),
  (el) => el === document || 'documentElement' in el
);

export const handleWindowProperty = createHandler(
  (value, el, dollarProperties) => adoptNode(value as WindowSpec, window, true, [], dollarProperties)
);

export const handleStyleProperty = createHandler(
  (value, el, dollarProperties) => adoptStyles(el as Element, value),
  (el, css) => el instanceof Element && css == true
);

/**
 * Unified property value assignment with all the DDOM logic.
 */
function assignPropertyValue(
  el: any,
  key: string,
  descriptor: PropertyDescriptor,
  dollarProperties?: DollarProperties
): void {
  const value = descriptor.value;

  // Handle ES6 getter/setter
  if (isGetterDescriptor(descriptor) || isSetterDescriptor(descriptor)) {
    bindAccessorProperty(el, key, descriptor, dollarProperties);
    return;
  }

  // Handle property accessor strings
  if (typeof value === 'string' && isPropertyAccessor(value)) {
    const resolved = resolvePropertyAccessor(value, el);
    if (resolved !== null) {
      el[key] = resolved;
    } else {
      console.warn(
        `Failed to resolve property accessor "${value}" for property "${key}"`
      );
    }
    return;
  }

  // Handle template literals
  if (
    typeof value === 'string' &&
    isTemplateLiteral(value) &&
    !IMMUTABLE_PROPERTIES.has(key)
  ) {
    bindPropertyTemplate(el, key, value, dollarProperties);
    return;
  }

  // Handle functions
  if (typeof value === 'function') {
    el[key] = wrapFunctionWithDollarProperties(value, dollarProperties);
    return;
  }

  // Handle reactive properties
  if (shouldBeSignal(key, value)) {
    if (typeof value === 'object' && value !== null && Signal.isState(value)) {
      el[key] = value; // Already a signal
    } else {
      createReactiveProperty(el, key, value); // Create new signal
    }
    return;
  }

  // Default: set directly
  el[key] = value;
}

/**
 * Much simpler default handler!
 */
export function handleDefaultProperty(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  descriptor: PropertyDescriptor,
  css?: boolean,
  dollarProperties?: DollarProperties
): void {
  if (!Object.prototype.hasOwnProperty.call(el, key)) {
    assignPropertyValue(el, key, descriptor, dollarProperties);
  } else {
    // Property exists - update if it's a signal
    const existingValue = (el as any)[key];

    if (
      typeof existingValue === 'object' &&
      existingValue !== null &&
      Signal.isState(existingValue)
    ) {
      existingValue.set(descriptor.value);
    } else if (
      typeof existingValue !== 'object' ||
      !Signal.isComputed(existingValue)
    ) {
      (el as any)[key] = descriptor.value;
    }
  }
}

/**
 * Gets the appropriate handler function for a given property key.
 * This function serves as an index/dispatcher that returns the correct handler
 * based on the property name. Uses a switch statement for optimal performance
 * and clear code organization.
 *
 * @param key - The property key to get a handler for
 * @returns The appropriate handler function for the property
 * @example
 * ```typescript
 * const handler = getHandler('attributes');
 * handler(spec, element, 'attributes', descriptor, true);
 * ```
 */
export function getHandler(key: string): DDOMPropertyHandler {
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
 * Uses native JavaScript template literal syntax with the context node as 'this'.
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
 * @returns A function that evaluates the template with the given context
 */
export const bindTemplate = (template: string) => (context: any) =>
  new Function('return `' + template + '`').call(context);

/**
 * Creates a Computed Signal that automatically re-evaluates a template
 * when its dependencies change.
 *
 * @param template - The template string to make reactive
 * @param contextNode - The DOM node to use as context
 * @param dollarProperties - Dollar-prefixed properties for injection
 * @returns A Computed Signal that re-evaluates the template when dependencies change
 */
export function computedTemplate(
  template: string,
  contextNode: Node,
  dollarProperties?: DollarProperties
): Signal.Computed<string> {
  const templateFn = createTemplateWithDollarProperties(template, dollarProperties);

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
 */
export function bindPropertyTemplate(
  el: any,
  property: string,
  template: string,
  dollarProperties?: DollarProperties
): () => void {
  return bindReactiveTemplate(
    template,
    el,
    (newValue) => (el[property] = newValue),
    (newValue) => el[property] !== newValue,
    dollarProperties
  );
}

// === DOLLAR PROPERTY INJECTION UTILITIES ===

/**
 * Wraps a function with dollar property injection.
 * Creates a new function that has access to dollar-prefixed properties as direct variables.
 * For functions, we inject the signal objects so users can call .get() and .set().
 */
function wrapFunctionWithDollarProperties(
  fn: Function,
  dollarProperties?: DollarProperties
): Function {
  if (!dollarProperties || dollarProperties.names.length === 0) {
    return fn;
  }

  // For functions, inject the signals themselves so users can call .get() and .set()
  // We need to preserve the original closure, so we can't use new Function()
  return function(this: any, ...args: any[]) {
    // Create a new execution context with dollar properties
    const originalFn = fn;
    
    // Temporarily add dollar properties to the global scope for the function execution
    const globalBackup: Record<string, any> = {};
    dollarProperties!.names.forEach((name, index) => {
      if (name in globalThis) {
        globalBackup[name] = (globalThis as any)[name];
      }
      (globalThis as any)[name] = dollarProperties!.values[index];
    });
    
    try {
      // Call the original function with preserved context and arguments
      return originalFn.apply(this, args);
    } finally {
      // Restore global scope
      dollarProperties!.names.forEach((name) => {
        if (name in globalBackup) {
          (globalThis as any)[name] = globalBackup[name];
        } else {
          delete (globalThis as any)[name];
        }
      });
    }
  };
}

/**
 * Creates template function with dollar property injection.
 * For template literals, inject the current signal values.
 */
function createTemplateWithDollarProperties(
  template: string,
  dollarProperties?: DollarProperties
): (context: any) => string {
  if (!dollarProperties || dollarProperties.names.length === 0) {
    return bindTemplate(template);
  }

  // For template literals, create a function that dynamically gets signal values
  return (context: any) => {
    try {
      // Get current signal values for template evaluation
      const currentValues = dollarProperties.values.map(value => {
        if (typeof value === 'object' && value !== null && 'get' in value) {
          return value.get();
        }
        return value;
      });
      
      // Create template function with the current values
      const templateFn = new Function(
        ...dollarProperties.names,
        'return `' + template + '`'
      );
      
      return templateFn.call(context, ...currentValues);
    } catch (error) {
      console.warn('Template evaluation failed:', error);
      return template;
    }
  };
}

/**
 * Parses template literal with dollar property injection for static evaluation.
 */
function parseTemplateLiteralWithDollarProperties(
  template: string,
  contextNode: Node,
  dollarProperties?: DollarProperties
): string {
  if (!dollarProperties || dollarProperties.names.length === 0) {
    return parseTemplateLiteral(template, contextNode);
  }

  // For static evaluation, use current signal values
  const values = dollarProperties.values.map(value => {
    if (typeof value === 'object' && value !== null && 'get' in value) {
      return value.get();
    }
    return value;
  });

  try {
    // Create function with dollar properties injected
    const templateFn = new Function(
      ...dollarProperties.names,
      'return `' + template + '`'
    );
    return templateFn.call(contextNode, ...values);
  } catch (error) {
    console.warn(`Template evaluation with dollar properties failed: ${error}, Template: ${template}`);
    return parseTemplateLiteral(template, contextNode);
  }
}

/**
 * Sets up reactive template binding for an attribute.
 */
export function bindAttributeTemplate(
  el: Element,
  attribute: string,
  template: string,
  dollarProperties?: DollarProperties
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
    (newValue) => el.getAttribute(attribute) !== newValue,
    dollarProperties
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

// === ES6 GETTER/SETTER SUPPORT ===

/**
 * Converts a getter function into a computed signal and sets up reactive property binding.
 * This enables ES6 getter syntax to work with DDOM's reactive system.
 *
 * @param el - The DOM element
 * @param property - The property name
 * @param getter - The getter function
 * @returns A cleanup function to dispose of the effect
 */
export function bindGetterProperty(
  el: any,
  property: string,
  getter: () => any,
  dollarProperties?: DollarProperties
): () => void {
  // Wrap getter with dollar properties if available
  const wrappedGetter = wrapFunctionWithDollarProperties(getter, dollarProperties);
  
  // Create a computed signal from the getter
  const computedValue = new Signal.Computed(() => {
    try {
      return wrappedGetter.call(el);
    } catch (error) {
      console.warn(
        `Getter evaluation failed for property "${property}":`,
        error
      );
      return undefined;
    }
  });

  const isDOMProperty = IMPERATIVE_PROPERTIES.has(property);

  if (isDOMProperty) {
    // For DOM properties, set up reactive updates that modify the actual DOM property
    return createReactiveBinding(computedValue, (newValue) => {
      // Use Object.getOwnPropertyDescriptor to get the native setter if it exists
      const descriptor = Object.getOwnPropertyDescriptor(
        Object.getPrototypeOf(el),
        property
      );
      if (descriptor && descriptor.set) {
        descriptor.set.call(el, newValue);
      } else {
        (el as any)[property] = newValue;
      }
    });
  } else {
    // For non-DOM properties, define a getter that returns the computed value
    Object.defineProperty(el, property, {
      get: () => computedValue.get(),
      configurable: true,
      enumerable: true,
    });

    return () => {}; // No cleanup needed for simple getters
  }
}

/**
 * Sets up a setter function as a reactive property updater.
 * This enables ES6 setter syntax to work with DDOM's reactive system.
 *
 * @param el - The DOM element
 * @param property - The property name
 * @param setter - The setter function
 */
export function bindSetterProperty(
  el: any,
  property: string,
  setter: (value: any) => void
): void {
  // Define a property with the setter that can be called reactively
  Object.defineProperty(el, property, {
    set: function (value: any) {
      try {
        setter.call(this, value);
      } catch (error) {
        console.warn(
          `Setter evaluation failed for property "${property}":`,
          error
        );
      }
    },
    configurable: true,
    enumerable: true,
  });
}

/**
 * Sets up getter and/or setter for a property with ES6 accessor support.
 * For getters: Creates computed signal + effect that updates the property
 * For setters: Defines the property with the setter function
 *
 * @param el - The DOM element
 * @param property - The property name
 * @param descriptor - The property descriptor with get and/or set
 * @returns A cleanup function to dispose of getter effects (if any)
 */
export function bindAccessorProperty(
  el: any,
  property: string,
  descriptor: PropertyDescriptor,
  dollarProperties?: DollarProperties
): (() => void) | undefined {
  if (IMPERATIVE_PROPERTIES.has(property) && descriptor.get) {
    // if it's a DOM property with a getter, bind it as a computed signal
    // This allows the getter to be reactive and update the property dynamically
    return bindGetterProperty(el, property, descriptor.get, dollarProperties);
  } else {
    const wrappedGetter = descriptor.get ? 
      wrapFunctionWithDollarProperties(descriptor.get, dollarProperties) as (() => any) : undefined;
    const wrappedSetter = descriptor.set ? 
      wrapFunctionWithDollarProperties(descriptor.set, dollarProperties) as ((value: any) => void) : undefined;
      
    Object.defineProperty(el, property, {
      ...(wrappedSetter && { set: wrappedSetter }),
      ...(wrappedGetter && { get: wrappedGetter }),
      configurable: true,
      enumerable: true,
    });
    return undefined;
  }
}

/**
 * Processes a property using the appropriate DDOM handler.
 * This is the main entry point for property processing, dispatching to specialized handlers.
 *
 * @param spec - The declarative DOM specification
 * @param el - The target DOM node
 * @param key - The property key
 * @param descriptor - The property descriptor
 * @param css - Whether to process CSS styles (default: true)
 * @param dollarProperties - Dollar-prefixed properties for injection
 */
export function processProperty(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  descriptor: PropertyDescriptor,
  css: boolean = true,
  dollarProperties?: DollarProperties
): void {
  const handler = getHandler(key);
  handler(spec, el, key, descriptor, css, dollarProperties);
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
