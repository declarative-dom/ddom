/**
 * DOM Element Creation and Management
 * 
 * This module provides comprehensive DOM element creation, adoption, and management for DDOM.
 * It handles the complete lifecycle of DOM elements from creation to reactive property binding,
 * children management, and array adoption with fine-grained updates.
 * 
 * Key Features:
 * - Element creation from declarative specifications
 * - Property adoption with reactive binding
 * - Array adoption with efficient reconciliation
 * - Document and window adoption
 * - Comprehensive JSDoc documentation
 * 
 * @example
 * ```typescript
 * // Create a reactive button element
 * const button = createElement({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => console.log('clicked')
 * });
 * 
 * // Adopt an array of items
 * adoptArray(itemsSignal, listElement);
 * ```
 */

import {
  ArrayConfig,
  DocumentSpec,
  DOMSpec,
  HTMLElementSpec,
  WindowSpec,
  DOMNode,
} from '../types';

import { isNamespacedProperty, processNamespacedProperty } from '../namespaces';
import { createEffect, ComponentSignalWatcher, Signal } from '../signals';
import { processProperty, resolveProperty, PropertyResolution } from '../properties';
import { applyPropertyResolution } from './binding';
import { insertRules } from './style-sheets';

/**
 * Type definition for scope property injection data.
 * Maps property names to their reactive signal or function values.
 */
export type ReactiveProperties = Record<string, Signal.State<any> | Signal.Computed<any> | Function>;

/**
 * Options object for DOM specification functions.
 * Provides named arguments for common function parameters to improve API clarity.
 */
export interface DOMSpecOptions {
  /** Whether to process CSS styles (default: true) */
  css?: boolean;
  /** Array of property keys to ignore during adoption (default: []) */
  ignoreKeys?: string[];
  /** Reactive properties to inherit from parent scope */
  scopeReactiveProperties?: ReactiveProperties;
}

/**
 * Adopts a DocumentSpec into the current document context.
 * This function applies the declarative document properties to the global document object,
 * enabling reactive document-level properties like title, meta tags, and global styles.
 *
 * @param spec - The declarative document object to adopt
 * @example
 * ```typescript
 * adoptDocument({
 *   title: 'My App',
 *   head: { 
 *     children: [
 *       { tagName: 'meta', attributes: { charset: 'utf-8' } },
 *       { tagName: 'title', textContent: 'Dynamic Title' }
 *     ] 
 *   }
 * });
 * ```
 */
export function adoptDocument(spec: DocumentSpec): void {
  adoptNode(spec, document);
}

/**
 * Renders a declarative DOM specification on an existing DOM node.
 * This function applies properties from the declarative object to the target element,
 * handling children, attributes, styles, and other properties appropriately.
 *
 * Uses the modern reactivity model:
 * - Template literals with ${...} get computed signals + effects
 * - Non-function, non-templated properties get transparent signal proxies
 * - Protected properties (id, tagName) are set once and never reactive
 *
 * @param spec - The declarative DOM object to adopt
 * @param el - The target DOM node to apply properties to
 * @param options - Optional configuration object with named parameters
 * @example
 * ```typescript
 * adoptNode({
 *   textContent: 'Hello ${this.name}', // Template literal - creates computed signal
 *   count: 0, // Non-templated - gets transparent signal proxy
 *   id: 'my-element', // Protected - set once, never reactive
 *   style: { color: 'red' }
 * }, myElement, { css: true, ignoreKeys: ['id'] });
 * ```
 */
export function adoptNode(
  spec: DOMSpec,
  el: DOMNode,
  options: DOMSpecOptions = {}
): void {
  // Process all properties using key/value pairs
  const specEntries = Object.entries(spec);

  // Inherit parent reactive properties directly (simple assignment)
  if (options.scopeReactiveProperties) {
    Object.assign(el, options.scopeReactiveProperties);
  }

  // Filter reactive properties from spec for processing and child inheritance
  const localReactiveProperties = specEntries.filter(([key]) =>
    key.startsWith('$')
  );

  // Process reactive properties directly on this element
  localReactiveProperties.forEach(([key, value]) => {
    processProperty(spec, el, key, value, options);
  });

  // Combine parent and local reactive properties for children
  options.scopeReactiveProperties = {
    ...options.scopeReactiveProperties,
    ...Object.fromEntries(localReactiveProperties.map(([key]) => [key, (el as any)[key]]))
  };

  options.ignoreKeys = [
    'children',
    ...(options.ignoreKeys? options.ignoreKeys : []),
    ...Object.keys(localReactiveProperties || {}),
  ];

  // Handle protected properties first (id, tagName) - set once, never reactive
  if ('id' in spec && spec.id !== undefined && el instanceof HTMLElement) {
    const resolution = resolveProperty(spec, el, 'id', spec.id, options);
    applyPropertyResolution(spec, el, 'id', resolution, options);
    options.ignoreKeys.push('id');
  }

  // handle style property separately
  if (options.css && 'style' in spec && spec.style) {
	// Generate a unique selector for this element
	const selector = el.id ? `#${el.id}` : generatePathSelector(el as Element);
	// Apply styles using the DDOM CSS rule system
	insertRules(resolution.value, selector);
	options.ignoreKeys.push('style');
  }

  // Process all other properties with pure resolution and assignment separation
  specEntries.forEach(([key, value]) => {
    if (!options.ignoreKeys?.includes(key)) {
      const resolution = resolveProperty(spec, el, key, value, options);
      applyPropertyResolution(spec, el, key, resolution, options);
    }
  });

  // Handle children last to ensure all properties are set before appending
  if ('children' in spec && spec.children) {
    const children = spec.children;
    if (isNamespacedProperty(children, 'Array')) {
      try {
        const resolution = resolveProperty(spec, el, 'children', children, options);
        if (resolution.value) {
          adoptArray(resolution.value, el as Element, options);
        }
      } catch (error) {
        console.warn(`Failed to process namespace property for children:`, error);
      }
    } else if (Array.isArray(children)) {
      children.forEach((child: HTMLElementSpec) => {
        appendChild(child, el as DOMNode, options);
      });
    } else {
      console.warn(`Invalid children value for key "children":`, children);
    }
  }
}

/**
 * Adopts a WindowSpec into the current window context.
 * This function applies the declarative window properties to the global window object,
 * enabling reactive window-level properties and global state management.
 *
 * @param spec - The declarative window object to adopt
 * @example
 * ```typescript
 * adoptWindow({
 *   document: { title: 'My App' },
 *   customElements: [{ tagName: 'my-component' }],
 *   globalState: { theme: 'dark' }
 * });
 * ```
 */
export function adoptWindow(spec: WindowSpec): void {
  adoptNode(spec, window);
}

/**
 * Creates an HTML element from a declarative element definition.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers through the adoption system.
 *
 * @param spec - The declarative HTML element definition
 * @param options - Optional configuration object with named parameters
 * @returns The created HTML element with all properties applied
 * @example
 * ```typescript
 * const button = createElement({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => alert('Clicked!'),
 *   disabled: false
 * }, { css: true });
 * ```
 */
export function createElement(
  spec: HTMLElementSpec,
  options: DOMSpecOptions = {}
): HTMLElement {
  const el = document.createElement(spec.tagName) as HTMLElement;
  
  // Apply all properties using the unified adoption system
  adoptNode(
    spec,
    el,
    {
      ...options,
      ignoreKeys: [...(options.ignoreKeys || []), 'id', 'parentNode', 'tagName']
    }
  );
  
  return el;
}

/**
 * Creates an HTML element from a declarative element definition and appends it to a parent node.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers, then immediately appends
 * it to the specified parent node.
 *
 * @param spec - The declarative HTML element definition
 * @param parentNode - The parent node to append the created element to
 * @param options - Optional configuration object with named parameters
 * @returns The created HTML element with all properties applied
 * @example
 * ```typescript
 * const button = appendChild({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => alert('Clicked!')
 * }, document.body, { css: true });
 * ```
 */
export function appendChild(
  spec: HTMLElementSpec,
  parentNode: DOMNode,
  options: DOMSpecOptions = {}
): HTMLElement {
  const el = createElement(spec, options);

  // Append the element to the provided parent node
  if ('appendChild' in parentNode) {
    parentNode.appendChild(el);
  }

  return el;
}

/**
 * Adopts a reactive array signal and renders its items as DOM elements in the parent container.
 * This function takes a reactive array signal from the namespace system and renders each item
 * as a DOM element, properly handling reactive properties and leveraging fine-grained updates
 * for optimal performance.
 *
 * Uses modern fine-grained updates instead of clearing and re-rendering everything:
 * - Tracks elements by stable keys for efficient reconciliation
 * - Only updates properties that actually changed
 * - Reuses unchanged elements to minimize DOM manipulation
 * - Uses document fragments for efficient batch updates
 *
 * @param arraySignal - The reactive array signal from the namespace system
 * @param parentElement - The parent DOM element to render items into
 * @param options - Optional configuration object with named parameters
 * @example
 * ```typescript
 * // Array signal with items
 * const itemsSignal = new Signal.State([
 *   { tagName: 'li', textContent: 'Item 1' },
 *   { tagName: 'li', textContent: 'Item 2' }
 * ]);
 * 
 * // Adopt the array to render items
 * adoptArray(itemsSignal, listElement, { css: true });
 * ```
 */
export function adoptArray<T>(
  arraySignal: any, // Enhanced signal with getMutableProps method
  parentElement: Element,
  options: DOMSpecOptions = {}
): void {
  // Keep track of rendered elements by index for efficient updates
  const renderedElements = new Map<number, Element>();
  let previousItems: any[] = [];

  // Get mutable properties if available
  const mutableProps = typeof arraySignal.getMutableProps === 'function' 
    ? arraySignal.getMutableProps() 
    : [];

  // Function to update the current array state with fine-grained updates
  const updateArray = (items: any[]) => {
    // Consistent key generation function
    const getItemKey = (item: any) => item.id || JSON.stringify(item);

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

    items.forEach((item: any) => {
      if (item && typeof item === 'object' && item.tagName) {
        const key = getItemKey(item);
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
      }
    });

    // Native Set difference operations (simulated)
    for (const key of previousKeys) {
      if (!currentKeys.has(key)) {
        keysToRemove.add(key);
      }
    }

    // Remove unused components
    keysToRemove.forEach((key) => {
      const index = previousItems.findIndex(
        (item) => getItemKey(item) === key
      );
      if (index >= 0) {
        const element = renderedElements.get(index);
        if (element && element.parentNode === parentElement) {
          element.remove();
        }
        renderedElements.delete(index);
      }
    });

    // Create new components
    keysToCreate.forEach((key) => {
      const item = items.find(
        (item) => getItemKey(item) === key
      );
      if (item) {
        const element = createElement(item, options);
        newComponentsByKey.set(key, element);
      }
    });

    // Update existing components (pure signal-based updates)
    keysToUpdate.forEach((key) => {
      const item = items.find(
        (item) => getItemKey(item) === key
      );
      const previousIndex = previousItems.findIndex(
        (prev) => getItemKey(prev) === key
      );

      if (item && previousIndex >= 0) {
        const element = renderedElements.get(previousIndex);
        if (element) {
          // Surgical updates using mutable props tracking
          console.debug(`Updating existing component for key ${key} with mutable properties`, mutableProps);
          
          // Only update properties that actually reference item/index data
          mutableProps.forEach((prop: string) => {
            console.debug(`Updating property ${prop} for key ${key}`);
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
      }
    });

    // Reuse unchanged components
    currentKeys.forEach((key) => {
      if (!keysToCreate.has(key) && !keysToUpdate.has(key)) {
        const previousIndex = previousItems.findIndex(
          (prev) => getItemKey(prev) === key
        );
        if (previousIndex >= 0) {
          const element = renderedElements.get(previousIndex);
          if (element) {
            newComponentsByKey.set(key, element);
          }
        }
      }
    });

    // Efficient DOM manipulation with fragments
    const orderedElements = items
      .map((item) => newComponentsByKey.get(getItemKey(item)))
      .filter((element): element is Element => element !== undefined);

    // Surgical DOM manipulation - only touch what changed (inspired by React reconciliation)
    if (
      keysToCreate.size > 0 ||
      keysToRemove.size > 0 ||
      keysToUpdate.size > 0
    ) {
      // Get current children
      const currentChildren = Array.from(parentElement.children);

      if (orderedElements.length === 0) {
        // Clear all children if no elements needed
        parentElement.replaceChildren();
      } else if (currentChildren.length === 0) {
        // Initial render - use fragment
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
            if i >= parentElement.children.length) {
              // Append to end
              parentElement.appendChild(desiredElement);
            } else {
              // Insert before current element at this position
              parentElement.insertBefore(
                desiredElement,
                parentElement.children[i]
              );
            }
          }
        }
      }
    }

    // Update tracking structures
    renderedElements.clear();
    orderedElements.forEach((element, index) => {
      renderedElements.set(index, element);
    });
    previousItems = [...items];
  };

  /**
   * Efficient deep equality comparison with Object.is optimization.
   * Used for determining if array items have changed and need updates.
   */
  const deepEqual = (a: any, b: any): boolean => {
    if (Object.is(a, b)) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b || typeof a !== 'object') return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    return (
      keysA.length === keysB.length &&
      keysA.every((key) => deepEqual(a[key], b[key]))
    );
  };

  // Set up reactive effect that handles both initial render and updates
  // Use component-specific watcher if available, otherwise fall back to global
  const componentWatcher = (globalThis as any).__ddom_component_watcher as
    | ComponentSignalWatcher
    | undefined;

  const _effectCleanup = createEffect(() => {
    // Get the current items from the array signal to establish dependency tracking
    const currentItems = arraySignal.get();

    // Call updateArray immediately with the current items
    updateArray(currentItems);

    // Return empty cleanup since we're not deferring the update
    return () => { };
  }, componentWatcher);

  // Note: effectCleanup could be returned if the caller needs to clean up manually,
  // but typically the effect will be cleaned up when the parent element is removed
}

/**
 * Generates a path-based CSS selector for an element.
 * Creates a unique selector using element hierarchy and nth-of-type selectors.
 * This function assumes the element exists in the DOM with a parentElement.
 *
 * @param el - The element to generate a selector for (must be in DOM)
 * @returns A unique CSS selector string based on DOM hierarchy
 * @example
 * ```typescript
 * const selector = generatePathSelector(myDiv);
 * // Returns something like: "body > div:nth-of-type(2) > span"
 * ```
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
