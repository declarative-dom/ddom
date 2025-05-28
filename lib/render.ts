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

export function render(ddom: DeclarativeDOM, element?: DOMNode, parentSelector?: string, childIndex?: number, addStyles: boolean = true): DOMNode | null {
	const el = element || (() => {
		if ('tagName' in ddom && ddom.tagName) {
			return document.createElement(ddom.tagName) as HTMLElement;
		}
		return null;
	})();

	if (!el) return null;

	// Generate selector for the element
	const selector = getSelector(el as HTMLElement, parentSelector, childIndex);

	for (const [key, value] of Object.entries(ddom)) {
		switch (key) {
			case 'tagName':
				// Skip - already used for createElement
				break;
			case 'children':
				if (Array.isArray(value)) {
					value.forEach((child: DeclarativeHTMLElement, index: number) => {
						const childNode = render(child, undefined, selector, index + 1);
						if (childNode && 'appendChild' in el) {
							el.appendChild(childNode as Node);
						}
					});
				}
				break;
			case 'attributes':
				if (value && typeof value === 'object') {
					for (const [attrName, attrValue] of Object.entries(value)) {
						if (attrValue && typeof attrValue === 'string' && el instanceof Element) {
							el.setAttribute(attrName, attrValue);
						}
					}
				}
				break;
			case 'style':
				if (addStyles && value && typeof value === 'object') {
					addElementStyles(value as NestedCSSProperties, selector);
				}
				break;
			case 'document':
				if (value && el === window) {
					render(value as DeclarativeDocument, document);
				}
				break;
			case 'body':
				if (value && (el === document || 'documentElement' in el)) {
					render(value as DeclarativeHTMLElement, document.body);
				}
				break;
			case 'head':
				if (value && (el === document || 'documentElement' in el)) {
					render(value as DeclarativeHTMLElement, document.head);
				}
				break;
			case 'customElements':
				if (value) {
					registerCustomElements(value);
				}
				break;
			default:
				// Handle event listeners (properties starting with 'on')
				if (key.startsWith('on') && typeof value === 'function') {
					const eventName = key.slice(2).toLowerCase();
					el.addEventListener(eventName, value as EventListener);
				} else {
					// Set all other properties directly on the element
					(el as any)[key] = value;
				}
				break;
		}
	}

	return el;
}

export function registerCustomElements(elements: DeclarativeCustomElement[]) {
	const unregisteredDDOMElements = elements.filter(element => !customElements.get(element.tagName));

	for (const ddom of unregisteredDDOMElements) {
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
				if (ddom.constructor) {
					new ddom.constructor(this);
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

				// Apply the definition to the container
				for (const [key, value] of Object.entries(ddom)) {
					switch (key) {
						case 'tagName':
						case 'document':
						case 'connectedCallback':
						case 'disconnectedCallback':
						case 'attributeChangedCallback':
						case 'adoptedCallback':
						case 'observedAttributes':
							// Skip these - handled separately
							break;
						case 'children':
							if (Array.isArray(value)) {
								value.forEach((childDdom, index) => {
									const childNode = render(childDdom as DeclarativeHTMLElement, undefined, selector, index + 1, false);
									if (childNode && 'appendChild' in container) {
										container.appendChild(childNode as Node);
									}
								});
							}
							break;
						case 'attributes':
							if (value && typeof value === 'object') {
								for (const [attrName, attrValue] of Object.entries(value)) {
									if (attrValue && typeof attrValue === 'string') {
										this.setAttribute(attrName, attrValue);
									}
								}
							}
							break;
						case 'style':
							// Skip - styles already registered during element registration
							break;
						default:
							// Handle event listeners (properties starting with 'on')
							if (key.startsWith('on') && typeof value === 'function') {
								const eventName = key.slice(2).toLowerCase();
								this.addEventListener(eventName, value as any);
							} else {
								// Set all other properties directly on this element
								(this as any)[key] = value;
							}
							break;
					}
				}

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
	}
}

/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
export function renderWindow(ddom: DeclarativeWindow) {
	render(ddom, window);
}