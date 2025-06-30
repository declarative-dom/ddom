import {
	CustomElementSpec,
	DocumentSpec,
	HTMLElementSpec,
} from '../../../types/src';

import {
	adoptNode,
} from '../elements';

import {
	ComponentSignalWatcher,
} from '../events';

import {
	insertRules,
} from '../styleSheets';

/**
 * Registers an array of custom elements with the browser's CustomElementRegistry.
 * Modern, simplified implementation using latest JavaScript features.
 * 
 * Key features:
 * - Single initialization per element
 * - AbortController for automatic cleanup
 * - Simplified container logic
 * - No unnecessary feature detection
 * 
 * @param elements Array of declarative custom element definitions to register
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
				#container: HTMLElement;
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

					// Use the element itself as container - shadow DOM will be created by template children if needed
					this.#container = this;

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
						adoptNode(spec, this.#container, false, instanceIgnoreKeys);
					} finally {
						delete (globalThis as any).__ddom_abort_signal;
						delete (globalThis as any).__ddom_component_watcher;
					}
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

			// Skip template elements - they handle their own shadow DOM styles
			if (tagName === 'template') {
				return;
			}

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