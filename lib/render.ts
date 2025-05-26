import {
	DeclarativeHTMLBodyElement,
	DeclarativeHTMLElement,
	DeclarativeHTMLHeadElement,
	DeclarativeWindow
} from './../types';

export function buildElementTree(desc: DeclarativeHTMLElement, element?: HTMLBodyElement | HTMLElement | HTMLHeadElement): HTMLBodyElement | HTMLElement | HTMLHeadElement {
	const el = element || document.createElement(desc.tagName);

	for (const [key, value] of Object.entries(desc)) {
		switch (key) {
			case 'tagName':
				// Skip - already used for createElement
				break;
			case 'children':
				if (Array.isArray(value)) {
					for (const child of value) {
						el.appendChild(buildElementTree(child));
					}
				}
				break;
			case 'attributes':
				if (value && typeof value === 'object') {
					for (const [attrName, attrValue] of Object.entries(value)) {
						el.setAttribute(attrName, attrValue);
					}
				}
				break;
			case 'style':
				if (value && typeof value === 'object') {
					Object.assign(el.style, value);
				}
				break;
			default:
				// Set all other properties directly on the element
				(el as any)[key] = value;
				break;
		}
	}

	return el;
}

export function registerCustomElements(map: Record<string, DeclarativeHTMLElement>) {
	for (const [tag, def] of Object.entries(map)) {
		class DeclarativeComponent extends HTMLElement {
			constructor() {
				super();
				const el = buildElementTree(def);
				this.appendChild(el);
			}
		}
		if (!customElements.get(tag)) {
			customElements.define(tag, DeclarativeComponent);
		}
	}
}

/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
export function renderWindow(desc: DeclarativeWindow) {
	for (const [key, value] of Object.entries(desc)) {
		switch (key) {
			case 'document':
				if (value) {
					if (value.body) {
						buildElementTree(value.body as DeclarativeHTMLElement, document.body);
					}
					if (value.head) {
						buildElementTree(value.head as DeclarativeHTMLElement, document.head);
					}
				}
				break;
			case 'customElements':
				if (value) {
					registerCustomElements(value);
				}
				break;
			default:
				// Set all other properties directly on the window object
				// @ts-ignore
				window[key] = value;
				break;
		}
	}
}

// Create global DDOM namespace when script loads
declare global {
	interface Window {
		DDOM: {
			renderWindow: typeof renderWindow;
			buildElementTree: typeof buildElementTree;
			registerCustomElements: typeof registerCustomElements;
		};
	}
}

// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
	window.DDOM = {
		renderWindow,
		buildElementTree,
		registerCustomElements
	};
}