import {
	DeclarativeCSSProperties,
	DeclarativeCustomElement,
	DeclarativeDocument,
	DeclarativeDOM,
	DeclarativeDOMElement,
	DeclarativeHTMLBodyElement,
	DeclarativeHTMLElement,
	DeclarativeHTMLHeadElement,
	DeclarativeWindow,
	DOMNode,
} from '../spec/types';

import { insertRules } from './styleSheets';
import { define } from './customElements';


const ddomHandlers: {
	[key: string]: (ddom: DeclarativeDOM, el: DOMNode, key: string, value: any, css?: boolean) => void;
} = {
	children: (ddom, el, key, value) => {
		if (Array.isArray(value)) {
			value.forEach((child: DeclarativeHTMLElement, index: number) => {
				child.parentNode = el;
				const childNode = createElement(child);
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
	style: (ddom, el, key, value, css) => {
		if (css && value && typeof value === 'object') {
			adoptStyles((el as Element), value);
		}
	},
	document: (ddom, el, key, value) => {
		if (value && el === window) {
			adoptNode(value as DeclarativeDocument, document);
		}
	},
	body: (ddom, el, key, value) => {
		if (value && (el === document || 'documentElement' in el)) {
			adoptNode(value as DeclarativeHTMLElement, document.body);
		}
	},
	head: (ddom, el, key, value) => {
		if (value && (el === document || 'documentElement' in el)) {
			adoptNode(value as DeclarativeHTMLElement, document.head);
		}
	},
	customElements: (ddom, el, key, value) => {
		if (value) {
			define(value);
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

/**
 * Adopts a DeclarativeWindow into the current document context.
 */
export function adoptDocument(ddom: DeclarativeDocument) {
	adoptNode(ddom, document);
}


export function adoptNode(ddom: DeclarativeDOM, el: DOMNode, css: boolean = true, ignoreKeys: string[] = []): void {
	// Apply all properties
	for (const [key, value] of Object.entries(ddom)) {
		if (ignoreKeys.includes(key)) {
			continue;
		}

		const handler = ddomHandlers[key] || ddomHandlers.default;
		handler(ddom, el, key, value, css);
	}
}


/**
 * Adopts a DeclarativeWindow into the current window context.
 */
export function adoptWindow(ddom: DeclarativeWindow) {
	adoptNode(ddom, window);
}


export function createElement(ddom: DeclarativeHTMLElement, css: boolean = true): HTMLElement {
	const el = document.createElement(ddom.tagName) as HTMLElement;

	// if the id is defined, set it on the element
	el.id = ddom.id;

	// Apply all properties using the unified dispatch table
	adoptNode(ddom, el, css, ['id', 'tagName']);

	return el;
}

/**
 * Inserts CSS rules for a given element based on its declarative styles
 */
function adoptStyles(el: Element, styles: DeclarativeCSSProperties): void {
	// define the selector
	let path = [], parent;
	while (parent = el.parentNode) {
		let tag = el.tagName;
		path.unshift(
			el.id ? `#${el.id}` : (
				parent.querySelectorAll(tag).length === 1 ? tag :
					`${tag}:nth-child(${Array.from(parent.children).indexOf(el) + 1})`
			)
		);
		el = parent as Element;
	}
	const selector = `${path.join(' > ')}`.toLowerCase();
	insertRules(styles as DeclarativeCSSProperties, selector);
}

