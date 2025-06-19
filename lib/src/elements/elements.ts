import {
	MappedArrayExpr,
	StyleExpr,
	DocumentSpec,
	DOMSpec,
	HTMLElementSpec,
	WindowSpec,
	DOMNode,
} from '../../../types/src';

import {
	MappedArray,
	isMappedArrayExpr,
} from '../arrays';

import {
	createEffect,
	createReactiveProperty,
	ComponentSignalWatcher,
	Signal
} from '../events';

import {
	insertRules,
} from '../styleSheets';

import {
	parseTemplateLiteral,
	isTemplateLiteral,
	bindPropertyTemplate,
	bindAttributeTemplate,
} from '../templates';

import {
	isPropertyAccessor,
	resolvePropertyAccessor
} from '../accessors';

// Properties that are immutable after element creation (structural identity)
const IMMUTABLE_PROPERTIES = new Set(['id', 'tagName']);

// Properties that should use imperative updates rather than signal assignment (mutable state)
const IMPERATIVE_PROPERTIES = new Set([
	...Object.getOwnPropertyNames(Node.prototype),
	...Object.getOwnPropertyNames(Element.prototype),
	...Object.getOwnPropertyNames(HTMLElement.prototype)
]);

const ddomHandlers: {
	[key: string]: (spec: DOMSpec, el: DOMNode, key: string, descriptor: PropertyDescriptor, css?: boolean) => void;
} = {
	attributes: (spec, el, key, descriptor) => {
		const value = descriptor.value;
		if (value && typeof value === 'object') {
			for (const [attrName, attrValue] of Object.entries(value)) {
				if (typeof attrValue === 'string') {
					// Check if this is a reactive template expression
					if (isTemplateLiteral(attrValue) && el instanceof Element) {
						// Set up fine-grained reactivity for this attribute
						bindAttributeTemplate(el, attrName, attrValue);
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
	customElements: (spec, el, key, descriptor) => {
		const value = descriptor.value;
		if (value) {
			// Import define dynamically to avoid circular dependency
			import('../customElements').then(({ define }) => {
				define(value);
			});
		}
	},
	document: (spec, el, key, descriptor) => {
		const value = descriptor.value;
		if (value && el === window) {
			adoptDocument(value as DocumentSpec);
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
	style: (spec, el, key, descriptor, css) => {
		const value = descriptor.value;
		if (css && value && typeof value === 'object') {
			adoptStyles((el as Element), value);
		}
	},
	window: (spec, el, key, descriptor) => {
		const value = descriptor.value;
		if (value) {
			adoptWindow(value as WindowSpec);
		}
	},
	default: (spec, el, key, descriptor) => {
		if (!Object.prototype.hasOwnProperty.call(el, key)) {
			// Handle property accessor strings
			if (typeof descriptor.value === 'string' && isPropertyAccessor(descriptor.value)) {
				const resolved = resolvePropertyAccessor(descriptor.value, (el as Node));
				if (resolved !== null) {
					// Pass through any resolved value (signals, objects, arrays, functions, etc.)
					(el as any)[key] = resolved;
				} else {
					console.warn(`Failed to resolve property accessor "${descriptor.value}" for property "${key}"`);
				}
			}
			// Handle template literal strings
			else if (typeof descriptor.value === 'string' && isTemplateLiteral(descriptor.value) && !IMMUTABLE_PROPERTIES.has(key)) {
				// Set up fine-grained reactivity - the template will auto-update when dependencies change
				bindPropertyTemplate(el, key, descriptor.value);
			}
			// Handle non-event function properties
			else if (typeof descriptor.value === 'function') {
				(el as any)[key] = descriptor.value;
			} else {
				// For non-function, non-templated properties, wrap in transparent signal proxy
				// but only if not protected (id, tagName)
				if (!IMPERATIVE_PROPERTIES.has(key)) {
					// check to see if it's a signal already
					if (typeof descriptor.value === 'object' && descriptor.value !== null && Signal.isState(descriptor.value)) {
						// If it's already a signal, just set it directly
						(el as any)[key] = descriptor.value;
					} else {
						createReactiveProperty(el, key, descriptor.value);
					}
				} else {
					// Protected properties are set once and never reactive
					(el as any)[key] = descriptor.value;
				}
			}
		} else {
			// if the property already exists on the element, update it if it's a signal
			const existingValue = (el as any)[key];

			if (typeof existingValue === 'object' && existingValue !== null && Signal.isState(existingValue)) {
				// If existing value is a signal, update its value (not replace the signal)
				existingValue.set(descriptor.value);
			} else if (typeof existingValue != 'object' || !Signal.isComputed(existingValue)) {
				// Otherwise, just set the value directly
				// we're about to overwrite an existing property, so we can set it directly
				(el as any)[key] = descriptor.value;
			}
		}
	}
};


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
	let allIgnoreKeys = ['children', ...ignoreKeys];

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
 * Uses modern fine-grained updates instead of clearing and re-rendering everything.
 * 
 * @param arrayExpr - The MappedArray configuration
 * @param parentElement - The parent DOM element to render items into
 * @param css - Whether to process CSS styles (default: true)
 */
export function adoptArray<T>(
	arrayExpr: MappedArrayExpr<T, any>,
	parentElement: Element,
	css = true,
): void {
	// Create the reactive MappedArrayExpr instance
	const reactiveArray = new MappedArray(arrayExpr, parentElement);

	// Keep track of rendered elements by index for efficient updates
	const renderedElements = new Map<number, Element>();
	let previousItems: any[] = [];

	// Function to update the current array state with fine-grained updates
	// True key-based diffing inspired by the futuristic ComponentRepeater
	const updateArray = (items: any[]) => {
		// Track components by stable keys, not indices
		const currentKeys = new Set<string>();
		const newComponentsByKey = new Map<string, Element>();
		const keysToCreate = new Set<string>();
		const keysToUpdate = new Set<string>();
		const keysToRemove = new Set<string>();

		// Build sets of current and new keys
		const previousKeys = new Set(previousItems.map(item => item.id || JSON.stringify(item)));

		items.forEach((item: any) => {
			if (item && typeof item === 'object' && item.tagName) {
				const key = item.id || JSON.stringify(item);
				currentKeys.add(key);

				if (previousKeys.has(key)) {
					// Check if properties changed
					const previousItem = previousItems.find(prev => 
						(prev.id || JSON.stringify(prev)) === key
					);
					if (!deepEqual(item, previousItem)) {
						keysToUpdate.add(key);
					}
				} else {
					keysToCreate.add(key);
				}
			}
		});

		// Native Set difference operations (simulated)
		for (const key of previousKeys) {
			if (!currentKeys.has(key)) {
				keysToRemove.add(key);
			}
		}

		// Remove unused components
		keysToRemove.forEach(key => {
			const index = previousItems.findIndex(item => 
				(item.id || JSON.stringify(item)) === key
			);
			if (index >= 0) {
				const element = renderedElements.get(index);
				if (element && element.parentNode === parentElement) {
					element.remove();
				}
				renderedElements.delete(index);
			}
		});

		// Create new components
		keysToCreate.forEach(key => {
			const item = items.find(item => (item.id || JSON.stringify(item)) === key);
			if (item) {
				const element = createElement(item, css);
				newComponentsByKey.set(key, element);
			}
		});

		// Update existing components (property-level diffing)
		keysToUpdate.forEach(key => {
			const item = items.find(item => (item.id || JSON.stringify(item)) === key);
			const previousIndex = previousItems.findIndex(prev => 
				(prev.id || JSON.stringify(prev)) === key
			);

			if (item && previousIndex >= 0) {
				const element = renderedElements.get(previousIndex);
				if (element) {

					// Granular property updates
					Object.entries(item).forEach(([prop, value]) => {
						if (prop !== 'tagName' && (element as any)[prop] !== value) {
							if (typeof value === 'object' && value !== null) {
								// For complex objects, use adoptNode for deep updates
								adoptNode({ [prop]: value } as any, element as any, css);
							} else {
								(element as any)[prop] = value;
							}
						}
					});

					newComponentsByKey.set(key, element);
				}
			}
		});

		// Reuse unchanged components
		currentKeys.forEach(key => {
			if (!keysToCreate.has(key) && !keysToUpdate.has(key)) {
				const previousIndex = previousItems.findIndex(prev => 
					(prev.id || JSON.stringify(prev)) === key
				);
				if (previousIndex >= 0) {
					const element = renderedElements.get(previousIndex);
					if (element) {
						newComponentsByKey.set(key, element);
					}
				}
			}
		});

		// Efficient DOM manipulation with fragments
		const orderedElements = items
			.map(item => newComponentsByKey.get(item.id || JSON.stringify(item)))
			.filter((element): element is Element => element !== undefined);

		// Surgical DOM manipulation - only touch what changed (inspired by React reconciliation)
		if (keysToCreate.size > 0 || keysToRemove.size > 0 || keysToUpdate.size > 0) {

			// Get current children
			const currentChildren = Array.from(parentElement.children);

			if (orderedElements.length === 0) {
				// Clear all children if no elements needed
				parentElement.replaceChildren();
			} else if (currentChildren.length === 0) {
				// Initial render - use fragment
				const fragment = document.createDocumentFragment();
				orderedElements.forEach(element => fragment.appendChild(element));
				parentElement.appendChild(fragment);
			} else {
				// Precise DOM updates - only move/add/remove what's needed
				const currentElementSet = new Set(currentChildren);
				const newElementSet = new Set(orderedElements);

				// Remove elements that shouldn't be there anymore
				for (const element of currentChildren) {
					if (!newElementSet.has(element)) {
						element.remove();
					}
				}

				// Add/reorder elements to match desired order
				for (let i = 0; i < orderedElements.length; i++) {
					const desiredElement = orderedElements[i];
					const currentElement = parentElement.children[i];

					if (currentElement !== desiredElement) {
						// Insert element at correct position
						if (i >= parentElement.children.length) {
							// Append to end
							parentElement.appendChild(desiredElement);
						} else {
							// Insert before current element at this position
							parentElement.insertBefore(desiredElement, parentElement.children[i]);
						}
					}
				}
			}
		}

		// Update tracking structures
		renderedElements.clear();
		orderedElements.forEach((element, index) => {
			renderedElements.set(index, element);
		});
		previousItems = [...items];
	};

	// Efficient deep equality with Object.is optimization
	const deepEqual = (a: any, b: any): boolean => {
		if (Object.is(a, b)) return true;
		if (a == null || b == null) return false;
		if (typeof a !== typeof b || typeof a !== 'object') return false;

		// ID-based fast comparison for objects with stable IDs
		if (a.id && b.id) {
			return a.id === b.id;
		}

		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		return keysA.length === keysB.length &&
			keysA.every(key => deepEqual(a[key], b[key]));
	};

	// Set up reactive effect that handles both initial render and updates
	// Use component-specific watcher if available, otherwise fall back to global
	const componentWatcher = (globalThis as any).__ddom_component_watcher as ComponentSignalWatcher | undefined;

	const _effectCleanup = createEffect(() => {
		// Get the current items within the effect to establish dependency tracking
		const currentItems = reactiveArray.get();

		// Call updateArray immediately with the current items
		updateArray(currentItems);

		// Return empty cleanup since we're not deferring the update
		return () => { };
	}, componentWatcher);

	// Note: effectCleanup could be returned if the caller needs to clean up manually,
	// but typically the effect will be cleaned up when the parent element is removed
}