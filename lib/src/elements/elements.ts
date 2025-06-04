import {
	ArrayExpr,
	StyleExpr,
	CustomElementSpec,
	DocumentSpec,
	DOMSpec,
	ElementSpec,
	HTMLBodyElementSpec,
	HTMLElementSpec,
	HTMLHeadElementSpec,
	WindowSpec,
	DOMNode,
} from '../../../types/src';

import {
	DeclarativeArray,
	isArrayExpr,
} from '../arrays';

import {
	createReactiveProperty,
	Signal
} from '../events';

import {
	insertRules,
} from '../styleSheets';

import {
	transform
} from '../xpath';

const ddomHandlers: {
	[key: string]: (ddom: DOMSpec, el: DOMNode, key: string, value: any, css?: boolean) => void;
} = {
	children: (ddom, el, key, value, css) => {
		// Handle function-based children (for reactive/computed children)
		if (isArrayExpr(value)) {
			try {
				adoptArray(value, el as Element);
			} catch (error) {
				console.warn(`Failed to process ArrayExpr for children:`, error);
			}
		} else if (Array.isArray(value)) {
			value.forEach((child: HTMLElementSpec) => {
				appendChild(child, el as DOMNode, css);
			});
		} else {
			console.warn(`Invalid children value for key "${key}":`, value);
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
			adoptNode(value as DocumentSpec, document);
		}
	},
	body: (ddom, el, key, value) => {
		if (value && (el === document || 'documentElement' in el)) {
			adoptNode(value as HTMLElementSpec, document.body);
		}
	},
	head: (ddom, el, key, value) => {
		if (value && (el === document || 'documentElement' in el)) {
			adoptNode(value as HTMLElementSpec, document.head);
		}
	},
	customElements: (ddom, el, key, value) => {
		if (value) {
			// Import define dynamically to avoid circular dependency
			import('../customElements').then(({ define }) => {
				define(value);
			});
		}
	},
	default: (ddom, el, key, value) => {
		// Handle reactive properties
		if (key.startsWith('on') && typeof value === 'function') {
			// Handle event listeners (properties starting with 'on')
			const eventName = key.slice(2).toLowerCase();
			el.addEventListener(eventName, value as EventListener);
		} else {
			// Set all other properties directly on the element
			(el as any)[key] = value;
		}
	}
};

/**
 * Adopts a WindowSpec into the current document context.
 */
/**
 * Adopts a DocumentSpec into the current document context.
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
export function adoptDocument(ddom: DocumentSpec) {
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
export function adoptNode(ddom: DOMSpec, el: DOMNode, css: boolean = true, ignoreKeys: string[] = []): void {
	const renderXPath = ['textContent', 'innerHTML', 'className'];
	let allIgnoreKeys = [...ignoreKeys, ...renderXPath];
	const reactiveProps = Object.entries(ddom).filter(([key, value]) => key.startsWith('$') && !ignoreKeys.includes(key));
	if (reactiveProps.length > 0) {
		reactiveProps.forEach(([key, initialValue]) => {
			// if they property already exists, set its value
			if (key in el) {
				const property = (el as any)[key];
				if (Signal.isState(property)) {
					if (typeof initialValue === 'function') {
						// If the initial value is a function, evaluate it to get the signal
						// const evaluatedValue = initialValue();
						// if (Signal.isState(evaluatedValue) || Signal.isComputed(evaluatedValue)) {
						// 	// If it's already a signal, set its value
						// 	property.set(evaluatedValue.get());
						// } else {
						// 	// Otherwise, set the initial value directly
						// 	property.set(evaluatedValue);
						// }
						// // debug
						// console.log(`[adoptNode] Updated existing signal property '${key}' with evaluated value:`, evaluatedValue);
					} else if (Signal.isComputed(initialValue) || Signal.isState(initialValue)) {
						// If the initial value is already a signal, set its value
						property.set(initialValue.get());
						// debug
						console.log(`[adoptNode] Updated existing signal property '${key}' with signal value:`, initialValue.get());
					} else {
						// property.set(initialValue);
						// debug
						// console.log(`[adoptNode] Updated existing signal property '${key}' with value:`, initialValue);
					}
				} else if (Signal.isComputed(property)) {
					// If it's a computed signal, skip it
				} else {
					// Otherwise, create a new signal with the initial value
					(el as any)[key] = initialValue;
				}
			} else {
				// Create a reactive property on the element
				createReactiveProperty(el, key, initialValue);
			}
			allIgnoreKeys.push(key);
		});
	}
	// set id using XPath if it's defined
	if ('id' in ddom && ddom.id !== undefined && el instanceof HTMLElement) {
		el.id = transform(ddom.id as string, el as Node);
		allIgnoreKeys.push('id');
	}
	// Apply all properties
	for (const [key, value] of Object.entries(ddom)) {
		if (allIgnoreKeys.includes(key)) {
			continue;
		}

		const handler = ddomHandlers[key] || ddomHandlers.default;
		handler(ddom, el, key, value, css);
	}

	// Handle textContent and innerHTML with XPath transformation
	for (const key of renderXPath) {
		if (ddom[key as keyof DOMSpec]) {
			(el as any)[key] = transform(ddom[key as keyof DOMSpec] as string, (el as Node));
		}
	}
}


/**
 * Adopts a WindowSpec into the current window context.
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
export function adoptWindow(ddom: WindowSpec) {
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
export function appendChild(ddom: HTMLElementSpec, parentNode: DOMNode, css: boolean = true): HTMLElement {
	const el = document.createElement(ddom.tagName) as HTMLElement;

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
export function createElement(ddom: HTMLElementSpec, css: boolean = true): HTMLElement {
	const el = document.createElement(ddom.tagName) as HTMLElement;

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
function adoptStyles(el: Element, styles: StyleExpr): void {
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
	insertRules(styles as StyleExpr, selector);
}

/**
 * Adopts a ArrayExpr and renders its items as DOM elements in the parent container
 * 
 * This function creates a reactive ArrayExpr instance and renders each mapped item
 * as a DOM element, properly handling reactive properties and leveraging existing element
 * creation functions.
 * 
 * @param arrayExpr - The DeclarativeArray configuration
 * @param parentElement - The parent DOM element to render items into
 * @param css - Whether to process CSS styles (default: true)
 */
export function adoptArray<T>(
	arrayExpr: ArrayExpr<T, any>, 
	parentElement: Element,
	css = true,
): void {
	// Create the reactive ArrayExpr instance
	const reactiveArray = new DeclarativeArray(arrayExpr, parentElement);
	
	// Function to render the current array state
	const renderArray = () => {
		// Clear existing children
		parentElement.innerHTML = '';
		
		// Get current processed items
		const items = reactiveArray.get();
		
		// Render each mapped item
		items.forEach((item: any) => {
			if (item && typeof item === 'object' && item.tagName) {
				// append the element
				appendChild(item, (parentElement as HTMLElement), css);
			}
		});
	};
	
	// Initial render
	renderArray();
	
	// Set up reactive subscription using the Signal.Computed from the array
	// This will automatically re-render when the array changes
	const arraySignal = reactiveArray.getSignal();
	
	// Create a computed that triggers re-render when array changes
	const renderComputed = new Signal.Computed(() => {
		arraySignal.get(); // Access the signal to establish dependency
		queueMicrotask(renderArray); // Schedule re-render
		return true;
	});
	
	// Trigger the computed to establish the subscription
	renderComputed.get();
}