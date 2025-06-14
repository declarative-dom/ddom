import {
	CustomElementSpec,
	HTMLBodyElementSpec,
	HTMLElementSpec,
	HTMLHeadElementSpec,
	WindowSpec,
	DocumentSpec,
	DOMSpec,
	ElementSpec,
	DOMNode,
	StyleExpr,
} from '../../../types/src';

import {
	adoptNode,
} from '../elements';

import {
	createEffect,
	Signal
} from '../events';

import {
	insertRules,
} from '../styleSheets';

/**
 * Registers an array of custom elements with the browser's CustomElementRegistry.
 * Modern, simplified implementation using latest JavaScript features.
 * 
 * Key features:
 * - Single initialization per element
 * - AbortController for automatic cleanup
 * - Simplified container logic
 * - No unnecessary feature detection
 * 
 * @param elements Array of declarative custom element definitions to register
 */
export function define(elements: CustomElementSpec[]) {
	elements
		.filter(element => !customElements.get(element.tagName))
		.forEach(spec => {
			// Register styles and document modifications once
			adoptStyles(spec, spec.tagName);
			if (spec.document) adoptNode(spec.document as DocumentSpec, document);

			// Extract computed properties for class definition
			const computedProps = Object.getOwnPropertyDescriptors(spec);
			const getterSetters = Object.entries(computedProps)
				.filter(([, descriptor]) => descriptor.get || descriptor.set);

			// Properties to ignore during DOM adoption
			const ignoreKeys = [
				'tagName', 'document', 'style', 'constructor',
				...getterSetters.map(([key]) => key)
			];

			customElements.define(spec.tagName, class extends HTMLElement {
				#controller = new AbortController();
				#container: HTMLElement | ShadowRoot;
				#internals?: ElementInternals;
				#initialized = false;

				constructor() {
					super();

					// Set up computed properties
					getterSetters.forEach(([key, descriptor]) => {
						Object.defineProperty(this, key, descriptor);
					});

					// Initialize internals once
					try {
						this.#internals = this.attachInternals();
					} catch {
						// Browser doesn't support attachInternals or already called
					}

					// Set container preference: shadow root > internals shadow > element
					this.#container = this.shadowRoot || this.#internals?.shadowRoot || this;

					// Call custom constructor
					(spec.constructor as any)?.(this);
				}

				connectedCallback() {
					if (!this.#initialized) {
						this.#initializeDOM();
						this.#initialized = true;
					}
					(spec.connectedCallback as any)?.call(this);
				}

				disconnectedCallback() {
					this.#controller.abort();
					(spec.disconnectedCallback as any)?.call(this);
				}

				#initializeDOM() {
					// Collect instance children before clearing content
					const instanceChildren = this.#collectInstanceChildren();
					
					// Clear existing content
					if ('innerHTML' in this.#container) {
						this.#container.innerHTML = '';
					}

					// Make abort signal available globally for cleanup
					(globalThis as any).__ddom_abort_signal = this.#controller.signal;

					try {
						// Add properties that already exist on the element to ignoreKeys
						// This prevents the custom element spec from overwriting instance properties
						const instanceIgnoreKeys = [
							...ignoreKeys,
							...Object.keys(this).filter(key => 
								Object.prototype.hasOwnProperty.call(this, key) && 
								!ignoreKeys.includes(key)
							)
						];

						// Handle slot functionality - process spec with instance children
						const processedSpec = this.#processSlots(spec, instanceChildren);

						// Disable CSS processing since styles are already registered at definition time
						adoptNode(processedSpec, this.#container, false, instanceIgnoreKeys);
					} finally {
						delete (globalThis as any).__ddom_abort_signal;
					}
				}

				#collectInstanceChildren(): any[] {
					const children: any[] = [];
					
					// Collect all child nodes that were added as instance children
					// These are the nodes that exist in the custom element before template processing
					for (const child of Array.from(this.childNodes)) {
						if (child.nodeType === Node.ELEMENT_NODE) {
							// Convert DOM node back to spec format for processing
							children.push(this.#domNodeToSpec(child as Element));
						} else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
							// Include text nodes as textContent
							children.push({
								tagName: 'span',
								textContent: child.textContent.trim()
							});
						}
					}
					
					return children;
				}

				#domNodeToSpec(element: Element): any {
					const spec: any = {
						tagName: element.tagName.toLowerCase()
					};
					
					// Copy attributes
					if (element.attributes.length > 0) {
						spec.attributes = {};
						for (const attr of Array.from(element.attributes)) {
							spec.attributes[attr.name] = attr.value;
						}
					}
					
					// Copy text content if it's a simple element
					if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
						spec.textContent = element.textContent;
					}
					
					// Recursively process child elements
					const children: any[] = [];
					for (const child of Array.from(element.childNodes)) {
						if (child.nodeType === Node.ELEMENT_NODE) {
							children.push(this.#domNodeToSpec(child as Element));
						} else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
							children.push({
								tagName: 'span',
								textContent: child.textContent.trim()
							});
						}
					}
					if (children.length > 0) {
						spec.children = children;
					}
					
					return spec;
				}

				#processSlots(elementSpec: any, instanceChildren: any[]): any {
					// If no instance children, return spec as-is
					if (instanceChildren.length === 0) {
						return elementSpec;
					}
					
					// If spec has no slots, return spec as-is (slotless component ignores instance children)
					if (!this.#hasSlots(elementSpec)) {
						return elementSpec;
					}
					
					// Create a deep copy of the spec to avoid modifying the original
					const processedSpec = this.#deepClone(elementSpec);
					
					// Replace slots with instance children
					this.#replaceSlots(processedSpec, instanceChildren);
					
					return processedSpec;
				}

				#deepClone(obj: any): any {
					if (obj === null || typeof obj !== 'object') return obj;
					if (obj instanceof Date) return new Date(obj.getTime());
					if (obj instanceof Array) return obj.map(item => this.#deepClone(item));
					if (typeof obj === 'object') {
						const cloned: any = {};
						Object.keys(obj).forEach(key => {
							cloned[key] = this.#deepClone(obj[key]);
						});
						return cloned;
					}
				}

				#hasSlots(spec: any): boolean {
					if (!spec.children) return false;
					
					return this.#findSlots(spec.children).length > 0;
				}

				#findSlots(children: any[]): any[] {
					const slots: any[] = [];
					
					if (!Array.isArray(children)) return slots;
					
					for (const child of children) {
						if (child.tagName === 'slot') {
							slots.push(child);
						} else if (child.children) {
							slots.push(...this.#findSlots(child.children));
						}
					}
					
					return slots;
				}

				#replaceSlots(spec: any, instanceChildren: any[]): void {
					if (!spec.children || !Array.isArray(spec.children)) return;
					
					// Separate instance children by slot name
					const defaultSlotChildren: any[] = [];
					const namedSlotChildren: Record<string, any[]> = {};
					
					for (const child of instanceChildren) {
						const slotName = child.attributes?.slot;
						if (slotName) {
							if (!namedSlotChildren[slotName]) {
								namedSlotChildren[slotName] = [];
							}
							namedSlotChildren[slotName].push(child);
						} else {
							defaultSlotChildren.push(child);
						}
					}
					
					// Replace slots in the spec
					for (let i = 0; i < spec.children.length; i++) {
						const child = spec.children[i];
						
						if (child.tagName === 'slot') {
							const slotName = child.attributes?.name;
							const replacementChildren = slotName 
								? (namedSlotChildren[slotName] || [])
								: defaultSlotChildren;
							
							// Replace the slot with the appropriate children
							if (replacementChildren.length > 0) {
								spec.children.splice(i, 1, ...replacementChildren);
								i += replacementChildren.length - 1; // Adjust index for inserted items
							} else {
								// Remove empty slot
								spec.children.splice(i, 1);
								i--; // Adjust index for removed item
							}
						} else if (child.children) {
							// Recursively process nested children
							this.#replaceSlots(child, instanceChildren);
						}
					}
				}

				// Standard custom element callbacks with optional spec handlers
				adoptedCallback() { (spec.adoptedCallback as any)?.call(this); }
				attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
					(spec.attributeChangedCallback as any)?.call(this, name, oldValue, newValue);
				}
				connectedMoveCallback() { (spec.connectedMoveCallback as any)?.call(this); }
				formAssociatedCallback(form: HTMLFormElement | null) { 
					(spec.formAssociatedCallback as any)?.call(this, form); 
				}
				formDisabledCallback(disabled: boolean) { 
					(spec.formDisabledCallback as any)?.call(this, disabled); 
				}
				formResetCallback() { (spec.formResetCallback as any)?.call(this); }
				formStateRestoreCallback(state: any, mode: 'restore' | 'autocomplete') {
					(spec.formStateRestoreCallback as any)?.call(this, state, mode);
				}

				static get observedAttributes() {
					return spec.observedAttributes || [];
				}
			});
		});
}

/**
 * Recursively registers styles for a custom element and all its children.
 * This function processes the style object of the element and its nested children,
 * generating CSS rules with appropriate selectors. When multiple elements of the same
 * type have different styles, it adds :nth-of-type() selectors for specificity.
 * 
 * @param spec The declarative DOM element or any object with style and children properties
 * @param selector The CSS selector to use for this element's styles
 * @example
 * ```typescript
 * adoptStyles(myElement, 'my-component');
 * // Generates CSS rules for my-component and its children
 * ```
 */
function adoptStyles(spec: any, selector: string): void {
	// Register styles for the element itself
	if (spec.style) {
		insertRules(spec.style, selector);
	}

	// Recursively register styles for children
	if (spec.children && Array.isArray(spec.children)) {
		// Track occurrences of each tagName to detect duplicates
		const tagNameCounts = new Map<string, number>();
		const tagNameIndexes = new Map<string, number>();

		// Count occurrences of each tagName that has styles
		spec.children.forEach((child: HTMLElementSpec) => {
			if (child.style && typeof child.style === 'object' && child.tagName) {
				const tagName = child.tagName.toLowerCase();
				tagNameCounts.set(tagName, (tagNameCounts.get(tagName) || 0) + 1);
			}
		});

		spec.children.forEach((child: HTMLElementSpec) => {
			let childSelector: string = selector;

			const tagName = child.tagName?.toLowerCase() || '*';
			const count = tagNameCounts.get(tagName) || 0;

			if (count > 1) {
				// Multiple elements of same type - use nth-of-type selector (consistent with elements.ts)
				const currentIndex = (tagNameIndexes.get(tagName) || 0) + 1;
				tagNameIndexes.set(tagName, currentIndex);

				childSelector = `${selector} > ${tagName}:nth-of-type(${currentIndex})`;
			} else {
				// Single element of this type - use simple descendant selector
				childSelector = `${selector} > ${tagName}`;
			}

			adoptStyles(child, childSelector);
		});
	}
}