import {
	DeclarativeCustomElement,
	DeclarativeHTMLBodyElement,
	DeclarativeHTMLElement,
	DeclarativeHTMLHeadElement,
	DeclarativeWindow,
	DeclarativeDocument,
	DeclarativeDOM,
	DeclarativeDOMElement,
	DOMNode,
	DeclarativeCSSProperties,
} from '../../../types/src';

import {
	adoptNode,
	createElement,
} from '../elements';

import {
	Signal,
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
export function define(elements: DeclarativeCustomElement[]) {
	const unregisteredDDOMElements = elements.filter(element => !customElements.get(element.tagName));

	unregisteredDDOMElements.forEach(ddom => {
		// Register styles once during element registration
		adoptStyles(ddom, ddom.tagName);

		// Handle global document modifications from custom element
		if (ddom.document) {
			adoptNode(ddom.document as DeclarativeDocument, document);
		}

		// Apply all properties using the unified dispatch table
		const customElementIgnoreKeys = [
			'tagName', 'document', 'adoptedCallback', 'attributeChangedCallback',
			'connectedCallback', 'connectedMoveCallback', 'disconnectedCallback',
			'formAssociatedCallback', 'formDisabledCallback', 'formResetCallback',
			'formStateRestoreCallback', 'observedAttributes', 'constructor', 'style'
		];

		const reactiveFields = Object.keys(ddom).filter(key => key.startsWith('$'));

		const allIgnoreKeys = [...customElementIgnoreKeys, ...reactiveFields];

		customElements.define(ddom.tagName, class extends HTMLElement {
			#abortController = new AbortController();
			#container!: HTMLElement | ShadowRoot | DocumentFragment;

			constructor() {
				super();

				// create signals for reactive fields
				reactiveFields.forEach(field => {
					const initialValue = (ddom as any)[field];
					const signal = new Signal(initialValue);
					const propertyName = field.slice(1); // Remove the $ prefix for the actual property
					Object.defineProperty(this, propertyName, {
						get: () => signal.value,
						set: (value: any) => signal.value = value,
					});
					signal.subscribe(() => this.#triggerCreateElement());
				});

				// Call custom constructor if defined
				if (ddom.constructor && typeof ddom.constructor === 'function') {
					ddom.constructor(this);
				}
			}

			adoptedCallback() {
				if (ddom.adoptedCallback && typeof ddom.adoptedCallback === 'function') {
					ddom.adoptedCallback(this);
				}
			}

			attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
				if (ddom.attributeChangedCallback && typeof ddom.attributeChangedCallback === 'function') {
					ddom.attributeChangedCallback(this, name, oldValue, newValue);
				}
			}

			connectedCallback() {
				// Check for existing shadow root (declarative or programmatic)
				const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
				const internals = supportsDeclarative ? this.attachInternals() : undefined;

				// Check for a Declarative Shadow Root or existing shadow root
				this.#container = internals?.shadowRoot || this.shadowRoot || this;

				if (ddom.connectedCallback && typeof ddom.connectedCallback === 'function') {
					ddom.connectedCallback(this);
				}

				this.#createElement();
			}

			connectedMoveCallback() {
				if (ddom.connectedMoveCallback && typeof ddom.connectedMoveCallback === 'function') {
					ddom.connectedMoveCallback(this);
				}
			}

			disconnectedCallback() {
				this.#abortController.abort();
				if (ddom.disconnectedCallback && typeof ddom.disconnectedCallback === 'function') {
					ddom.disconnectedCallback(this);
				}
			}

			formAssociatedCallback(form: HTMLFormElement | null) {
				if (ddom.formAssociatedCallback && typeof ddom.formAssociatedCallback === 'function') {
					ddom.formAssociatedCallback(this, form);
				}
			}

			formDisabledCallback(disabled: boolean) {
				if (ddom.formDisabledCallback && typeof ddom.formDisabledCallback === 'function') {
					ddom.formDisabledCallback(this, disabled);
				}
			}

			formResetCallback() {
				if (ddom.formResetCallback && typeof ddom.formResetCallback === 'function') {
					ddom.formResetCallback(this);
				}
			}

			formStateRestoreCallback(state: any, mode: 'restore' | 'autocomplete') {
				if (ddom.formStateRestoreCallback && typeof ddom.formStateRestoreCallback === 'function') {
					ddom.formStateRestoreCallback(this, state, mode);
				}
			}

			static get observedAttributes() {
				return ddom.observedAttributes || [];
			}

			#createElement() {
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

				// Create a reactive context for dynamic property resolution
				const reactiveContext = { ...ddom } as any;
				reactiveFields.forEach(field => {
					const propertyName = field.slice(1);
					reactiveContext[propertyName] = (this as any)[propertyName];
				});

				// Apply all properties to the container with reactive context
				adoptNode(reactiveContext, this.#container, allIgnoreKeys);
			}

			#triggerCreateElement() {
				queueMicrotask(() => {
					if (this.#abortController.signal.aborted) return;
					// Re-render the custom element
					this.#createElement();
				});
			}
		});
	});
}

/**
 * Recursively registers styles for a custom element and all its children.
 * This function processes the style object of the element and its nested children,
 * generating CSS rules with appropriate selectors.
 * 
 * @param ddom The declarative DOM element or any object with style and children properties
 * @param selector The CSS selector to use for this element's styles
 * @example
 * ```typescript
 * adoptStyles(myElement, 'my-component');
 * // Generates CSS rules for my-component and its children
 * ```
 */
function adoptStyles(ddom: any, selector: string): void {
	// Register styles for the element itself
	if (ddom.style) {
		insertRules(ddom.style, selector);
	}

	// Recursively register styles for children
	if (ddom.children && Array.isArray(ddom.children)) {
		ddom.children.forEach((child: DeclarativeHTMLElement) => {
			if (child.style && typeof child.style === 'object') {
				// For custom element registration, we'll use a simple descendant selector
				const childSelector = `${selector} ${child.tagName?.toLowerCase() || '*'}`;
				adoptStyles(child, childSelector);
			}
		});
	}
}