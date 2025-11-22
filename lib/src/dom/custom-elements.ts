/**
 * Custom Elements Registration and Management
 * 
 * This module provides modern custom element registration using the Web Components standard.
 * It handles the complete lifecycle of custom elements including initialization, rendering,
 * cleanup, and reactive property management with DDOM's declarative approach.
 * 
 * Key Features:
 * - Automatic custom element registration with deduplication
 * - Shadow DOM and element internals support
 * - Component-level signal isolation for performance
 * - Automatic cleanup with AbortController
 * - Style adoption and document modification support
 * - Full custom element lifecycle management
 * 
 * @example
 * ```typescript
 * // Define a simple custom element
 * define([{
 *   tagName: 'my-button',
 *   template: {
 *     tagName: 'button',
 *     textContent: '${this.label}',
 *     onclick: () => this.dispatchEvent(new Event('click'))
 *   },
 *   constructor(el) {
 *     el.label = 'Click me';
 *   }
 * }]);
 * 
 * // Use the custom element
 * document.body.innerHTML = '<my-button></my-button>';
 * ```
 * 
 * @module dom/custom-elements
 * @version 0.4.1
 * @author Declarative DOM Working Group
 */

import {
	CustomElementSpec,
	DocumentSpec,
	HTMLElementSpec,
} from '../types';

import {
	adoptNode,
} from './element';

import {
	ComponentSignalWatcher,
} from '../core/signals';

import {
	insertRules,
} from './style-sheets';

/**
 * Registers an array of custom elements with the browser's CustomElementRegistry.
 * Modern, simplified implementation using latest JavaScript features with full
 * lifecycle management and reactive property support.
 * 
 * Key features:
 * - Single initialization per element with deduplication
 * - AbortController for automatic cleanup on disconnect
 * - Component-level signal isolation for optimal performance
 * - Shadow DOM and element internals support
 * - Automatic style adoption and document modification
 * - Full custom element lifecycle callbacks
 * 
 * @param elements - Array of declarative custom element definitions to register
 * @example
 * ```typescript
 * define([{
 *   tagName: 'counter-button',
 *   style: { 
 *     ':host': { display: 'inline-block' },
 *     'button': { padding: '8px 16px' }
 *   },
 *   template: {
 *     tagName: 'button',
 *     textContent: 'Count: ${this.$count}',
 *     onclick: () => this.$count.set(this.$count.get() + 1)
 *   },
 *   constructor(el) {
 *     el.$count = new Signal.State(0);
 *   }
 * }]);
 * ```
 */
export function define(elements: CustomElementSpec[]) {
	elements
		.filter(element => !customElements.get(element.tagName))
		.forEach(spec => {
			// Register styles and document modifications once
			adoptStyles(spec, spec.tagName);
			if (spec.document) adoptNode(spec.document as DocumentSpec, document);

			// Properties to ignore during DOM adoption
			const ignoreKeys = [
				'tagName', 'document', 'style', 'constructor'
			];

			customElements.define(spec.tagName, class extends HTMLElement {
				#controller = new AbortController();
				#container: HTMLElement | ShadowRoot;
				#internals?: ElementInternals;
				#initialized = false;
				#signalWatcher: ComponentSignalWatcher;

				constructor() {
					super();

					// Initialize component-specific signal watcher
					this.#signalWatcher = new ComponentSignalWatcher();

					// Initialize internals once
					try {
						this.#internals = this.attachInternals();
					} catch {
						// Browser doesn't support attachInternals or already called
					}

					// Set container preference: shadow root > internals shadow > element
					this.#container = this.shadowRoot || this.#internals?.shadowRoot || this;

					// Call custom constructor
					(spec.constructor as any)?.(this);
				}

				connectedCallback() {
					queueMicrotask(() => {
						if (!this.#initialized) {
							this.#initializeDOM();
							this.#initialized = true;
						}
						(spec.connectedCallback as any)?.call(this);
					});
				}

				disconnectedCallback() {
					this.#controller.abort();
					this.#signalWatcher.dispose();
					(spec.disconnectedCallback as any)?.call(this);
				}

				#initializeDOM() {
					// Capture light DOM children for slot distribution before clearing.
					// These children will be distributed to <slot> elements in the template
					// after the template is rendered, enabling content composition.
					const lightDOMChildren: Node[] = [];
					if (this.#container !== this) {
						// For shadow DOM, capture children from the host element (this)
						lightDOMChildren.push(...Array.from(this.childNodes));
					} else {
						// For light DOM rendering, capture existing children
						lightDOMChildren.push(...Array.from(this.#container.childNodes));
					}

					// Clear existing content
					if ('innerHTML' in this.#container) {
						this.#container.innerHTML = '';
					}

					// Make abort signal and component watcher available globally for cleanup
					(globalThis as any).__ddom_abort_signal = this.#controller.signal;
					(globalThis as any).__ddom_component_watcher = this.#signalWatcher;

					try {
						// Add properties that already exist on the element to ignoreKeys
						// This prevents the custom element spec from overwriting instance properties
						const instanceIgnoreKeys = [
							...ignoreKeys,
							...Object.keys(this).filter(key => 
								Object.prototype.hasOwnProperty.call(this, key) && 
								!ignoreKeys.includes(key)
							)
						];

						// Disable CSS processing since styles are already registered at definition time
						adoptNode(spec, this.#container, { css: false, ignoreKeys: instanceIgnoreKeys });

						// After rendering the template, distribute light DOM children to slots
						this.#distributeSlots(lightDOMChildren);
					} finally {
						delete (globalThis as any).__ddom_abort_signal;
						delete (globalThis as any).__ddom_component_watcher;
					}
				}

				/**
				 * Distributes light DOM children to slot elements in the template.
				 * Supports both named slots and the default slot.
				 * 
				 * @param lightDOMChildren - Array of child nodes to distribute to slots
				 */
				#distributeSlots(lightDOMChildren: Node[]) {
					if (lightDOMChildren.length === 0) {
						return;
					}

					// Find all slot elements in the container
					const slots = this.#container.querySelectorAll('slot');
					if (slots.length === 0) {
						return;
					}

					// Separate slotted content by slot name
					const slottedContentMap = new Map<string, Node[]>();
					const defaultSlotContent: Node[] = [];

					lightDOMChildren.forEach(node => {
						// Check if this node has a slot attribute (for named slots)
						if (node instanceof Element && node.hasAttribute('slot')) {
							const slotName = node.getAttribute('slot')!;
							if (!slottedContentMap.has(slotName)) {
								slottedContentMap.set(slotName, []);
							}
							slottedContentMap.get(slotName)!.push(node);
						} else {
							// No slot attribute - goes to default slot
							defaultSlotContent.push(node);
						}
					});

					// Distribute content to each slot
					slots.forEach(slot => {
						const slotName = slot.getAttribute('name');
						let contentToSlot: Node[] = [];

						if (slotName) {
							// Named slot - use content with matching slot attribute
							contentToSlot = slottedContentMap.get(slotName) || [];
						} else {
							// Default slot - use content without slot attribute
							contentToSlot = defaultSlotContent;
						}

						if (contentToSlot.length > 0) {
							// Clear fallback content if we have slotted content
							slot.innerHTML = '';
							// Append slotted content to the slot
							contentToSlot.forEach(node => slot.appendChild(node));
						}
						// If no content for this slot, keep the fallback content (don't modify)
					});
				}

				// Standard custom element callbacks with optional spec handlers
				adoptedCallback() { (spec.adoptedCallback as any)?.call(this); }
				attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
					(spec.attributeChangedCallback as any)?.call(this, name, oldValue, newValue);
				}
				connectedMoveCallback() { (spec.connectedMoveCallback as any)?.call(this); }
				formAssociatedCallback(form: HTMLFormElement | null) { 
					(spec.formAssociatedCallback as any)?.call(this, form); 
				}
				formDisabledCallback(disabled: boolean) { 
					(spec.formDisabledCallback as any)?.call(this, disabled); 
				}
				formResetCallback() { (spec.formResetCallback as any)?.call(this); }
				formStateRestoreCallback(state: any, mode: 'restore' | 'autocomplete') {
					(spec.formStateRestoreCallback as any)?.call(this, state, mode);
				}

				static get observedAttributes() {
					return spec.observedAttributes || [];
				}
			});
		});
}

/**
 * Recursively registers styles for a custom element and all its children.
 * This function processes the style object of the element and its nested children,
 * generating CSS rules with appropriate selectors. When multiple elements of the same
 * type have different styles, it adds :nth-of-type() selectors for specificity.
 * 
 * @param spec The declarative DOM element or any object with style and children properties
 * @param selector The CSS selector to use for this element's styles
 * @example
 * ```typescript
 * adoptStyles(myElement, 'my-component');
 * // Generates CSS rules for my-component and its children
 * ```
 */
function adoptStyles(spec: any, selector: string): void {
	// Register styles for the element itself
	if (spec.style) {
		insertRules(spec.style, selector);
	}

	// Recursively register styles for children
	if (spec.children && Array.isArray(spec.children)) {
		// Track occurrences of each tagName to detect duplicates
		const tagNameCounts = new Map<string, number>();
		const tagNameIndexes = new Map<string, number>();

		// Count occurrences of each tagName that has styles
		spec.children.forEach((child: HTMLElementSpec) => {
			if (child.style && typeof child.style === 'object' && child.tagName) {
				const tagName = child.tagName.toLowerCase();
				tagNameCounts.set(tagName, (tagNameCounts.get(tagName) || 0) + 1);
			}
		});

		spec.children.forEach((child: HTMLElementSpec) => {
			let childSelector: string = selector;

			const tagName = child.tagName?.toLowerCase() || '*';
			const count = tagNameCounts.get(tagName) || 0;

			if (count > 1) {
				// Multiple elements of same type - use nth-of-type selector (consistent with elements.ts)
				const currentIndex = (tagNameIndexes.get(tagName) || 0) + 1;
				tagNameIndexes.set(tagName, currentIndex);

				childSelector = `${selector} > ${tagName}:nth-of-type(${currentIndex})`;
			} else {
				// Single element of this type - use simple descendant selector
				childSelector = `${selector} > ${tagName}`;
			}

			adoptStyles(child, childSelector);
		});
	}
}