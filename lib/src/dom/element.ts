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
import { createEffect, ComponentSignalWatcher, Signal } from '../core/signals';
import { resolvePropertyValue, evaluatePropertyValue } from '../core/properties';
import { applyPropertyBinding, bindReactiveArray } from './binding';
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
  console.debug('🔧 adoptNode called with spec:', spec, 'el:', el, 'options:', options);
  
  // Process all properties using key/value pairs
  const specEntries = Object.entries(spec);
  console.debug('📝 Processing spec entries:', specEntries);

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
    console.debug('⚡ Processing reactive property:', key, '=', value);
    applyPropertyBinding(spec, el, key, value, options);
  });

  // Combine parent and local reactive properties for children
  options.scopeReactiveProperties = {
    ...options.scopeReactiveProperties,
    ...Object.fromEntries(localReactiveProperties.map(([key]) => [key, (el as any)[key]]))
  };

  options.ignoreKeys = [
    ...(options.ignoreKeys? options.ignoreKeys : []),
    ...Object.keys(localReactiveProperties || {}),
  ];

  // Handle protected properties first (id, tagName) - set once, never reactive
  if ('id' in spec && spec.id !== undefined && el instanceof HTMLElement) {
    const resolved = resolvePropertyValue('id', spec.id, el, options);
    const evaluated = evaluatePropertyValue(resolved);
    if (evaluated.isValid) {
      el.id = evaluated.value;
    }
    options.ignoreKeys.push('id');
  }

  // handle style property separately (css defaults to true)
  if ((options.css !== false) && 'style' in spec && spec.style) {
	// Generate a unique selector for this element
	const selector = (el as any).id ? `#${(el as any).id}` : generatePathSelector(el as Element);
	// Apply styles using the DDOM CSS rule system
	insertRules(spec.style, selector);
	options.ignoreKeys.push('style');
  }

  // Process all other properties using the enhanced binding system
  specEntries.forEach(([key, value]) => {
    console.debug('🔗 Processing property:', key, '=', value, 'ignored:', options.ignoreKeys?.includes(key));
    if (!options.ignoreKeys?.includes(key)) {
      applyPropertyBinding(spec, el, key, value, options);
    }
  });
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
  console.debug('🏠 adoptWindow called with spec:', spec);
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
  console.debug('🎯 createElement called with spec:', spec, 'options:', options);
  const el = document.createElement(spec.tagName) as HTMLElement;
  console.debug('✅ Created element:', el);
  
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
  console.debug('🔗 appendChild called with spec:', spec, 'parentNode:', parentNode);
  const el = createElement(spec, options);

  // Append the element to the provided parent node
  if ('appendChild' in parentNode) {
    console.debug('➕ Appending element to parent:', el, '→', parentNode);
    parentNode.appendChild(el);
  } else {
    console.warn('❌ parentNode does not support appendChild:', parentNode);
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
