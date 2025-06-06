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
	createEffect,
	createReactiveProperty,
	Signal
} from '../events';

import {
	insertRules,
} from '../styleSheets';

import {
	Signal,
	createEffect,
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

		// Get computed properties (getters/setters) from the spec
		const specDescriptors = Object.getOwnPropertyDescriptors(spec);
		const computedProps = Object.entries(specDescriptors).filter(([key, descriptor]) => 
			descriptor.get || descriptor.set
		);
		const reactiveProps = Object.entries(specDescriptors).filter(([key, descriptor]) =>
			key.startsWith('$')
		);

		// debug
		if (computedProps.length > 0) {
			console.debug(`Registering computed properties for ${spec.tagName}:`, computedProps);
		}
		if (reactiveProps.length > 0) {
			console.debug(`Registering reactive properties for ${spec.tagName}:`, reactiveProps);
		}

		// Apply all properties using the unified dispatch table
		const ignoreKeys = [
			'tagName', 'document', 'adoptedCallback', 'attributeChangedCallback',
			'connectedCallback', 'connectedMoveCallback', 'disconnectedCallback',
			'formAssociatedCallback', 'formDisabledCallback', 'formResetCallback',
			'formStateRestoreCallback', 'observedAttributes', 'constructor', 'style',
			...reactiveProps.map(([key]) => key),
			...computedProps.map(([key]) => key)
		];

		customElements.define(spec.tagName, class extends HTMLElement {
			#abortController = new AbortController();
			#container!: HTMLElement | ShadowRoot | DocumentFragment;
			#cleanupFunctions: (() => void)[] = [];

			constructor() {
				super();

				// Set up computed properties (getters/setters) from the spec
				computedProps.forEach(([key, descriptor]) => {
					Object.defineProperty(this, key, descriptor);
				});

				// Create reactive properties (signals) from the spec
				reactiveProps.forEach(([key, descriptor]) => {
					createReactiveProperty(this, key, descriptor.value);
				});

				// Call custom constructor if defined
				if (spec.constructor && typeof spec.constructor === 'function') {
					spec.constructor(this);
				}
			}

			connectedCallback() {
				// Check for existing shadow root (declarative or programmatic)
				const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
				const internals = supportsDeclarative ? this.attachInternals() : undefined;

				// Check for a Declarative Shadow Root or existing shadow root
				this.#container = internals?.shadowRoot || this.shadowRoot || this;

				// Create the DOM structure once - no reactivity at component level
				this.#createDOMStructure();

				// Set up fine-grained reactivity for template expressions
				this.#setupFineGrainedReactivity();

				if (spec.connectedCallback && typeof spec.connectedCallback === 'function') {
					spec.connectedCallback(this);
				}
			}

			disconnectedCallback() {
				// Clean up all fine-grained reactive bindings
				this.#cleanupFunctions.forEach(cleanup => cleanup());
				this.#cleanupFunctions = [];
				
				this.#abortController.abort();
				if (spec.disconnectedCallback && typeof spec.disconnectedCallback === 'function') {
					spec.disconnectedCallback(this);
				}
			}

			#createDOMStructure() {
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

				// Create a cleanup collector to gather all reactive binding cleanup functions
				const cleanupCollector: (() => void)[] = [];
				
				// Temporarily monkey-patch the global cleanup collector so adoptNode can contribute to it
				(globalThis as any).__ddom_cleanup_collector = cleanupCollector;

				try {
					// Create the DOM structure with fine-grained reactivity
					adoptNode(spec, this.#container, false, ignoreKeys);
				} finally {
					// Clean up the temporary collector
					delete (globalThis as any).__ddom_cleanup_collector;
				}

				// Store all cleanup functions for later disposal
				this.#cleanupFunctions.push(...cleanupCollector);
			}

			#setupFineGrainedReactivity() {
				// This method is now mostly handled by the updated adoptNode function
				// which automatically sets up fine-grained reactivity for template expressions
				// The cleanup functions are collected during #createDOMStructure()
			}

			adoptedCallback() {
				if (spec.adoptedCallback && typeof spec.adoptedCallback === 'function') {
					spec.adoptedCallback(this);
				}
			}

			attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
				// No automatic re-rendering - attribute changes should be handled by fine-grained reactivity
				if (spec.attributeChangedCallback && typeof spec.attributeChangedCallback === 'function') {
					spec.attributeChangedCallback(this, name, oldValue, newValue);
				}
			}

			connectedMoveCallback() {
				if (spec.connectedMoveCallback && typeof spec.connectedMoveCallback === 'function') {
					spec.connectedMoveCallback(this);
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