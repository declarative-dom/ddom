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
} from '../../../types/src';

import {
	define,
} from '../customElements';

import {
	insertRules,
} from '../styleSheets';


const ddomHandlers: {
	[key: string]: (ddom: DeclarativeDOM, el: DOMNode, key: string, value: any, css?: boolean) => void;
} = {
	children: (ddom, el, key, value, css) => {
		// Handle function-based children (for reactive/computed children)
		if (typeof value === 'function') {
			try {
				const computedChildren = value(el);
				if (Array.isArray(computedChildren)) {
					computedChildren.forEach((child: DeclarativeHTMLElement) => {
						appendChild(child, el as DOMNode, css);
					});
				}
			} catch (error) {
				console.warn(`Failed to evaluate function for children:`, error);
			}
		} else if (Array.isArray(value)) {
			value.forEach((child: DeclarativeHTMLElement) => {
				appendChild(child, el as DOMNode, css);
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
		} else if (typeof value === 'function') {
			// Evaluate function with element as parameter for computed properties
			try {
				const computedValue = value(el);
				(el as any)[key] = computedValue;
			} catch (error) {
				console.warn(`Failed to evaluate function for property ${key}:`, error);
			}
		} else {
			// Set all other properties directly on the element
			(el as any)[key] = value;
		}
	}
};

/**
 * Adopts a DeclarativeWindow into the current document context.
 */
/**
 * Adopts a DeclarativeDocument into the current document context.
 * This function applies the declarative document properties to the global document object.
 * 
 * @param ddom The declarative document object to adopt
 * @example
 * ```typescript
 * adoptDocument({
 *   title: 'My App',
 *   head: { children: [{ tagName: 'meta', attributes: { charset: 'utf-8' } }] }
 * });
 * ```
 */
export function adoptDocument(ddom: DeclarativeDocument) {
	adoptNode(ddom, document);
}

/**
 * Adopts a declarative DOM structure into an existing DOM node.
 * This function applies properties from the declarative object to the target element,
 * handling children, attributes, styles, and other properties appropriately.
 * 
 * @param ddom The declarative DOM object to adopt
 * @param el The target DOM node to apply properties to
 * @param css Whether to process CSS styles (default: true)
 * @param ignoreKeys Array of property keys to ignore during adoption
 * @example
 * ```typescript
 * adoptNode({
 *   textContent: 'Hello',
 *   style: { color: 'red' }
 * }, myElement);
 * ```
 */
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
 * This function applies the declarative window properties to the global window object.
 * 
 * @param ddom The declarative window object to adopt
 * @example
 * ```typescript
 * adoptWindow({
 *   document: { title: 'My App' },
 *   customElements: [{ tagName: 'my-component' }]
 * });
 * ```
 */
export function adoptWindow(ddom: DeclarativeWindow) {
	adoptNode(ddom, window);
}

/**
 * Creates an HTML element from a declarative element definition and appends it to a parent node.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers, then immediately appends
 * it to the specified parent node.
 * 
 * @param ddom The declarative HTML element definition
 * @param parentNode The parent node to append the created element to
 * @param css Whether to process CSS styles (default: true)
 * @returns The created HTML element
 * @example
 * ```typescript
 * const button = appendChild({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => alert('Clicked!')
 * }, document.body);
 * ```
 */
export function appendChild(ddom: DeclarativeHTMLElement, parentNode: DOMNode, css: boolean = true): HTMLElement {
	const el = document.createElement(ddom.tagName) as HTMLElement;

	// set id if it's defined and not undefined
	if (ddom.id && ddom.id !== undefined) {
		el.id = ddom.id;
	}

	// Append the element to the provided parent node
	if ('appendChild' in parentNode) {
		parentNode.appendChild(el);
	}

	// Apply all properties using the unified dispatch table
	adoptNode(ddom, el, css, ['id', 'parentNode', 'tagName']);

	return el;
}

/**
 * Creates an HTML element from a declarative element definition.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers.
 * 
 * @param ddom The declarative HTML element definition
 * @param css Whether to process CSS styles (default: true)
 * @returns The created HTML element
 * @example
 * ```typescript
 * const button = createElement({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => alert('Clicked!')
 * });
 * ```
 */
export function createElement(ddom: DeclarativeHTMLElement, css: boolean = true): HTMLElement {
	const el = document.createElement(ddom.tagName) as HTMLElement;

	// set id if it's defined and not undefined
	if (ddom.id && ddom.id !== undefined) {
		el.id = ddom.id;
	}

	// Apply all properties using the unified dispatch table
	adoptNode(ddom, el, css, ['id', 'parentNode', 'tagName']);

	return el;
}

/**
 * Inserts CSS rules for a given element based on its declarative styles.
 * This function generates unique selectors and applies styles to the global DDOM stylesheet.
 * 
 * @param el The DOM element to apply styles to
 * @param styles The declarative CSS properties object
 * @example
 * ```typescript
 * adoptStyles(myElement, {
 *   color: 'red',
 *   fontSize: '16px',
 *   ':hover': { backgroundColor: 'blue' }
 * });
 * ```
 */
function adoptStyles(el: Element, styles: DeclarativeCSSProperties): void {
	// Generate a unique selector for this element
	let selector: string;

	if (el.id) {
		// Use ID if available
		selector = `#${el.id}`;
	} else {
		// Generate a path-based selector
		const path: string[] = [];
		let current: Element | null = el;

		while (current && current !== document.documentElement) {
			const tagName = current.tagName.toLowerCase();
			const parent: Element | null = current.parentElement;

			if (parent) {
				const siblings = Array.from(parent.children).filter((child: Element) =>
					child.tagName.toLowerCase() === tagName
				);

				if (siblings.length === 1) {
					path.unshift(tagName);
				} else {
					const index = siblings.indexOf(current) + 1;
					path.unshift(`${tagName}:nth-of-type(${index})`);
				}
			} else {
				path.unshift(tagName);
			}

			current = parent;
		}

		selector = path.join(' > ');
	}
	insertRules(styles as DeclarativeCSSProperties, selector);
}