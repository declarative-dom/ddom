import {
	CustomElementSpec,
	HTMLBodyElementSpec,
	HTMLElementSpec,
	HTMLHeadElementSpec,
	WindowSpec,
	DocumentSpec,
	DOMSpec,
	ElementSpec,
	DOMNode,
	StyleExpr,
} from '../../../types/src';

import {
	adoptNode,
} from '../elements';

import {
	Signal,
	createReactiveProperty,
	globalSignalWatcher,
} from '../events';

import {
	insertRules,
} from '../styleSheets';

/**
 * Registers an array of custom elements with the browser's CustomElementRegistry.
 * This function creates new custom element classes that extend HTMLElement and
 * implement the declarative DOM structure and behavior specified in the definitions.
 * 
 * @param elements Array of declarative custom element definitions to register
 * @example
 * ```typescript
 * define([{
 *   tagName: 'my-component',
 *   children: [{ tagName: 'p', textContent: 'Hello World' }],
 *   connectedCallback: (el) => console.log('Component connected')
 * }]);
 * ```
 */
export function define(elements: CustomElementSpec[]) {
	const unregisteredDDOMElements = elements.filter(element => !customElements.get(element.tagName));

	unregisteredDDOMElements.forEach(spec => {
		// Register styles once during element registration
		adoptStyles(spec, spec.tagName);

		// Handle global document modifications from custom element
		if (spec.document) {
			adoptNode(spec.document as DocumentSpec, document);
		}

		// Apply all properties using the unified dispatch table
		const customElementIgnoreKeys = [
			'tagName', 'document', 'adoptedCallback', 'attributeChangedCallback',
			'connectedCallback', 'connectedMoveCallback', 'disconnectedCallback',
			'formAssociatedCallback', 'formDisabledCallback', 'formResetCallback',
			'formStateRestoreCallback', 'observedAttributes', 'constructor', 'style'
		];

		const reactiveProps = Object.entries(spec).filter(([key, value]) => key.startsWith('$'));

		// const allIgnoreKeys = [...customElementIgnoreKeys, ...reactiveProps.map(([key]) => key)];

		customElements.define(spec.tagName, class extends HTMLElement {
			#abortController = new AbortController();
			#container!: HTMLElement | ShadowRoot | DocumentFragment;

			#adoptNode() {
				
				// Ensure container is initialized
				if (!this.#container) {
					this.#container = this;
				}

				// Clear any existing content
				if ('innerHTML' in this.#container) {
					this.#container.innerHTML = '';
				} else if (this.#container instanceof DocumentFragment) {
					// For DocumentFragment, remove all children
					while (this.#container.firstChild) {
						this.#container.removeChild(this.#container.firstChild);
					}
				}

				// Apply all properties to the container with reactive context
				adoptNode(spec, this.#container, false, customElementIgnoreKeys);
			}

			constructor() {
				super();

				// create signals for reactive keys and set up proper signal effect
				const signals: Signal.State<any>[] = [];
				reactiveProps.forEach(([key, initialValue]) => {
					const signal = createReactiveProperty(this, key, initialValue);
					signals.push(signal);
				});
				
				// Create a proper effect using the exact pattern from the React example
				if (signals.length > 0) {
					
					// Use the exact effect pattern from the React example
					const createEffect = (callback: () => void) => {
						let cleanup: (() => void) | void;

						const computed = new Signal.Computed(() => {
							cleanup?.();
							cleanup = callback();
						});

						globalSignalWatcher.watch(computed);
						computed.get();

						return () => {
							globalSignalWatcher.unwatch(computed);
							cleanup?.();
						};
					};
					
					// Create the effect that tracks our reactive properties
					const effectCleanup = createEffect(() => {
						
						// Access all signals directly to establish dependencies
						signals.forEach((signal, index) => {
							const value = signal.get(); // Direct signal access - no wrapper
						});
						
						
						// Return a cleanup function that triggers re-render
						return () => {
							this.#triggerAdoptNode();
						};
					});
					
					// Clean up on disconnect
					this.#abortController.signal.addEventListener('abort', () => {
						effectCleanup();
					});
				}

				// Call custom constructor if defined
				if (spec.constructor && typeof spec.constructor === 'function') {
					spec.constructor(this);
				}
			}

			adoptedCallback() {
				if (spec.adoptedCallback && typeof spec.adoptedCallback === 'function') {
					spec.adoptedCallback(this);
				}
			}

			attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
				this.#triggerAdoptNode();
				if (spec.attributeChangedCallback && typeof spec.attributeChangedCallback === 'function') {
					spec.attributeChangedCallback(this, name, oldValue, newValue);
				}
			}

			connectedCallback() {
				// Check for existing shadow root (declarative or programmatic)
				const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
				const internals = supportsDeclarative ? this.attachInternals() : undefined;

				// Check for a Declarative Shadow Root or existing shadow root
				this.#container = internals?.shadowRoot || this.shadowRoot || this;

				if (spec.connectedCallback && typeof spec.connectedCallback === 'function') {
					spec.connectedCallback(this);
				}

				this.#adoptNode();
			}

			connectedMoveCallback() {
				if (spec.connectedMoveCallback && typeof spec.connectedMoveCallback === 'function') {
					spec.connectedMoveCallback(this);
				}
			}

			disconnectedCallback() {
				this.#abortController.abort();
				if (spec.disconnectedCallback && typeof spec.disconnectedCallback === 'function') {
					spec.disconnectedCallback(this);
				}
			}

			formAssociatedCallback(form: HTMLFormElement | null) {
				if (spec.formAssociatedCallback && typeof spec.formAssociatedCallback === 'function') {
					spec.formAssociatedCallback(this, form);
				}
			}

			formDisabledCallback(disabled: boolean) {
				if (spec.formDisabledCallback && typeof spec.formDisabledCallback === 'function') {
					spec.formDisabledCallback(this, disabled);
				}
			}

			formResetCallback() {
				if (spec.formResetCallback && typeof spec.formResetCallback === 'function') {
					spec.formResetCallback(this);
				}
			}

			formStateRestoreCallback(state: any, mode: 'restore' | 'autocomplete') {
				if (spec.formStateRestoreCallback && typeof spec.formStateRestoreCallback === 'function') {
					spec.formStateRestoreCallback(this, state, mode);
				}
			}

			static get observedAttributes() {
				return spec.observedAttributes || [];
			}

			#triggerAdoptNode() {
				queueMicrotask(() => {
					if (this.#abortController.signal.aborted) {
						return;
					}
					// Re-render the custom element
					this.#adoptNode();
				});
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
			if (child.style && typeof child.style === 'object') {
				const tagName = child.tagName?.toLowerCase() || '*';
				const count = tagNameCounts.get(tagName) || 0;
				
				let childSelector: string;
				
				if (count > 1) {
					// Multiple elements of same type - use nth-of-type selector (consistent with elements.ts)
					const currentIndex = (tagNameIndexes.get(tagName) || 0) + 1;
					tagNameIndexes.set(tagName, currentIndex);
					
					childSelector = `${selector} ${tagName}:nth-of-type(${currentIndex})`;
				} else {
					// Single element of this type - use simple descendant selector
					childSelector = `${selector} ${tagName}`;
				}
				
				adoptStyles(child, childSelector);
			}
		});
	}
}