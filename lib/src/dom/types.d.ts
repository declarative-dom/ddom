/**
 * DOM Type Definitions
 * 
 * Core DOM specification types for Declarative DOM.
 * These types define the structure of declarative DOM objects.
 */

import { Signal } from '../core/signals';
import type { ArrayConfig } from '../namespaces/array';

/**
 * StyleExpr Type Definition
 * Extends standard CSS properties to support nested selectors and pseudo-selectors.
 * This type enables CSS nesting syntax within style objects for more powerful styling.
 * Supports all standard CSSStyleDeclaration properties plus selector-based nesting.
 * @example
 * {
 *   backgroundColor: 'blue',
 *   ':hover': { backgroundColor: 'red' },
 *   '.child': { color: 'white' }
 * }
 */
export type StyleExpr = {
	[K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K];
} & {
	[selector: string]: StyleExpr;
};

/**
 * WritableOverrides Type Definition
 * Defines properties that override normally read-only DOM properties to enable declarative definition.
 * These properties are essential for creating DOM structures declaratively while maintaining
 * alignment with native DOM APIs.
 * @property tagName - The HTML tag name for the element (normally read-only).
 * @property attributes - Key-value pairs for HTML attributes.
 * @property children - Array of child elements or a declarative array definition.
 * @property document - Partial document definition for global modifications.
 * @property customElements - Array of custom element definitions.
 * @property style - CSS properties with support for nesting.
 */
type WritableOverrides = {
	tagName?: string;
	attributes?: Record<string, string>;
	children?: HTMLElementSpec[] | ArrayConfig<any[], CustomElementSpec>;
	document?: Partial<DocumentSpec>
	customElements?: CustomElementSpec[];
	style?: StyleExpr;
};

/**
 * CustomElementSpec Type Definition
 * Defines a custom HTML element (Web Component) with declarative structure and behavior.
 * Supports all standard Web Component lifecycle methods and reactive properties.
 * Custom elements must have a hyphenated tagName to comply with Web Components standards.
 * 
 * Reactivity Model:
 * - Template literals with ${...} automatically get computed signals + effects
 * - Non-function, non-templated properties get transparent signal proxies
 * - Protected properties (id, tagName) are set once and never reactive
 * 
 * @property tagName - Required hyphenated tag name for the custom element.
 * @property constructor - Optional constructor function called when element is created.
 * @property adoptedCallback - Called when element is moved to a new document.
 * @property attributeChangedCallback - Called when observed attributes change.
 * @property connectedCallback - Called when element is connected to the DOM.
 * @property connectedMoveCallback - Called when element is moved within the DOM.
 * @property disconnectedCallback - Called when element is removed from the DOM.
 * @property formAssociatedCallback - Called when element is associated with a form.
 * @property formDisabledCallback - Called when form is disabled/enabled.
 * @property formResetCallback - Called when associated form is reset.
 * @property formStateRestoreCallback - Called when form state is restored.
 * @property observedAttributes - Array of attribute names to observe for changes.
 */
export type CustomElementSpec = WritableOverrides & {
	tagName: string; // Required for custom elements
	constructor?: (element: HTMLElement) => void;
	adoptedCallback?: (element: HTMLElement) => void;
	attributeChangedCallback?: (element: HTMLElement, name: string, oldValue: string | null, newValue: string | null) => void;
	connectedCallback?: (element: HTMLElement) => void;
	connectedMoveCallback?: (element: HTMLElement) => void;
	disconnectedCallback?: (element: HTMLElement) => void;
	formAssociatedCallback?: (element: HTMLElement, form: HTMLFormElement | null) => void;
	formDisabledCallback?: (element: HTMLElement, disabled: boolean) => void;
	formResetCallback?: (element: HTMLElement) => void;
	formStateRestoreCallback?: (element: HTMLElement, state: any, mode: 'restore' | 'autocomplete') => void;
	observedAttributes?: string[];
};

/**
 * HTMLBodyElementSpec Type Definition
 * Represents the HTML body element with declarative properties.
 * Extends the standard HTMLBodyElement interface with writable overrides
 * to enable declarative definition of the document body.
 */
export type HTMLBodyElementSpec = Omit<HTMLBodyElement, keyof WritableOverrides> & WritableOverrides & {};

/**
 * HTMLElementSpec Type Definition
 * Represents any standard HTML element with declarative properties.
 * This is the base type for all HTML elements in the Declarative DOM system.
 * @property tagName - Required HTML tag name for the element.
 * @property parentNode - Optional parent node reference for processing.
 */
export type HTMLElementSpec = Omit<HTMLElement, keyof WritableOverrides | 'parentNode'> & WritableOverrides & {
	tagName: string; // Required for elements
	parentNode?: DOMNode | ElementSpec; // Allow parentNode to be declared during processing
}

/**
 * HTMLHeadElementSpec Type Definition
 * Represents the HTML head element with declarative properties.
 * Extends the standard HTMLHeadElement interface with writable overrides
 * to enable declarative definition of the document head.
 */
export type HTMLHeadElementSpec = Omit<HTMLHeadElement, keyof WritableOverrides> & WritableOverrides & {};

/**
 * DocumentSpec Type Definition
 * Represents an HTML document with declarative properties.
 * Enables declarative definition of document structure including head and body elements.
 * @property body - Optional declarative body element definition.
 * @property head - Optional declarative head element definition.
 */
export type DocumentSpec = Omit<Document, keyof WritableOverrides> & WritableOverrides & {
	body?: Partial<HTMLBodyElementSpec>;
	head?: Partial<HTMLHeadElementSpec>;
};

/**
 * WindowSpec Type Definition
 * Represents a browser window with declarative properties.
 * Enables declarative definition of window-level properties and behavior.
 * This is typically the root level of a Declarative DOM structure.
 */
export type WindowSpec = Omit<Window, keyof WritableOverrides> & WritableOverrides & {};

/**
 * DOMSpec Type Definition
 * Union type representing all possible Declarative DOM node types.
 * This includes all element types, documents, windows, and custom elements.
 * Used as the top-level type for any Declarative DOM structure.
 */
export type DOMSpec = HTMLElementSpec | HTMLBodyElementSpec | HTMLHeadElementSpec | DocumentSpec | WindowSpec | CustomElementSpec;

/**
 * ElementSpec Type Definition
 * Union type representing all Declarative DOM element types (excluding Document and Window).
 * Used when specifically referring to element nodes rather than document or window objects.
 */
export type ElementSpec = HTMLElementSpec | HTMLBodyElementSpec | HTMLHeadElementSpec | CustomElementSpec;

/**
 * DOMNode Type Definition
 * Union type representing all possible native DOM node types.
 * Used for type checking when interfacing between Declarative DOM and native DOM APIs.
 * Includes all standard DOM node types that can be parents or targets of DOM operations.
 */
export type DOMNode = HTMLElement | HTMLBodyElement | HTMLHeadElement | Document | ShadowRoot | DocumentFragment | Window;

/**
 * Type definition for scope property injection data.
 * Maps property names to their reactive signal or function values.
 */
export type ScopeProperties = Record<string, Signal.State<any> | Signal.Computed<any> | Function>;

/**
 * DOMSpecOptions interface for processing options
 */
export interface DOMSpecOptions {
  /** Whether to process CSS styles (default: true) */
  css?: boolean;
  /** Array of property keys to ignore during adoption (default: []) */
  ignoreKeys?: string[];
  /** Reactive properties to inherit from parent scope */
  scopeProperties?: ScopeProperties;
}
