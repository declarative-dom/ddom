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
	NestedCSSProperties,
} from '../spec/types';

import { getSelector } from './utils';
import { addElementStyles, clearDDOMStyles, registerCustomElementStyles } from './css';

const ddomHandlers: {
	[key: string]: (ddom: DeclarativeDOM, el: DOMNode, key: string, value: any, selector?: string, childIndex?: number, addStyles?: boolean) => void;
} = {
	children: (ddom, el, key, value, selector, childIndex) => {
		if (Array.isArray(value)) {
			value.forEach((child: DeclarativeHTMLElement, index: number) => {
				const childNode = render(child, undefined, selector, index + 1);
				if (childNode && 'appendChild' in el) {
					el.appendChild(childNode as Node);
				}
			});
		}
	},
	attributes: (ddom, el, key, value) => {
		if (value && typeof value === 'object') {
			for (const [attrName, attrValue] of Object.entries(value)) {
				if (attrValue && typeof attrValue === 'string' && el instanceof Element) {
					el.setAttribute(attrName, attrValue);
				}
			}
		}
	},
	style: (ddom, el, key, value, selector, childIndex, addStyles) => {
		if (addStyles && selector && value && typeof value === 'object') {
			addElementStyles(value as NestedCSSProperties, selector);
		}
	},
	document: (ddom, el, key, value) => {
		if (value && el === window) {
			render(value as DeclarativeDocument, document);
		}
	},
	body: (ddom, el, key, value) => {
		if (value && (el === document || 'documentElement' in el)) {
			render(value as DeclarativeHTMLElement, document.body);
		}
	},
	head: (ddom, el, key, value) => {
		if (value && (el === document || 'documentElement' in el)) {
			render(value as DeclarativeHTMLElement, document.head);
		}
	},
	customElements: (ddom, el, key, value) => {
		if (value) {
			registerCustomElements(value);
		}
	},
	default: (ddom, el, key, value) => {
		// Handle event listeners (properties starting with 'on')
		if (key.startsWith('on') && typeof value === 'function') {
			const eventName = key.slice(2).toLowerCase();
			el.addEventListener(eventName, value as EventListener);
		} else {
			// Set all other properties directly on the element
			(el as any)[key] = value;
		}
	}
};

function applyDDOM(ddom: DeclarativeDOM, el: DOMNode, selector?: string, childIndex?: number, addStyles: boolean = true, ignoreKeys: string[] = []): void {
	// Second pass: apply all other properties
	for (const [key, value] of Object.entries(ddom)) {
		if (ignoreKeys.includes(key)) {
			continue;
		}

		const handler = ddomHandlers[key] || ddomHandlers.default;
		handler(ddom, el, key, value, selector, childIndex, addStyles);
	}
}


export function render(ddom: DeclarativeDOM, element?: DOMNode, parentSelector?: string, childIndex?: number, addStyles: boolean = true): DOMNode | null {
	const el = element || (() => {
		if ('tagName' in ddom && ddom.tagName) {
			return document.createElement(ddom.tagName) as HTMLElement;
		}
		return null;
	})();

	if (!el) return null;

	// if the id is defined, set it on the element
	if ('id' in ddom && ddom.id) {
		(el as HTMLElement).id = ddom.id;
	}

	// Generate selector for the element
	const selector = getSelector(el as HTMLElement, parentSelector, childIndex);

	// Apply all properties using the unified dispatch table
	applyDDOM(ddom, el, selector, childIndex, addStyles, ['tagName']);

	return el;
}

class Signal<T> {
	#value: T;
	#subscribers = new Set<(value: T) => void>();

	constructor(initialValue: T) {
		this.#value = initialValue;
	}

	get value(): T {
		return this.#value;
	}

	set value(newValue: T) {
		if (!Object.is(this.#value, newValue)) {
			this.#value = newValue;
			this.#subscribers.forEach(fn => fn(newValue));
		}
	}

	subscribe(fn: (value: T) => void): () => boolean {
		this.#subscribers.add(fn);
		return () => this.#subscribers.delete(fn);
	}
}

export function registerCustomElements(elements: DeclarativeCustomElement[]) {
	const unregisteredDDOMElements = elements.filter(element => !customElements.get(element.tagName));

	unregisteredDDOMElements.forEach(ddom => {
		// Register styles once during element registration
		registerCustomElementStyles(ddom, ddom.tagName);

		// Handle global document modifications from custom element
		if (ddom.document) {
			render(ddom.document as DeclarativeDocument, document);
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
					signal.subscribe(() => this.#triggerRender());
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

				// debug
				console.debug('Connected custom element:', ddom.tagName, 'to container:', this.#container);

				this.#render();
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

			#render() {
				// Clear any existing content
				if ('innerHTML' in this.#container) {
					this.#container.innerHTML = '';
				} else if (this.#container instanceof DocumentFragment) {
					// For DocumentFragment, remove all children
					while (this.#container.firstChild) {
						this.#container.removeChild(this.#container.firstChild);
					}
				}

				// debug
				console.debug('Rendering custom element:', ddom.tagName, 'to container:', this.#container);

				// Apply all properties to the container
				applyDDOM(ddom, this.#container, ddom.tagName, undefined, false, customElementIgnoreKeys);
			}

			#triggerRender() {
				queueMicrotask(() => {
					if (this.#abortController.signal.aborted) return;
					// Render the custom element
					this.#render();
				});
			}
		});
	});
}


/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
export function renderWindow(ddom: DeclarativeWindow) {
	render(ddom, window);
}