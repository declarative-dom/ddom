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
	Signal,
	createReactiveProperty,
	globalSignalWatcher,
} from '../events';

import {
	insertRules,
} from '../styleSheets';

/**
 * Registers an array of custom elements with the browser's CustomElementRegistry.
 * This function creates new custom element classes that extend HTMLElement and
 * implement the declarative DOM structure and behavior specified in the definitions.
 * 
 * @param elements Array of declarative custom element definitions to register
 * @example
 * ```typescript
 * define([{
 *   tagName: 'my-component',
 *   children: [{ tagName: 'p', textContent: 'Hello World' }],
 *   connectedCallback: (el) => console.log('Component connected')
 * }]);
 * ```
 */
export function define(elements: CustomElementSpec[]) {
	const unregisteredDDOMElements = elements.filter(element => !customElements.get(element.tagName));

	unregisteredDDOMElements.forEach(ddom => {
		// Register styles once during element registration
		adoptStyles(ddom, ddom.tagName);

		// Handle global document modifications from custom element
		if (ddom.document) {
			adoptNode(ddom.document as DocumentSpec, document);
		}

		// Apply all properties using the unified dispatch table
		const customElementIgnoreKeys = [
			'tagName', 'document', 'adoptedCallback', 'attributeChangedCallback',
			'connectedCallback', 'connectedMoveCallback', 'disconnectedCallback',
			'formAssociatedCallback', 'formDisabledCallback', 'formResetCallback',
			'formStateRestoreCallback', 'observedAttributes', 'constructor', 'style'
		];

		const reactiveProps = Object.entries(ddom).filter(([key, value]) => key.startsWith('$'));
		// debug
		console.log(`[define] Registering custom element: ${ddom.tagName}`, {
			reactiveProps,
			ignoreKeys: customElementIgnoreKeys
		});

		// const allIgnoreKeys = [...customElementIgnoreKeys, ...reactiveProps.map(([key]) => key)];

		customElements.define(ddom.tagName, class extends HTMLElement {
			#abortController = new AbortController();
			#container!: HTMLElement | ShadowRoot | DocumentFragment;

			#adoptNode() {
				console.log(`[${ddom.tagName}] Starting re-render...`);
				
				// Ensure container is initialized
				if (!this.#container) {
					this.#container = this;
				}

				// Clear any existing content
				if ('innerHTML' in this.#container) {
					this.#container.innerHTML = '';
				} else if (this.#container instanceof DocumentFragment) {
					// For DocumentFragment, remove all children
					while (this.#container.firstChild) {
						this.#container.removeChild(this.#container.firstChild);
					}
				}

				console.log(`[${ddom.tagName}] Calling adoptNode...`);
				// Apply all properties to the container with reactive context
				adoptNode(ddom, this.#container, false, customElementIgnoreKeys);
				console.log(`[${ddom.tagName}] Re-render complete`);
			}

			constructor() {
				super();

				// create signals for reactive keys and set up proper signal effect
				const signals: Signal.State<any>[] = [];
				reactiveProps.forEach(([key, initialValue]) => {
					console.log(`[${ddom.tagName}] Processing reactive prop: ${key}`, initialValue);
					const signal = createReactiveProperty(this, key, initialValue);
					signals.push(signal);
					console.log(`[${ddom.tagName}] Added signal for ${key}:`, signal);
				});
				
				// Create a proper effect using the exact pattern from the React example
				if (signals.length > 0) {
					console.log(`[${ddom.tagName}] Creating effect for ${signals.length} signals`);
					
					// Use the exact effect pattern from the React example
					const createEffect = (callback: () => void) => {
						let cleanup: (() => void) | void;

						const computed = new Signal.Computed(() => {
							cleanup?.();
							cleanup = callback();
						});

						globalSignalWatcher.watch(computed);
						computed.get();

						return () => {
							globalSignalWatcher.unwatch(computed);
							cleanup?.();
						};
					};
					
					// Create the effect that tracks our reactive properties
					const effectCleanup = createEffect(() => {
						console.log(`[${ddom.tagName}] Effect running - tracking dependencies`);
						
						// Access all signals directly to establish dependencies
						signals.forEach((signal, index) => {
							const value = signal.get(); // Direct signal access - no wrapper
							console.log(`[${ddom.tagName}] Effect tracking signal ${index}:`, value);
						});
						
						console.log(`[${ddom.tagName}] Effect dependencies established - will trigger re-render on next change`);
						
						// Return a cleanup function that triggers re-render
						return () => {
							console.log(`[${ddom.tagName}] Effect triggered - scheduling re-render`);
							this.#triggerAdoptNode();
						};
					});
					
					// Clean up on disconnect
					this.#abortController.signal.addEventListener('abort', () => {
						console.log(`[${ddom.tagName}] Cleaning up effect on disconnect`);
						effectCleanup();
					});
				}

				// Call custom constructor if defined
				if (ddom.constructor && typeof ddom.constructor === 'function') {
					ddom.constructor(this);
				}
			}

			adoptedCallback() {
				if (ddom.adoptedCallback && typeof ddom.adoptedCallback === 'function') {
					ddom.adoptedCallback(this);
				}
			}

			attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
				this.#triggerAdoptNode();
				if (ddom.attributeChangedCallback && typeof ddom.attributeChangedCallback === 'function') {
					ddom.attributeChangedCallback(this, name, oldValue, newValue);
				}
			}

			connectedCallback() {
				// Check for existing shadow root (declarative or programmatic)
				const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
				const internals = supportsDeclarative ? this.attachInternals() : undefined;

				// Check for a Declarative Shadow Root or existing shadow root
				this.#container = internals?.shadowRoot || this.shadowRoot || this;

				if (ddom.connectedCallback && typeof ddom.connectedCallback === 'function') {
					ddom.connectedCallback(this);
				}

				this.#adoptNode();
			}

			connectedMoveCallback() {
				if (ddom.connectedMoveCallback && typeof ddom.connectedMoveCallback === 'function') {
					ddom.connectedMoveCallback(this);
				}
			}

			disconnectedCallback() {
				this.#abortController.abort();
				if (ddom.disconnectedCallback && typeof ddom.disconnectedCallback === 'function') {
					ddom.disconnectedCallback(this);
				}
			}

			formAssociatedCallback(form: HTMLFormElement | null) {
				if (ddom.formAssociatedCallback && typeof ddom.formAssociatedCallback === 'function') {
					ddom.formAssociatedCallback(this, form);
				}
			}

			formDisabledCallback(disabled: boolean) {
				if (ddom.formDisabledCallback && typeof ddom.formDisabledCallback === 'function') {
					ddom.formDisabledCallback(this, disabled);
				}
			}

			formResetCallback() {
				if (ddom.formResetCallback && typeof ddom.formResetCallback === 'function') {
					ddom.formResetCallback(this);
				}
			}

			formStateRestoreCallback(state: any, mode: 'restore' | 'autocomplete') {
				if (ddom.formStateRestoreCallback && typeof ddom.formStateRestoreCallback === 'function') {
					ddom.formStateRestoreCallback(this, state, mode);
				}
			}

			static get observedAttributes() {
				return ddom.observedAttributes || [];
			}

			#triggerAdoptNode() {
				queueMicrotask(() => {
					if (this.#abortController.signal.aborted) {
						console.log(`[${ddom.tagName}] Re-render aborted - element disconnected`);
						return;
					}
					console.log(`[${ddom.tagName}] Triggering re-render...`);
					// Re-render the custom element
					this.#adoptNode();
				});
			}
		});
	});
}

/**
 * Recursively registers styles for a custom element and all its children.
 * This function processes the style object of the element and its nested children,
 * generating CSS rules with appropriate selectors.
 * 
 * @param ddom The declarative DOM element or any object with style and children properties
 * @param selector The CSS selector to use for this element's styles
 * @example
 * ```typescript
 * adoptStyles(myElement, 'my-component');
 * // Generates CSS rules for my-component and its children
 * ```
 */
function adoptStyles(ddom: any, selector: string): void {
	// Register styles for the element itself
	if (ddom.style) {
		insertRules(ddom.style, selector);
	}

	// Recursively register styles for children
	if (ddom.children && Array.isArray(ddom.children)) {
		ddom.children.forEach((child: HTMLElementSpec) => {
			if (child.style && typeof child.style === 'object') {
				// For custom element registration, we'll use a simple descendant selector
				const childSelector = `${selector} ${child.tagName?.toLowerCase() || '*'}`;
				adoptStyles(child, childSelector);
			}
		});
	}
}