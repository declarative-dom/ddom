import {
	DeclarativeCustomElement,
	DeclarativeHTMLBodyElement,
	DeclarativeHTMLElement,
	DeclarativeHTMLHeadElement,
	DeclarativeWindow,
	DeclarativeDocument,
	NestedCSSProperties,
} from './../types';

import { generateElementSelector } from './utils';
import { processElementStyles, clearDDOMStyles } from './css';

export function render(desc: DeclarativeHTMLElement | DeclarativeWindow | DeclarativeDocument, element?: HTMLBodyElement | HTMLElement | HTMLHeadElement | Document | Window): HTMLBodyElement | HTMLElement | HTMLHeadElement | Document | Window | null {
	const el = element || (() => {
		if ('tagName' in desc && desc.tagName) {
			return document.createElement(desc.tagName);
		}
		return null;
	})();

	if (!el) return null;

	for (const [key, value] of Object.entries(desc)) {
		switch (key) {
			case 'tagName':
				// Skip - already used for createElement
				break;
			case 'children':
				if (Array.isArray(value)) {
					for (const child of value) {
						const childNode = render(child);
						if (childNode && 'appendChild' in el) {
							(el as any).appendChild(childNode as Node);
						}
					}
				}
				break;
			case 'attributes':
				if (value && typeof value === 'object') {
					for (const [attrName, attrValue] of Object.entries(value)) {
						if (attrValue && typeof attrValue === 'string') {
							(el as any).setAttribute(attrName, attrValue);
						}
					}
				}
				break;
			case 'style':
				if (value && typeof value === 'object') {
					// Generate selector for the element
					const selector = generateElementSelector(el as HTMLElement);
					processElementStyles(value as NestedCSSProperties, el as HTMLElement, selector);
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
					(el as any).addEventListener(eventName, value as EventListener);
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
	const unregisteredElements = elements.filter(element => !customElements.get(element.tagName));

	for (const def of unregisteredElements) {
		console.log(`Registering custom element: ${def.tagName}`);

		// Handle global document modifications from custom element
		if (def.document) {
			render(def.document as DeclarativeDocument, document);
		}

		customElements.define(def.tagName, class extends HTMLElement {
			constructor() {
				super();

				// Call custom constructor if defined
				if (def.constructor) {
					new def.constructor(this);
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

				// Apply the definition to the container
				for (const [key, value] of Object.entries(def)) {
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
								for (const child of value) {
									const childNode = render(child as DeclarativeHTMLElement);
									if (childNode && 'appendChild' in container) {
										container.appendChild(childNode as Node);
									}
								}
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
							if (value && typeof value === 'object') {
								// Generate selector for custom element
								const selector = generateElementSelector(this);
								processElementStyles(value as NestedCSSProperties, this, selector);
							}
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
				if (def.connectedCallback) {
					def.connectedCallback(this);
				}
			}

			disconnectedCallback() {
				if (def.disconnectedCallback) {
					def.disconnectedCallback(this);
				}
			}

			attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
				if (def.attributeChangedCallback) {
					def.attributeChangedCallback(this, name, oldValue, newValue);
				}
			}

			adoptedCallback() {
				if (def.adoptedCallback) {
					def.adoptedCallback(this);
				}
			}

			static get observedAttributes() {
				return def.observedAttributes || [];
			}
		});
	}
}

/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
export function renderWindow(desc: DeclarativeWindow) {
	render(desc, window);
}

// Create global DDOM namespace when script loads
declare global {
	interface Window {
		DDOM: {
			renderWindow: typeof renderWindow;
			render: typeof render;
			registerCustomElements: typeof registerCustomElements;
			clearDDOMStyles: typeof clearDDOMStyles;
		};
	}
}

// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
	window.DDOM = {
		renderWindow,
		render,
		registerCustomElements,
		clearDDOMStyles
	};
}