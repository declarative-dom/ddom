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

import {
	define,
} from '../customElements';

import {
  adoptNode,
} from '../elements';

import {
	Signal,
	createEffect,
	ComponentSignalWatcher,
	createReactiveProperty
} from '../events';

import {
	insertRules,
} from '../styleSheets';

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
	...Object.getOwnPropertyNames(HTMLElement.prototype)
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
	return value.startsWith('window.') || 
		   value.startsWith('document.') || 
		   value.startsWith('this.');
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
	return !IMMUTABLE_PROPERTIES.has(key) &&
		   !IMPERATIVE_PROPERTIES.has(key) &&
		   !key.startsWith('_') &&
		   typeof value !== 'function' &&
		   !(typeof value === 'string' && isTemplateLiteral(value)) &&
		   !(typeof value === 'string' && isPropertyAccessor(value));
}

//  === HANDLERS ===

/**
 * Type definition for DDOM property handlers.
 * Each handler receives the spec, element, property key, descriptor, and optional CSS flag.
 */
export type DDOMPropertyHandler = (
  spec: DOMSpec, 
  el: DOMNode, 
  key: string, 
  descriptor: PropertyDescriptor, 
  css?: boolean
) => void;

/**
 * Handles the `attributes` property - processes declarative attribute objects.
 * Supports reactive templates, function attributes, and static values.
 */
export function handleAttributesProperty(
  spec: DOMSpec, 
  el: DOMNode, 
  key: string, 
  descriptor: PropertyDescriptor
): void {
  const value = descriptor.value;
  if (!value || typeof value !== 'object') return;

  for (const [attrName, attrValue] of Object.entries(value)) {
    if (typeof attrValue === 'string') {
      // Reactive template expression
      if (isTemplateLiteral(attrValue) && el instanceof Element) {
        bindAttributeTemplate(el, attrName, attrValue);
      } else {
        // Static string - evaluate once and set
        const evaluatedValue = parseTemplateLiteral(attrValue, el as Node);
        setAttribute(el as Element, attrName, evaluatedValue);
      }
    } else if (typeof attrValue === 'function') {
      // Function attribute - evaluate and set
      const evaluatedValue = attrValue(el);
      setAttribute(el as Element, attrName, evaluatedValue);
    } else {
      // Direct value assignment
      setAttribute(el as Element, attrName, attrValue);
    }
  }
}

/**
 * Handles the `customElements` property - defines custom elements.
 * Uses dynamic import to avoid circular dependencies.
 */
export async function handleCustomElementsProperty(
  spec: DOMSpec, 
  el: DOMNode, 
  key: string, 
  descriptor: PropertyDescriptor
): Promise<void> {
  const value = descriptor.value;
  if (!value) return;

  try {
    define(value);
  } catch (error) {
    console.warn('Failed to define custom element:', error);
  }
}

/**
 * Handles the `document` property - adopts document specifications.
 * Only processes when the element is the window object.
 */
export async function handleDocumentProperty(
  spec: DOMSpec, 
  el: DOMNode, 
  key: string, 
  descriptor: PropertyDescriptor
): Promise<void> {
  const value = descriptor.value;
  if (!value || el !== window) return;

  adoptNode(value as DocumentSpec, document);
}

/**
 * Handles the `body` property - adopts body specifications.
 * Processes when the element is document or has documentElement.
 */
export async function handleBodyProperty(
  spec: DOMSpec, 
  el: DOMNode, 
  key: string, 
  descriptor: PropertyDescriptor
): Promise<void> {
  const value = descriptor.value;
  if (!value || (el !== document && !('documentElement' in el))) return;

  adoptNode(value as HTMLElementSpec, document.body);
}

/**
 * Handles the `head` property - adopts head specifications.
 * Processes when the element is document or has documentElement.
 */
export async function handleHeadProperty(
  spec: DOMSpec, 
  el: DOMNode, 
  key: string, 
  descriptor: PropertyDescriptor
): Promise<void> {
  const value = descriptor.value;
  if (!value || (el !== document && !('documentElement' in el))) return;

  adoptNode(value as HTMLElementSpec, document.head);
}

/**
 * Handles the `style` property - processes CSS style objects.
 * Creates scoped CSS rules using unique selectors.
 */
export async function handleStyleProperty(
  spec: DOMSpec, 
  el: DOMNode, 
  key: string, 
  descriptor: PropertyDescriptor, 
  css?: boolean
): Promise<void> {
  const value = descriptor.value;
  if (!css || !value || typeof value !== 'object' || !(el instanceof Element)) return;

  adoptStyles(el, value);
}

/**
 * Handles the `window` property - adopts window specifications.
 */
export async function handleWindowProperty(
  spec: DOMSpec, 
  el: DOMNode, 
  key: string, 
  descriptor: PropertyDescriptor
): Promise<void> {
  const value = descriptor.value;
  if (!value) return;

  adoptNode(value as WindowSpec, window);
}

/**
 * Default handler for all other properties.
 * Implements the core DDOM property binding logic with reactive signals,
 * template literals, property accessors, and ES6 getter/setter support.
 */
export function handleDefaultProperty(
  spec: DOMSpec, 
  el: DOMNode, 
  key: string, 
  descriptor: PropertyDescriptor
): void {
  const hasProperty = Object.prototype.hasOwnProperty.call(el, key);
  
  if (!hasProperty) {
    // Handle native getter/setter properties (ES6+ syntax)
    if (isGetterDescriptor(descriptor) || isSetterDescriptor(descriptor)) {
      bindAccessorProperty(el, key, descriptor);
      return;
    }
    
    // Handle property accessor strings
    if (typeof descriptor.value === 'string' && isPropertyAccessor(descriptor.value)) {
      const resolved = resolvePropertyAccessor(descriptor.value, el as Node);
      if (resolved !== null) {
        (el as any)[key] = resolved;
      } else {
        console.warn(`Failed to resolve property accessor "${descriptor.value}" for property "${key}"`);
      }
      return;
    }
    
    // Handle template literal strings
    if (typeof descriptor.value === 'string' && isTemplateLiteral(descriptor.value) && !IMMUTABLE_PROPERTIES.has(key)) {
      bindPropertyTemplate(el, key, descriptor.value);
      return;
    }
    
    // Handle function properties
    if (typeof descriptor.value === 'function') {
      (el as any)[key] = descriptor.value;
      return;
    }
    
    // Handle reactive properties
    if (shouldBeSignal(key, descriptor.value)) {
      if (typeof descriptor.value === 'object' && descriptor.value !== null && Signal.isState(descriptor.value)) {
        // Already a signal - set directly
        (el as any)[key] = descriptor.value;
      } else {
        // Create reactive property
        createReactiveProperty(el, key, descriptor.value);
      }
      return;
    }
    
    // Protected/imperative properties - set once, never reactive
    (el as any)[key] = descriptor.value;
  } else {
    // Property exists - update if it's a signal
    const existingValue = (el as any)[key];
    
    if (typeof existingValue === 'object' && existingValue !== null && Signal.isState(existingValue)) {
      existingValue.set(descriptor.value);
    } else if (typeof existingValue !== 'object' || !Signal.isComputed(existingValue)) {
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
export function parseTemplateLiteral(template: string, contextNode: Node): string {
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
 * @returns A Computed Signal that re-evaluates the template when dependencies change
 */
export function computedTemplate(template: string, contextNode: Node): Signal.Computed<string> {
  const templateFn = bindTemplate(template);
  
  return new Signal.Computed(() => {
    try {
      return templateFn(contextNode);
    } catch (error) {
      console.warn(`Computed template evaluation failed: ${error}, Template: ${template}`);
      return template;
    }
  });
}

/**
 * Sets up reactive template binding for a property.
 * Creates a computed signal and effect that updates the property when template dependencies change.
 * Uses AbortController for modern cleanup pattern and component-specific watcher when available.
 * 
 * @param el - The DOM element
 * @param property - The property name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export function bindPropertyTemplate(
  el: any, 
  property: string, 
  template: string
): () => void {
  const computedValue = computedTemplate(template, el);
  
  // Use component-specific watcher if available, otherwise fall back to global
  const componentWatcher = (globalThis as any).__ddom_component_watcher as ComponentSignalWatcher | undefined;
  
  const cleanup = createEffect(() => {
    const newValue = computedValue.get();
    
    // Only update if the value actually changed
    if (el[property] !== newValue) {
      el[property] = newValue;
    }
  }, componentWatcher);

  // Use AbortController signal for automatic cleanup if available
  const signal = (globalThis as any).__ddom_abort_signal;
  if (signal && !signal.aborted) {
    signal.addEventListener('abort', cleanup, { once: true });
  }

  return cleanup;
}

/**
 * Sets up reactive template binding for an attribute.
 * Creates a computed signal and effect that updates the attribute when template dependencies change.
 * Uses AbortController for modern cleanup pattern and component-specific watcher when available.
 * 
 * @param el - The DOM element
 * @param attribute - The attribute name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export function bindAttributeTemplate(
  el: Element, 
  attribute: string, 
  template: string
): () => void {
  const computedValue = computedTemplate(template, el);
  
  // Use component-specific watcher if available, otherwise fall back to global
  const componentWatcher = (globalThis as any).__ddom_component_watcher as ComponentSignalWatcher | undefined;
  
  const cleanup = createEffect(() => {
    const newValue = computedValue.get();
    const currentValue = el.getAttribute(attribute);
    
    // Only update if the value actually changed
    if (currentValue !== newValue) {
      if (newValue === null || newValue === undefined || newValue === '') {
        el.removeAttribute(attribute);
      } else {
        el.setAttribute(attribute, String(newValue));
      }
    }
  }, componentWatcher);

  // Use AbortController signal for automatic cleanup if available
  const signal = (globalThis as any).__ddom_abort_signal;
  if (signal && !signal.aborted) {
    signal.addEventListener('abort', cleanup, { once: true });
  }

  return cleanup;
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
export function resolvePropertyAccessor(accessor: string, contextNode: Node): any {
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
  getter: () => any
): () => void {
  // Create a computed signal from the getter
  const computedValue = new Signal.Computed(() => {
    try {
      return getter.call(el);
    } catch (error) {
      console.warn(`Getter evaluation failed for property "${property}":`, error);
      return undefined;
    }
  });
  
  // Use component-specific watcher if available, otherwise fall back to global
  const componentWatcher = (globalThis as any).__ddom_component_watcher as ComponentSignalWatcher | undefined;
  const isDOMProperty = IMPERATIVE_PROPERTIES.has(property);
  
  if (isDOMProperty) {
    // For DOM properties, set up an effect that updates the actual DOM property
    const cleanup = createEffect(() => {
      const newValue = computedValue.get();
      
      // Update the actual DOM property directly
      (el as any)[property] = newValue;

    }, componentWatcher);

    // Use AbortController signal for automatic cleanup if available
    const signal = (globalThis as any).__ddom_abort_signal;
    if (signal && !signal.aborted) {
      signal.addEventListener('abort', cleanup, { once: true });
    }
    
    return cleanup;
  } else {
    // For non-DOM properties, define a getter that returns the computed value
    Object.defineProperty(el, property, {
      get: function() {
        return computedValue.get();
      },
      configurable: true,
      enumerable: true
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
    set: function(value: any) {
      try {
        setter.call(this, value);
      } catch (error) {
        console.warn(`Setter evaluation failed for property "${property}":`, error);
      }
    },
    configurable: true,
    enumerable: true
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
  descriptor: PropertyDescriptor
): (() => void) | undefined {
  if (descriptor.get && descriptor.set) {
    // Both getter and setter - use the original approach for now
    Object.defineProperty(el, property, {
      get: descriptor.get,
      set: descriptor.set,
      configurable: true,
      enumerable: true
    });
    return undefined;
  } else if (descriptor.get) {
    // Getter only - create computed signal for reactivity
    return bindGetterProperty(el, property, descriptor.get);
  } else if (descriptor.set) {
    // Setter only - define property with setter
    Object.defineProperty(el, property, {
      set: descriptor.set,
      configurable: true,
      enumerable: true
    });
    return undefined;
  }
  
  return undefined;
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
 */
export function processProperty(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  descriptor: PropertyDescriptor,
  css: boolean = true
): void {
  const handler = getHandler(key);
  handler(spec, el, key, descriptor, css);
}

// === UTILITY FUNCTIONS ===

/**
 * Efficiently sets an attribute on an element with proper type handling.
 * Handles boolean attributes, null/undefined values, and string conversion.
 * 
 * @param el - The element to set the attribute on
 * @param name - The attribute name
 * @param value - The attribute value
 */
function setAttribute(el: Element, name: string, value: any): void {
  if (typeof value === 'boolean') {
    if (value) {
      el.setAttribute(name, '');
    } else {
      el.removeAttribute(name);
    }
  } else if (value == null) {
    el.removeAttribute(name);
  } else {
    el.setAttribute(name, String(value));
  }
}

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