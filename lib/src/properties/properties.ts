/**
 * Consolidated Properties Module
 * 
 * This module combines template handling, property accessor resolution, and getter/setter support
 * into a unified property handling system for DDOM.
 * 
 * Features:
 * - Template literals with ${...} expressions
 * - Property accessor strings (window.*, document.*, this.*)
 * - Native ES6 getter/setter support with computed signals
 * - Reactive property binding and updates
 */

import {
	Signal,
	createEffect,
	ComponentSignalWatcher
} from '../events';

// === TEMPLATE HANDLING (from templates.ts) ===

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
 * Detects if a template string contains reactive expressions (${...}).
 * Simple detection - just looks for ${. To display literal ${} in text,
 * escape the dollar sign with a backslash: \${
 * 
 * @param template - The template string to check
 * @returns True if the template contains reactive expressions
 */
export function isTemplateLiteral(template: string): boolean {
  return template.includes('${');
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

// === PROPERTY ACCESSOR HANDLING (from accessors.ts) ===

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

// === GETTER/SETTER SUPPORT (new functionality) ===

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

  // Check if this is a standard DOM property that should be automatically updated
  const isDOMProperty = property === 'textContent' || property === 'innerHTML' || 
                       property === 'value' || property === 'title' || property === 'className';
  
  // Use component-specific watcher if available, otherwise fall back to global
  const componentWatcher = (globalThis as any).__ddom_component_watcher as ComponentSignalWatcher | undefined;
  
  if (isDOMProperty) {
    // For DOM properties, set up an effect that updates the actual DOM property
    const cleanup = createEffect(() => {
      const newValue = computedValue.get();
      
      // Update the actual DOM property directly
      if (property === 'textContent') {
        (el as Element).textContent = newValue;
      } else if (property === 'innerHTML') {
        (el as Element).innerHTML = newValue;
      } else if (property === 'value' && 'value' in el) {
        el.value = newValue;
      } else if (property === 'title') {
        (el as Element).setAttribute('title', newValue);
      } else if (property === 'className') {
        (el as Element).className = newValue;
      }
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