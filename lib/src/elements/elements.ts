import {
  MappedArrayExpr,
  DocumentSpec,
  DOMSpec,
  HTMLElementSpec,
  WindowSpec,
  DOMNode,
} from '../../../types/src';

import './types'; // Import type augmentation for shadowRootMode

import { MappedArray, isMappedArrayExpr } from '../arrays';

import { createEffect, ComponentSignalWatcher, Signal } from '../events';

import { processProperty } from '../properties';

import { insertRules, insertShadowRules } from '../styleSheets';


/**
 * Type definition for scope property injection data.
 */
export type ReactiveProperties = Record<string, Signal.State<any> | Signal.Computed<any> | Function>;


/**
 * Adopts a DocumentSpec into the current document context.
 * This function applies the declarative document properties to the global document object.
 *
 * @param spec The declarative document object to adopt
 * @example
 * ```typescript
 * adoptDocument({
 *   title: 'My App',
 *   head: { children: [{ tagName: 'meta', attributes: { charset: 'utf-8' } }] }
 * });
 * ```
 */
export function adoptDocument(spec: DocumentSpec) {
  adoptNode(spec, document);
}

/**
 * Renders a declarative DOM specification on an existing DOM node.
 * This function applies properties from the declarative object to the target element,
 * handling children, attributes, styles, and other properties appropriately.
 *
 * Uses the new reactivity model:
 * - Template literals with ${...} get computed signals + effects
 * - Non-function, non-templated properties get transparent signal proxies
 * - Protected properties (id, tagName) are set once and never reactive
 *
 * @param spec The declarative DOM object to adopt
 * @param el The target DOM node to apply properties to
 * @param css Whether to process CSS styles (default: true)
 * @param ignoreKeys Array of property keys to ignore during adoption
 * @example
 * ```typescript
 * adoptNode({
 *   textContent: 'Hello ${this.name}', // Template literal - creates computed signal
 *   count: 0, // Non-templated - gets transparent signal proxy
 *   id: 'my-element', // Protected - set once, never reactive
 *   style: { color: 'red' }
 * }, myElement);
 * ```
 */
export function adoptNode(
  spec: DOMSpec,
  el: DOMNode,
  css: boolean = true,
  ignoreKeys: string[] = [],
  scopeReactiveProperties?: ReactiveProperties
): void {
  // Process all properties using descriptors - handles both values and native getters/setters
  const specDescriptors = Object.getOwnPropertyDescriptors(spec);

  // Inherit parent reactive properties directly (simple assignment)
  if (scopeReactiveProperties) {
    Object.assign(el, scopeReactiveProperties);
  }

  // Filter reactive properties from spec for processing and child inheritance
  const localReactiveProperties = Object.entries(specDescriptors).filter(([key]) =>
    key.startsWith('$')
  );

  // Process reactive properties directly on this element
  localReactiveProperties.forEach(([key, descriptor]) => {
    processProperty(spec, el, key, descriptor, css);
  });

  // Combine parent and local reactive properties for children
  const allReactiveProperties: ReactiveProperties = {
    ...scopeReactiveProperties,
    ...Object.fromEntries(localReactiveProperties.map(([key]) => [key, (el as any)[key]]))
  };

  let allIgnoreKeys = [
    'children',
    ...ignoreKeys,
    ...Object.keys(allReactiveProperties || {}),
  ];

  // Handle protected properties first (id, tagName) - set once, never reactive
  if ('id' in spec && spec.id !== undefined && el instanceof HTMLElement) {
    processProperty(spec, el, 'id', specDescriptors.id, css);
    allIgnoreKeys.push('id');
  }

  // Process all other properties with new reactivity model
  Object.entries(specDescriptors).forEach(([key, descriptor]) => {
    if (allIgnoreKeys.includes(key)) {
      return;
    }
    processProperty(spec, el, key, descriptor, css);
  });

  // Handle children last to ensure all properties are set before appending
  if ('children' in spec && spec.children) {
    const children = spec.children;
    if (isMappedArrayExpr(children)) {
      try {
        adoptArray(children, el as Element, css, allReactiveProperties);
      } catch (error) {
        console.warn(`Failed to process MappedArrayExpr for children:`, error);
      }
    } else if (Array.isArray(children)) {
      children.forEach((child: HTMLElementSpec) => {
        // Check if this is a declarative shadow root template
        if (child.tagName === 'template' && 'shadowRootMode' in child && child.shadowRootMode) {
          handleDeclarativeShadowRoot(child as HTMLElementSpec & { shadowRootMode: 'open' | 'closed' }, el as HTMLElement, css, allReactiveProperties);
        } else {
          appendChild(child, el as DOMNode, css, allReactiveProperties);
        }
      });
    } else {
      console.warn(`Invalid children value for key "children":`, children);
    }
  }
}

/**
 * Adopts a WindowSpec into the current window context.
 * This function applies the declarative window properties to the global window object.
 *
 * @param spec The declarative window object to adopt
 * @example
 * ```typescript
 * adoptWindow({
 *   document: { title: 'My App' },
 *   customElements: [{ tagName: 'my-component' }]
 * });
 * ```
 */
export function adoptWindow(spec: WindowSpec) {
  // Handle customElements first to avoid circular dependency
  if ('customElements' in spec && spec.customElements) {
    // Use dynamic import to avoid circular dependency
    import('../customElements').then(({ define }) => {
      define(spec.customElements as any);
    }).catch(error => {
      console.warn('Failed to load custom elements module:', error);
    });
  }
  
  adoptNode(spec, window);
}

/**
 * Creates an HTML element from a declarative element definition and appends it to a parent node.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers, then immediately appends
 * it to the specified parent node.
 *
 * @param spec The declarative HTML element definition
 * @param parentNode The parent node to append the created element to
 * @param css Whether to process CSS styles (default: true)
 * @returns The created HTML element
 * @example
 * ```typescript
 * const button = appendChild({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => alert('Clicked!')
 * }, document.body);
 * ```
 */
export function appendChild(
  spec: HTMLElementSpec,
  parentNode: DOMNode,
  css: boolean = true,
  scopeReactiveProperties?: ReactiveProperties
): HTMLElement {
  // Handle declarative shadow root template
  if (spec.tagName === 'template' && 'shadowRootMode' in spec && spec.shadowRootMode) {
    return handleDeclarativeShadowRoot(spec as HTMLElementSpec & { shadowRootMode: 'open' | 'closed' }, parentNode, css, scopeReactiveProperties);
  }

  const el = document.createElement(spec.tagName) as HTMLElement;

  // Append the element to the provided parent node
  if ('appendChild' in parentNode) {
    parentNode.appendChild(el);
  }

  // Apply all properties using the unified dispatch table
  adoptNode(
    spec,
    el,
    css,
    ['id', 'parentNode', 'tagName'],
    scopeReactiveProperties
  );

  return el;
}

/**
 * Creates an HTML element from a declarative element definition.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers.
 *
 * @param spec The declarative HTML element definition
 * @param css Whether to process CSS styles (default: true)
 * @returns The created HTML element
 * @example
 * ```typescript
 * const button = createElement({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => alert('Clicked!')
 * });
 * ```
 */
export function createElement(
  spec: HTMLElementSpec,
  css: boolean = true,
  scopeReactiveProperties?: ReactiveProperties
): HTMLElement {
  // Handle declarative shadow root template
  if (spec.tagName === 'template' && 'shadowRootMode' in spec && spec.shadowRootMode) {
    // For createElement, we need a parent - use a temporary element
    const tempParent = document.createElement('div');
    return handleDeclarativeShadowRoot(spec as HTMLElementSpec & { shadowRootMode: 'open' | 'closed' }, tempParent, css, scopeReactiveProperties);
  }

  const el = document.createElement(spec.tagName) as HTMLElement;

  // Apply all properties using the unified dispatch table
  adoptNode(
    spec,
    el,
    css,
    ['id', 'parentNode', 'tagName'],
    scopeReactiveProperties
  );

  return el;
}

/**
 * Adopts a MappedArrayExpr and renders its items as DOM elements in the parent container
 *
 * This function creates a reactive MappedArrayExpr instance and renders each mapped item
 * as a DOM element, properly handling reactive properties and leveraging existing element
 * creation functions.
 *
 * Uses modern fine-grained updates instead of clearing and re-rendering everything.
 *
 * @param arrayExpr - The MappedArray configuration
 * @param parentElement - The parent DOM element to render items into
 * @param css - Whether to process CSS styles (default: true)
 */
export function adoptArray<T>(
  arrayExpr: MappedArrayExpr<T, any>,
  parentElement: Element,
  css = true,
  scopeReactiveProperties?: ReactiveProperties
): void {
  // Create the reactive MappedArrayExpr instance
  const reactiveArray = new MappedArray(arrayExpr, parentElement);

  // Keep track of rendered elements by index for efficient updates
  const renderedElements = new Map<number, Element>();
  let previousItems: any[] = [];

  // Function to update the current array state with fine-grained updates
  // True key-based diffing inspired by the futuristic ComponentRepeater
  const updateArray = (items: any[]) => {
    // Track components by stable keys, not indices
    const currentKeys = new Set<string>();
    const newComponentsByKey = new Map<string, Element>();
    const keysToCreate = new Set<string>();
    const keysToUpdate = new Set<string>();
    const keysToRemove = new Set<string>();

    // Build sets of current and new keys
    const previousKeys = new Set(
      previousItems.map((item) => item.id || JSON.stringify(item))
    );

    items.forEach((item: any) => {
      if (item && typeof item === 'object' && item.tagName) {
        const key = item.id || JSON.stringify(item);
        currentKeys.add(key);

        if (previousKeys.has(key)) {
          // Check if properties changed
          const previousItem = previousItems.find(
            (prev) => (prev.id || JSON.stringify(prev)) === key
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
        (item) => (item.id || JSON.stringify(item)) === key
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
        (item) => (item.id || JSON.stringify(item)) === key
      );
      if (item) {
        const element = createElement(item, css, scopeReactiveProperties);
        newComponentsByKey.set(key, element);
      }
    });

    // Update existing components (property-level diffing)
    keysToUpdate.forEach((key) => {
      const item = items.find(
        (item) => (item.id || JSON.stringify(item)) === key
      );
      const previousIndex = previousItems.findIndex(
        (prev) => (prev.id || JSON.stringify(prev)) === key
      );

      if (item && previousIndex >= 0) {
        const element = renderedElements.get(previousIndex);
        if (element) {
          // Granular property updates
          Object.entries(item).forEach(([prop, value]) => {
            if (prop !== 'tagName' && (element as any)[prop] !== value) {
              if (typeof value === 'object' && value !== null) {
                // For complex objects, use adoptNode for deep updates
                adoptNode({ [prop]: value } as any, element as any, css);
              } else {
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
          (prev) => (prev.id || JSON.stringify(prev)) === key
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
      .map((item) => newComponentsByKey.get(item.id || JSON.stringify(item)))
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
            if (i >= parentElement.children.length) {
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

  // Efficient deep equality with Object.is optimization
  const deepEqual = (a: any, b: any): boolean => {
    if (Object.is(a, b)) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b || typeof a !== 'object') return false;

    // ID-based fast comparison for objects with stable IDs
    if (a.id && b.id) {
      return a.id === b.id;
    }

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
    // Get the current items within the effect to establish dependency tracking
    const currentItems = reactiveArray.get();

    // Call updateArray immediately with the current items
    updateArray(currentItems);

    // Return empty cleanup since we're not deferring the update
    return () => {};
  }, componentWatcher);

  // Note: effectCleanup could be returned if the caller needs to clean up manually,
  // but typically the effect will be cleaned up when the parent element is removed
}

/**
 * Handles declarative shadow root template elements.
 * This function creates a shadow root on the parent element and adopts the template content into it.
 * Follows the declarative shadow DOM syntax: <template shadowrootmode="open">
 *
 * @param spec The template element specification with shadowRootMode
 * @param parentNode The parent node to attach the shadow root to
 * @param css Whether to process CSS styles (default: true)
 * @param scopeReactiveProperties Reactive properties to inherit
 * @returns The host element with attached shadow root
 */
function handleDeclarativeShadowRoot(
  spec: HTMLElementSpec & { shadowRootMode: 'open' | 'closed' },
  parentNode: DOMNode,
  css: boolean = true,
  scopeReactiveProperties?: ReactiveProperties
): HTMLElement {
  // The parent node should be an HTMLElement to support shadow DOM
  if (!(parentNode instanceof HTMLElement)) {
    throw new Error('Shadow DOM can only be attached to HTMLElement instances');
  }

  let hostElement = parentNode;

  // If the parent is a temporary element (from createElement), we need to create the actual host
  if (parentNode.tagName === 'DIV' && parentNode.children.length === 0) {
    // This is likely a temporary parent from createElement - we'll return the host directly
    // In this case, the shadow root will be attached when the element is actually used
  }

  // Attach shadow root to the host element
  let shadowRoot: ShadowRoot;
  try {
    shadowRoot = hostElement.attachShadow({ mode: spec.shadowRootMode });
  } catch (error) {
    // Shadow root already exists, use the existing one
    shadowRoot = hostElement.shadowRoot!;
  }

  // Process the template's styles first, applying them to the shadow root context
  if (spec.style && css) {
    // For shadow DOM styles, we need to create shadow-specific stylesheet handling
    adoptShadowStyles(shadowRoot, spec.style);
  }

  // Process children of the template, rendering them into the shadow root
  if (spec.children && Array.isArray(spec.children)) {
    spec.children.forEach((child: HTMLElementSpec) => {
      appendChild(child, shadowRoot, css, scopeReactiveProperties);
    });
  }

  // Process other properties of the template (excluding special shadow DOM properties)
  const ignoreKeys = ['tagName', 'shadowRootMode', 'style', 'children'];
  const templateDescriptors = Object.getOwnPropertyDescriptors(spec);

  Object.entries(templateDescriptors).forEach(([key, descriptor]) => {
    if (!ignoreKeys.includes(key)) {
      processProperty(spec, shadowRoot, key, descriptor, css);
    }
  });

  return hostElement;
}

/**
 * Adopts CSS styles for shadow DOM using the existing stylesheet module.
 * Uses the integrated shadow DOM support from the stylesheet module.
 *
 * @param shadowRoot The shadow root to apply styles to
 * @param styles The declarative CSS properties object
 */
async function adoptShadowStyles(shadowRoot: ShadowRoot, styles: any): Promise<void> {
  // Use the existing insertShadowRules function from the stylesheet module
  insertShadowRules(shadowRoot, styles, ':host');
}
