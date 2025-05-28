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
	// register custom elements first
	if ('customElements' in ddom && Array.isArray(ddom.customElements)) {
		// debug
		console.log('Registering custom elements:', ddom.customElements.map(el => el.tagName));
		registerCustomElements(ddom.customElements as DeclarativeCustomElement[]);
	}
	const el = element || (() => {
		if ('tagName' in ddom && ddom.tagName) {
			return document.createElement(ddom.tagName) as HTMLElement;
		}
		return null;
	})();

	if (!el) return null;

	// Generate selector for the element
	const selector = getSelector(el as HTMLElement, parentSelector, childIndex);

	// Apply all properties using the unified dispatch table
	applyDDOM(ddom, el, selector, childIndex, addStyles, ['tagName', 'customElements']);

	return el;
}

export function registerCustomElements(elements: DeclarativeCustomElement[]) {
	const unregisteredDDOMElements = elements.filter(element => !customElements.get(element.tagName));

	unregisteredDDOMElements.forEach(ddom => {
		console.log(`Registering custom element: ${ddom.tagName}`);

		// Register styles once during element registration
		registerCustomElementStyles(ddom, ddom.tagName);

		// Handle global document modifications from custom element
		if (ddom.document) {
			render(ddom.document as DeclarativeDocument, document);
		}

		customElements.define(ddom.tagName, class extends HTMLElement {
			constructor() {
				super();

				// Call custom constructor if defined
				if (ddom.constructor && typeof ddom.constructor === 'function') {
					ddom.constructor(this);
				}
			}

			connectedCallback() {
				// Check for existing shadow root (declarative or programmatic)
				const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
				const internals = supportsDeclarative ? this.attachInternals() : undefined;

				// Check for a Declarative Shadow Root or existing shadow root
				let container = internals?.shadowRoot || this.shadowRoot || this;

				// Clear any existing content
				container.innerHTML = '';

				const selector = ddom.tagName;

				// Apply all properties using the unified dispatch table
				const customElementIgnoreKeys = [
					'tagName', 'document', 'connectedCallback', 'disconnectedCallback',
					'attributeChangedCallback', 'adoptedCallback', 'observedAttributes',
					'constructor', 'style'
				];

				applyDDOM(ddom, container, selector, undefined, false, customElementIgnoreKeys);

				// Call custom connectedCallback if defined
				if (ddom.connectedCallback) {
					ddom.connectedCallback(this);
				}
			}

			disconnectedCallback() {
				if (ddom.disconnectedCallback) {
					ddom.disconnectedCallback(this);
				}
			}

			attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
				if (ddom.attributeChangedCallback) {
					ddom.attributeChangedCallback(this, name, oldValue, newValue);
				}
			}

			adoptedCallback() {
				if (ddom.adoptedCallback) {
					ddom.adoptedCallback(this);
				}
			}

			static get observedAttributes() {
				return ddom.observedAttributes || [];
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