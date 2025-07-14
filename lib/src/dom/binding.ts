/**
 * DOM Property Binding System
 * 
 * This module handles all DOM mutations and property binding logic for the DDOM library.
 * It provides a clean interface for applying property resolutions to DOM elements,
 * separating pure property resolution logic from side-effect operations.
 * 
 * The binding system supports:
 * - Reactive property binding with signals and computed values
 * - Direct property assignment for static values
 * - DOM attribute manipulation with automatic type conversion
 * - CSS style property binding with reactive updates
 * - Event handler attachment
 * - Namespace property handling (arrays, storage, etc.)
 * 
 * This is where the "rubber meets the road" for DDOM's declarative-to-imperative
 * translation. All DOM mutations are centralized here to maintain clean separation
 * of concerns and enable easier testing and debugging.
 * 
 * @module dom/binding
 * @version 0.4.0
 * @author Declarative DOM Working Group
 */

import type { DOMSpec, DOMNode, DOMSpecOptions, HTMLElementSpec } from '../types';
import { generatePathSelector } from '../utils/helpers';
import { adoptDocument, appendChild, createElement } from './element';
import { createEffect, Signal, ComponentSignalWatcher } from '../core/signals';
import { processProperty, processAttributeValue } from '../core/properties';
import { processNamespacedProperty } from '../namespaces/index';
import type { ArraySignal } from '../namespaces/array';
import { insertRules } from './style-sheets';
import { define } from './custom-elements';



/**
 * Applies property resolution and binding to a DOM element (the impure DOM magic!).
 * This is where all DOM mutations and reactive bindings happen, using the pure 
 * property values resolved by the properties module.
 * 
 * @param spec - The declarative DOM specification object
 * @param el - The target DOM node to apply bindings to
 * @param key - The property name being processed
 * @param value - The property value to resolve and bind
 * @param options - Optional configuration for DOM operations
 * @returns void - This function performs side effects on the DOM element
 * 
 * @example
 * ```typescript
 * // Simple property binding
 * applyPropertyBinding(spec, element, 'textContent', 'Hello World');
 * 
 * // Reactive template binding
 * applyPropertyBinding(spec, element, 'textContent', 'Hello ${this.$name.get()}');
 * 
 * // Signal binding
 * const nameSignal = new Signal.State('John');
 * applyPropertyBinding(spec, element, 'textContent', nameSignal);
 * ```
 */
export function applyPropertyBinding(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  value: unknown,
  options: DOMSpecOptions = {}
): void {
  // Skip ignored keys
  if (options.ignoreKeys?.includes(key) || (options?.css === false && key === 'style')) {
    return;
  }

  // Handle special DOM properties with dedicated handlers
  switch (key) {
    case 'document':
      // Special handling for document property - adopt into existing document instead of replacing
      if (value && typeof value === 'object' && el === window) {
        // Apply the document spec directly to the document object
        adoptDocument(value, options);
        return;
      }
      break;

    case 'customElements':
      // Special handling for customElements - process array but don't assign to window.customElements
      if (Array.isArray(value)) {
        define(value);
      }
      break;

    case 'head':
    case 'body':
      // Special handling for head and body - adopt into existing elements instead of replacing
      if (value && typeof value === 'object' && el === document) {
        const targetElement = el[key as 'head' | 'body'];
        if (targetElement) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            applyPropertyBinding(value, targetElement, subKey, subValue, options);
          });
        }
        return;
      }
      break;

    case 'attributes':
      if (value && typeof value === 'object' && el instanceof Element) {
        applyAttributesBinding(el, value);
      }
      break;

    case 'style':
      // Generate a unique selector for this element
      const selector = (el as any).id ? `#${(el as any).id}` : generatePathSelector(el as Element);
      // Apply styles using the DDOM CSS rule system
      insertRules(value, selector);

      break;

    case 'children':
      options.ignoreKeys = []; // reset ignoreKeys prior to children processing
      if (Array.isArray(value)) {
        // Static children array - use simple element creation since binding.ts shouldn't depend on element.ts
        value.forEach((child: HTMLElementSpec, _index) => {
          if (child && typeof child === 'object' && child.tagName) {
            appendChild(child, el, options);
          }
        });
      } else if (value && typeof value === 'object' && value.prototype === 'Array') {
        // Reactive children array - use our enhanced reactive array binding
        const signal = processNamespacedProperty(key, value, el);
        if (signal) {
          bindReactiveArray(signal, el as Element, options);
        }
      } else {
        console.warn('❗ Invalid children value:', value);
      }
      break;

    default:
      // Standard property binding with reactive support
      applyStandardPropertyBinding(el, key, value, options);
      break;
  }
}

/**
 * Applies standard property binding using specialized property processors.
 * Uses the appropriate processor based on property type for optimal performance.
 */
function applyStandardPropertyBinding(
  el: DOMNode,
  key: string,
  value: unknown,
  _options: DOMSpecOptions
): void {
  // Use specialized native property processor
  const processed = processProperty(key, value, el);
  
  if (!processed.isValid) {
    console.warn(`❌ Invalid property ${key}:`, processed.error);
    return;
  }
  
  // Apply binding based on the processed property's type
  switch (processed.type) {
    case 'Signal.State':
    case 'Signal.Computed':
      bindSignalToProperty(el, key, processed.value);
      break;
      
    case 'function':
    case 'namespaced':
      (el as any)[key] = processed.value;
      break;
      
    default:
      // Primitive value: direct assignment
      (el as any)[key] = processed.value;
      break;
  }
}

/**
 * Binds a signal value to a DOM property with automatic updates.
 * Creates a reactive effect that updates the DOM property whenever the signal changes.
 * This is a low-level binding function for direct property assignment.
 * 
 * @param element - The DOM node to bind the property to
 * @param property - The property name to update (e.g., 'textContent', 'value', 'checked')
 * @param signal - The signal or computed value to bind to the property
 * @returns A cleanup function to remove the reactive effect
 * 
 * @example
 * ```typescript
 * const nameSignal = new Signal.State('John');
 * const cleanup = bindSignalToProperty(span, 'textContent', nameSignal);
 * 
 * // Later, to stop reactivity:
 * cleanup();
 * ```
 * 
 * @example
 * ```typescript
 * // Binding input value
 * const inputValue = new Signal.State('');
 * bindSignalToProperty(input, 'value', inputValue);
 * ```
 */
export function bindSignalToProperty(
  element: DOMNode,
  property: string,
  signal: Signal.State<any> | Signal.Computed<any>
): () => void {
  const updateProperty = () => {
    (element as any)[property] = signal.get();
  };

  // Set initial value
  updateProperty();

  // Set up reactive effect
  return createEffect(() => {
    updateProperty();
  });
}

/**
 * Binds a signal value to a DOM attribute with automatic updates.
 * Creates a reactive effect that updates the DOM attribute whenever the signal changes.
 * Handles null/undefined values by removing the attribute entirely.
 * 
 * @param element - The DOM element to bind the attribute to (must be an Element)
 * @param attributeName - The attribute name to update (e.g., 'class', 'data-value', 'aria-label')
 * @param signal - The signal or computed value to bind to the attribute
 * @returns A cleanup function to remove the reactive effect
 * 
 * @example
 * ```typescript
 * const classSignal = new Signal.State('active');
 * const cleanup = bindSignalToAttribute(div, 'class', classSignal);
 * 
 * // Updates the class attribute when signal changes
 * classSignal.set('inactive');
 * ```
 * 
 * @example
 * ```typescript
 * // Binding data attribute
 * const dataValue = new Signal.Computed(() => `item-${id.get()}`);
 * bindSignalToAttribute(element, 'data-item-id', dataValue);
 * ```
 * 
 * @example
 * ```typescript
 * // Conditional attribute (removes when null/undefined)
 * const ariaLabel = new Signal.Computed(() => showLabel.get() ? 'Close' : null);
 * bindSignalToAttribute(button, 'aria-label', ariaLabel);
 * ```
 */
export function bindSignalToAttribute(
  element: Element,
  attributeName: string,
  signal: Signal.State<any> | Signal.Computed<any>
): () => void {
  const updateAttribute = () => {
    const value = signal.get();
    setAttributeValue(element, attributeName, value);
  };

  // Set initial value
  updateAttribute();

  // Set up reactive effect
  return createEffect(() => {
    updateAttribute();
  });
}

/**
 * Applies attributes binding using specialized attribute value processing.
 * Uses the attribute-specific processor for optimal performance and correctness.
 * 
 * @param element - The DOM element to apply attributes to
 * @param attributes - Object containing attribute name/value pairs
 */
function applyAttributesBinding(element: Element, attributes: Record<string, any>): void {
  Object.entries(attributes).forEach(([attrName, attrValue]) => {
    // Use specialized attribute value processor
    const processed = processAttributeValue(attrName, attrValue, element);
    
    if (!processed.isValid) {
      console.warn(`❌ Invalid attribute ${attrName}:`, processed.error);
      return;
    }
    
    // Apply attribute binding based on the processed property's type
    switch (processed.type) {
      case 'Signal.State':
      case 'Signal.Computed':
        // Signal/computed value - set up reactive binding
        bindSignalToAttribute(element, attrName, processed.value);
        break;
        
      case 'function':
        // Function → Convert to computed signal and bind consistently
        const computed = new Signal.Computed(processed.value);
        bindSignalToAttribute(element, attrName, computed);
        break;

      case 'boolean':
        
      default:
        // Static value
        setAttributeValue(element, attrName, processed.value);
        break;
    }
  });
}

/**
 * Sets an attribute value with proper type handling.
 * Handles boolean attributes, null/undefined values, and string conversion.
 */
function setAttributeValue(element: Element, name: string, value: unknown): void {
  if (typeof value === 'boolean') {
    value ? element.setAttribute(name, '') : element.removeAttribute(name);
  } else if (value == null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, String(value));
  }
}

/**
 * Enhanced reactive array adoption with fine-grained updates.
 * This is the heart of DDOM's efficient list rendering - it tracks elements by stable keys,
 * performs surgical updates, and minimizes DOM manipulation for optimal performance.
 * 
 * @param arraySignal - The reactive array signal from the namespace system
 * @param parentElement - The parent DOM element to render items into
 * @param options - Optional configuration object with named parameters
 * 
 * @example
 * ```typescript
 * // Basic array adoption
 * const itemsSignal = new Signal.State([
 *   { tagName: 'li', textContent: 'Item 1' },
 *   { tagName: 'li', textContent: 'Item 2' }
 * ]);
 * bindReactiveArray(itemsSignal, listElement);
 * ```
 * 
 * @example
 * ```typescript
 * // With mutable property tracking for surgical updates
 * const itemsSignal = createArraySignal([
 *   { tagName: 'li', textContent: '${item.name}', $selected: false }
 * ], { mutableProps: ['textContent', '$selected'] });
 * bindReactiveArray(itemsSignal, listElement, { css: true });
 * ```
 */
export function bindReactiveArray(
  arraySignal: ArraySignal, // Enhanced signal with getMutableProps method
  parentElement: Element,
  options: DOMSpecOptions = {}
): void {

  // Keep track of rendered elements by stable keys for efficient updates
  const renderedElements = new Map<string, Element>();
  let previousItems: unknown[] = [];

  // Get mutable properties if available for surgical updates
  const mutableProps = typeof arraySignal.getMutableProps === 'function' 
    ? arraySignal.getMutableProps() 
    : [];

  // Function to update the current array state with fine-grained updates
  const updateArray = (items: unknown[]) => {
    // Consistent key generation function
    const getItemKey = (item: Record<string, unknown>) => (item as any).id || JSON.stringify(item);

    // Track components by stable keys, not indices
    const currentKeys = new Set<string>();
    const newComponentsByKey = new Map<string, Element>();
    const keysToCreate = new Set<string>();
    const keysToUpdate = new Set<string>();
    const keysToRemove = new Set<string>();

    // Build sets of current and new keys
    const previousKeys = new Set(
      previousItems.map((item) => getItemKey(item))
    );

    items.forEach((item: unknown) => {
      if (item && typeof item === 'object' && (item as any).tagName) {
        const key = getItemKey(item as Record<string, unknown>);
        currentKeys.add(key);

        if (previousKeys.has(key)) {
          // Check if properties changed - find by same key generation logic
          const previousItem = previousItems.find(
            (prev) => getItemKey(prev) === key
          );
          if (!deepEqual(item, previousItem)) {
            keysToUpdate.add(key);
          }
        } else {
          keysToCreate.add(key);
        }
      } else {
        console.warn('⚠️ Item missing tagName or not an object:', item);
      }
    });

    // Native Set difference operations
    for (const key of previousKeys) {
      if (!currentKeys.has(key)) {
        keysToRemove.add(key);
      }
    }

    // Remove unused components
    keysToRemove.forEach((key) => {
      const element = renderedElements.get(key);
      if (element && element.parentNode === parentElement) {
        element.remove();
      }
      renderedElements.delete(key);
    });

    // Create new components
    keysToCreate.forEach((key) => {
      const item = items.find((item) => getItemKey(item) === key);
      if (item) {
        const element = createElement(item, options);
        newComponentsByKey.set(key, element);
        renderedElements.set(key, element);
      }
    });

    // Update existing components (surgical updates using mutable props tracking)
    keysToUpdate.forEach((key) => {
      const item = items.find((item) => getItemKey(item) === key);
      const element = renderedElements.get(key);

      if (item && element) {
        // Only update properties that actually reference item/index data
        mutableProps.forEach((prop: string) => {
          if (prop in item) {
            const value = item[prop];
            if (prop.startsWith('$')) {
              // Update reactive property signal
              const signal = (element as any)[prop];
              if (signal && typeof signal.set === 'function') {
                signal.set(value);
              }
            } else {
              // Direct property assignment for non-reactive mutable properties
              (element as any)[prop] = value;
            }
          }
        });

        newComponentsByKey.set(key, element);
      }
    });

    // Reuse unchanged components
    currentKeys.forEach((key) => {
      if (!keysToCreate.has(key) && !keysToUpdate.has(key)) {
        const element = renderedElements.get(key);
        if (element) {
          newComponentsByKey.set(key, element);
        }
      }
    });

    // Efficient DOM manipulation with proper ordering
    const orderedElements = items
      .map((item) => newComponentsByKey.get(getItemKey(item)))
      .filter((element): element is Element => element !== undefined);

    // Surgical DOM manipulation - only touch what changed
    if (keysToCreate.size > 0 || keysToRemove.size > 0 || keysToUpdate.size > 0) {
      updateDOMOrder(parentElement, orderedElements);
    }

    // Update tracking
    previousItems = [...items];
  };

  // Set up reactive effect that handles both initial render and updates
  const componentWatcher = (globalThis as any).__ddom_component_watcher as ComponentSignalWatcher | undefined;

  const _effectCleanup = createEffect(() => {
    const currentItems = arraySignal.get();
    updateArray(currentItems);
    return () => { }; // Empty cleanup
  }, componentWatcher);
}

/**
 * Efficiently updates DOM element order to match desired arrangement.
 * Minimizes DOM manipulation by only moving elements that need repositioning.
 */
function updateDOMOrder(parentElement: Element, orderedElements: Element[]): void {
  const currentChildren = Array.from(parentElement.children);

  if (orderedElements.length === 0) {
    // Clear all children if no elements needed
    parentElement.replaceChildren();
  } else if (currentChildren.length === 0) {
    // Initial render - use fragment for efficiency
    const fragment = document.createDocumentFragment();
    orderedElements.forEach((element) => fragment.appendChild(element));
    parentElement.appendChild(fragment);
  } else {
    // Precise DOM updates - only move/add/remove what's needed
    const newElementSet = new Set(orderedElements);

    // Remove elements that shouldn't be there anymore
    for (const element of currentChildren) {
      if (!newElementSet.has(element)) {
        element.remove();
      }
    }

    // Add/reorder elements to match desired order
    for (let i = 0; i < orderedElements.length; i++) {
      const desiredElement = orderedElements[i];
      const currentElement = parentElement.children[i];

      if (currentElement !== desiredElement) {
        // Insert element at correct position
        if (i >= parentElement.children.length) {
          parentElement.appendChild(desiredElement);
        } else {
          parentElement.insertBefore(desiredElement, parentElement.children[i]);
        }
      }
    }
  }
}

/**
 * Efficient deep equality comparison with Object.is optimization.
 * Used for determining if array items have changed and need updates.
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b || typeof a !== 'object') return false;

  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  return (
    keysA.length === keysB.length &&
    keysA.every((key) => deepEqual((a as any)[key], (b as any)[key]))
  );
}
