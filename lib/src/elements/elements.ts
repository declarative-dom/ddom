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
	[key: string]: (spec: DOMSpec, el: DOMNode, key: string, value: any, css?: boolean) => void;
} = {
	children: (spec, el, key, value, css) => {
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
	attributes: (spec, el, key, value) => {
		if (value && typeof value === 'object') {
			for (const [attrName, attrValue] of Object.entries(value)) {
				let value = attrValue;
				if (typeof attrValue === 'string') {
					value = transform(attrValue, el as Node);
				} else if (typeof attrValue === 'function') {
					// eval function attributes
					value = attrValue(el);
				}
				if (el instanceof Element) {
					if (typeof value === 'boolean') {
						// Handle boolean attributes
						if (value) {
							el.setAttribute(attrName, '');
						} else {
							el.removeAttribute(attrName);
						}
					} else {
						// Set other attributes directly
						el.setAttribute(attrName, value as string);
					}
				}
			}
		}
	},
	style: (spec, el, key, value, css) => {
		if (css && value && typeof value === 'object') {
			adoptStyles((el as Element), value);
		}
	},
	document: (spec, el, key, value) => {
		if (value && el === window) {
			adoptNode(value as DocumentSpec, document);
		}
	},
	body: (spec, el, key, value) => {
		if (value && (el === document || 'documentElement' in el)) {
			adoptNode(value as HTMLElementSpec, document.body);
		}
	},
	head: (spec, el, key, value) => {
		if (value && (el === document || 'documentElement' in el)) {
			adoptNode(value as HTMLElementSpec, document.head);
		}
	},
	customElements: (spec, el, key, value) => {
		if (value) {
			// Import define dynamically to avoid circular dependency
			import('../customElements').then(({ define }) => {
				define(value);
			});
		}
	},
	default: (spec, el, key, value) => {
		// Handle functions properties
		if (typeof value === 'function') {
			if (key.startsWith('on') && el instanceof Element) {
				// Handle event listeners (properties starting with 'on')
				const eventName = key.slice(2).toLowerCase();
				el.addEventListener(eventName, value as EventListener);
			} else {
				// set property as a function
				(el as any)[key] = value;
			}
		} else if (typeof value === 'string') {
			// evalute xpath expressions
			(el as any)[key] = transform(value, el as Node);
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
 * @param spec The declarative document object to adopt
 * @example
 * ```typescript
 * adoptDocument({
 *   title: 'My App',
 *   head: { children: [{ tagName: 'meta', attributes: { charset: 'utf-8' } }] }
 * });
 * ```
 */
export function adoptDocument(spec: DocumentSpec) {
	adoptNode(spec, document);
}

/**
 * Renders a declarative DOM specification on an existing DOM node.
 * This function applies properties from the declarative object to the target element,
 * handling children, attributes, styles, and other properties appropriately.
 * 
 * @param spec The declarative DOM object to adopt
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
export function adoptNode(spec: DOMSpec, el: DOMNode, css: boolean = true, ignoreKeys: string[] = []): void {
	// const renderXPath = ['className',
	// 	'dir',
	// 	'innerHTML',
	// 	'lang',
	// 	'name',
	// 	'role',
	// 	'tabIndex',
	// 	'textContent',
	// 	'title'
	// ];
	// let allIgnoreKeys = [...ignoreKeys, ...renderXPath];
	let allIgnoreKeys = [...ignoreKeys];
	const reactiveProps = Object.entries(spec).filter(([key, value]) => key.startsWith('$') && !ignoreKeys.includes(key));
	if (reactiveProps.length > 0) {
		reactiveProps.forEach(([key, initialValue]) => {
			// if they property does not exist on the element, create it
			if (!(key in el)) {
				// Create a reactive property on the element
				createReactiveProperty(el, key, initialValue);
			}
			allIgnoreKeys.push(key);
		});
	}
	// set id using XPath if it's defined
	if ('id' in spec && spec.id !== undefined && el instanceof HTMLElement) {
		el.id = transform(spec.id as string, el as Node);
		allIgnoreKeys.push('id');
	}
	// Apply all properties
	for (const [key, value] of Object.entries(spec)) {
		if (allIgnoreKeys.includes(key)) {
			continue;
		}

		const handler = ddomHandlers[key] || ddomHandlers.default;
		handler(spec, el, key, value, css);
	}

	// // Handle textContent and innerHTML with XPath transformation
	// for (const key of renderXPath) {
	// 	if (spec[key as keyof DOMSpec]) {
	// 		(el as any)[key] = transform(spec[key as keyof DOMSpec] as string, (el as Node));
	// 	}
	// }
}


/**
 * Adopts a WindowSpec into the current window context.
 * This function applies the declarative window properties to the global window object.
 * 
 * @param spec The declarative window object to adopt
 * @example
 * ```typescript
 * adoptWindow({
 *   document: { title: 'My App' },
 *   customElements: [{ tagName: 'my-component' }]
 * });
 * ```
 */
export function adoptWindow(spec: WindowSpec) {
	adoptNode(spec, window);
}

/**
 * Creates an HTML element from a declarative element definition and appends it to a parent node.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers, then immediately appends
 * it to the specified parent node.
 * 
 * @param spec The declarative HTML element definition
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
export function appendChild(spec: HTMLElementSpec, parentNode: DOMNode, css: boolean = true): HTMLElement {
	const el = document.createElement(spec.tagName) as HTMLElement;

	// Append the element to the provided parent node
	if ('appendChild' in parentNode) {
		parentNode.appendChild(el);
	}

	// Apply all properties using the unified dispatch table
	adoptNode(spec, el, css, ['id', 'parentNode', 'tagName']);

	return el;
}

/**
 * Creates an HTML element from a declarative element definition.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers.
 * 
 * @param spec The declarative HTML element definition
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
export function createElement(spec: HTMLElementSpec, css: boolean = true): HTMLElement {
	const el = document.createElement(spec.tagName) as HTMLElement;

	// Apply all properties using the unified dispatch table
	adoptNode(spec, el, css, ['id', 'parentNode', 'tagName']);

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

	const reactiveProps = Object.keys(arrayExpr?.map || {}).filter(key => key.startsWith('$'));

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
				const el = appendChild(item, (parentElement as HTMLElement), css);
				// assign reactive properties if they exist
				reactiveProps.forEach(key => {
					const property: Signal.State<any> = (el as any)[key];
					if (Signal.isState(property)) {
						// If it's a state signal, set its value
						// debvug
						property.set(item[key]);
					}
				});
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