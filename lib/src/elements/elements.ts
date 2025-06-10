import {
	MappedArrayExpr,
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
	MappedArray,
	isMappedArrayExpr,
} from '../arrays';

import {
	createEffect,
	Signal
} from '../events';

import {
	insertRules,
} from '../styleSheets';

import {
	parseTemplateLiteral,
	isTemplateLiteral,
	bindReactiveProperty,
	bindReactiveAttribute,
	createReactiveProperty
} from '../templates';

// Properties that are immutable after element creation (structural identity)
const IMMUTABLE_PROPERTIES = new Set(['id', 'tagName']);

// Properties that should use imperative updates rather than signal assignment (mutable state)
const IMPERATIVE_PROPERTIES = new Set(['textContent', 'innerHTML', 'outerHTML', 'className', 'contentEditable', 'style']);

const ddomHandlers: {
	[key: string]: (spec: DOMSpec, el: DOMNode, key: string, descriptor: PropertyDescriptor, css?: boolean) => void;
} = {
	children: (spec, el, key, descriptor, css) => {
		const value = descriptor.value;
		// Handle function-based children (for reactive/computed children)
		if (isMappedArrayExpr(value)) {
			try {
				adoptArray(value, el as Element);
			} catch (error) {
				console.warn(`Failed to process MappedArrayExpr for children:`, error);
			}
		} else if (Array.isArray(value)) {
			value.forEach((child: HTMLElementSpec) => {
				appendChild(child, el as DOMNode, css);
			});
		} else {
			console.warn(`Invalid children value for key "${key}":`, value);
		}
	},
	attributes: (spec, el, key, descriptor) => {
		const value = descriptor.value;
		if (value && typeof value === 'object') {
			for (const [attrName, attrValue] of Object.entries(value)) {
				if (typeof attrValue === 'string') {
					// Check if this is a reactive template expression
					if (isTemplateLiteral(attrValue) && el instanceof Element) {
						// Set up fine-grained reactivity for this attribute
						bindReactiveAttribute(el, attrName, attrValue);
					} else {
						// Static string - evaluate once and set
						const evaluatedValue = parseTemplateLiteral(attrValue, el as Node);
						if (el instanceof Element) {
							if (typeof evaluatedValue === 'boolean') {
								// Handle boolean attributes
								if (evaluatedValue) {
									el.setAttribute(attrName, '');
								} else {
									el.removeAttribute(attrName);
								}
							} else {
								// Set other attributes directly
								el.setAttribute(attrName, evaluatedValue as string);
							}
						}
					}
				} else if (typeof attrValue === 'function') {
					// eval function attributes
					const evaluatedValue = attrValue(el);
					if (el instanceof Element) {
						if (typeof evaluatedValue === 'boolean') {
							// Handle boolean attributes
							if (evaluatedValue) {
								el.setAttribute(attrName, '');
							} else {
								el.removeAttribute(attrName);
							}
						} else {
							// Set other attributes directly
							el.setAttribute(attrName, evaluatedValue as string);
						}
					}
				} else {
					// Direct value assignment
					if (el instanceof Element) {
						if (typeof attrValue === 'boolean') {
							// Handle boolean attributes
							if (attrValue) {
								el.setAttribute(attrName, '');
							} else {
								el.removeAttribute(attrName);
							}
						} else {
							// Set other attributes directly
							el.setAttribute(attrName, attrValue as string);
						}
					}
				}
			}
		}
	},
	style: (spec, el, key, descriptor, css) => {
		const value = descriptor.value;
		if (css && value && typeof value === 'object') {
			adoptStyles((el as Element), value);
		}
	},
	document: (spec, el, key, descriptor) => {
		const value = descriptor.value;
		if (value && el === window) {
			adoptNode(value as DocumentSpec, document);
		}
	},
	body: (spec, el, key, descriptor) => {
		const value = descriptor.value;
		if (value && (el === document || 'documentElement' in el)) {
			adoptNode(value as HTMLElementSpec, document.body);
		}
	},
	head: (spec, el, key, descriptor) => {
		const value = descriptor.value;
		if (value && (el === document || 'documentElement' in el)) {
			adoptNode(value as HTMLElementSpec, document.head);
		}
	},
	customElements: (spec, el, key, descriptor) => {
		const value = descriptor.value;
		if (value) {
			// Import define dynamically to avoid circular dependency
			import('../customElements').then(({ define }) => {
				define(value);
			});
		}
	},
	default: (spec, el, key, descriptor) => {
		// Handle event listeners first - they should always be added regardless of precedence
		if (key.startsWith('on') && typeof descriptor.value === 'function' && el instanceof Element) {
			const eventName = key.slice(2).toLowerCase();
			el.addEventListener(eventName, descriptor.value as EventListener);
		}
		// For all other properties, only proceed if the property doesn't exist as an instance property
		else if (!Object.prototype.hasOwnProperty.call(el, key)) {
			// Handle native getter/setter properties (ES6+ syntax)
			if (descriptor.get || descriptor.set) {
				Object.defineProperty(el, key, descriptor);
			}
			// Handle non-event function properties
			else if (typeof descriptor.value === 'function') {
				(el as any)[key] = descriptor.value;
			} else if (typeof descriptor.value === 'string' && isTemplateLiteral(descriptor.value) && !IMMUTABLE_PROPERTIES.has(key)) {
				// Set up fine-grained reactivity - the template will auto-update when dependencies change
				// debug
				console.debug(`Binding reactive property for key "${key}" with template:`, descriptor.value);
				bindReactiveProperty(el, key, descriptor.value);
			} else {
				// For non-function, non-templated properties, wrap in transparent signal proxy
				// but only if not protected (id, tagName)
				if (!IMPERATIVE_PROPERTIES.has(key)) {
					// debug
					console.debug(`Creating signal for key "${key}" with value:`, descriptor.value);
					createReactiveProperty(el, key, descriptor.value);
				} else {
					// Protected properties are set once and never reactive
					(el as any)[key] = descriptor.value;
				}
			}
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
 * Uses the new reactivity model:
 * - Template literals with ${...} get computed signals + effects
 * - Non-function, non-templated properties get transparent signal proxies
 * - Protected properties (id, tagName) are set once and never reactive
 * 
 * @param spec The declarative DOM object to adopt
 * @param el The target DOM node to apply properties to
 * @param css Whether to process CSS styles (default: true)
 * @param ignoreKeys Array of property keys to ignore during adoption
 * @example
 * ```typescript
 * adoptNode({
 *   textContent: 'Hello ${this.name}', // Template literal - creates computed signal
 *   count: 0, // Non-templated - gets transparent signal proxy
 *   id: 'my-element', // Protected - set once, never reactive
 *   style: { color: 'red' }
 * }, myElement);
 * ```
 */
export function adoptNode(spec: DOMSpec, el: DOMNode, css: boolean = true, ignoreKeys: string[] = []): void {
	let allIgnoreKeys = ['children',...ignoreKeys];

	// Process all properties using descriptors - handles both values and native getters/setters
	const specDescriptors = Object.getOwnPropertyDescriptors(spec);

	// Handle protected properties first (id, tagName) - set once, never reactive
	if ('id' in spec && spec.id !== undefined && el instanceof HTMLElement) {
		el.id = parseTemplateLiteral(spec.id as string, el as Node);
		allIgnoreKeys.push('id');
	}

	// Process all other properties with new reactivity model
	Object.entries(specDescriptors).forEach(([key, descriptor]) => {
		if (allIgnoreKeys.includes(key)) {
			return;
		}

		const handler = ddomHandlers[key] || ddomHandlers.default;
		handler(spec, el, key, descriptor, css);
	});

	// Handle children last to ensure all properties are set before appending
	if ('children' in spec && spec.children) {
		const children = spec.children;
		if (isMappedArrayExpr(children)) {
			try {
				adoptArray(children, el as Element, css);
			} catch (error) {
				console.warn(`Failed to process MappedArrayExpr for children:`, error);
			}
		} else if (Array.isArray(children)) {
			children.forEach((child: HTMLElementSpec) => {
				appendChild(child, el as DOMNode, css);
			});
		} else {
			console.warn(`Invalid children value for key "children":`, children);
		}
	}
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
 * Adopts a MappedArrayExpr and renders its items as DOM elements in the parent container
 * 
 * This function creates a reactive MappedArrayExpr instance and renders each mapped item
 * as a DOM element, properly handling reactive properties and leveraging existing element
 * creation functions.
 * 
 * @param arrayExpr - The MappedArray configuration
 * @param parentElement - The parent DOM element to render items into
 * @param css - Whether to process CSS styles (default: true)
 */
export function adoptArray<T>(
	arrayExpr: MappedArrayExpr<T, any>,
	parentElement: Element,
	css = true,
): void {	// Create the reactive MappedArrayExpr instance
	const reactiveArray = new MappedArray(arrayExpr, parentElement);

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
			}
		});
	};

	// Initial render
	renderArray();

	// Set up reactive effect using the integrated createEffect function
	// This will automatically re-render when the array's dependencies change
	const effectCleanup = createEffect(() => {
		// Access the array signal to establish dependencies
		reactiveArray.get();

		// Return cleanup function that triggers re-render
		return () => {
			queueMicrotask(renderArray);
		};
	});

	// Note: effectCleanup could be returned if the caller needs to clean up manually,
	// but typically the effect will be cleaned up when the parent element is removed
}