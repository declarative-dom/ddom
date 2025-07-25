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
  DocumentSpec,
  DOMSpec,
  HTMLElementSpec,
  WindowSpec,
  DOMNode,
} from '../types';

import { processScopeProperty, processProperty } from '../core/properties';
import { applyPropertyBinding } from './binding';
import { DOMSpecOptions } from './types';

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
export function adoptDocument(spec: DocumentSpec, options: DOMSpecOptions = {}): void {
  adoptNode(spec, document, options);
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
  if (options.scopeProperties) {
    Object.assign(el, options.scopeProperties);
  }

  // Filter reactive properties from spec for processing and child inheritance
  const localScopeProperties = specEntries.filter(([key]) =>
    key.startsWith('$')
  );

  // Process reactive properties directly on this element
  localScopeProperties.forEach(([key, value]) => {
    // skip if the property is already defined on the element
    if (Object.hasOwn(el, key)) {
      return;
    }
    const processed = processScopeProperty(key, value, el);
    if (processed.isValid) {
      (el as any)[key] = processed.value;
    } else {
      console.warn(`❌ Invalid scope property ${key}:`, processed.error);
    }
  });

  // Combine parent and local reactive properties for children
  options.scopeProperties = {
    ...options.scopeProperties,
    ...Object.fromEntries(localScopeProperties.map(([key]) => [key, (el as any)[key]]))
  };

  options.ignoreKeys = [
    ...(options.ignoreKeys ? options.ignoreKeys : []),
    ...localScopeProperties.map(([key]) => key),
  ];

  // Handle protected properties first (id, tagName) - set once, never reactive
  if ('id' in spec && spec.id !== undefined && el instanceof HTMLElement) {
    const processed = processProperty('id', spec.id, el);
    if (processed.isValid) {
      el.id = processed.value;
    }
    options.ignoreKeys.push('id');
  }

  // Process all other properties using the enhanced binding system
  specEntries.forEach(([key, value]) => {
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
  const el = document.createElement(spec.tagName) as HTMLElement;

  // Append the element to the provided parent node
  if ('appendChild' in parentNode) {
    parentNode.appendChild(el);
  } else {
    console.warn('❌ parentNode does not support appendChild:', parentNode);
  }

  // Apply all properties using the unified adoption system
  adoptNode(
    spec,
    el,
    {
      ...options,
      ignoreKeys: [...(options.ignoreKeys || []), 'tagName']
    }
  );

  return el;
}