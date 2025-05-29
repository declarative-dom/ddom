/**
 * DeclarativeDOM is a type system and specification for defining structured DOM data
 * in a JS-native format. It is intended to reflect the shape of the real DOM 
 * (HTMLElement, Window, etc.) as closely as possible, with only the minimal
 * necessary changes to support declarative definition.
 */

export type NestedCSSProperties = {
	[K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K];
} & {
	[selector: string]: NestedCSSProperties;
};

type WritableOverrides = {
	tagName?: string;
	attributes?: Record<string, string>;
	children?: DeclarativeHTMLElement[];
	document?: Partial<DeclarativeDocument>;
	customElements?: DeclarativeCustomElement[];
	style?: NestedCSSProperties;
};

export type DeclarativeCustomElement = WritableOverrides & {
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
} & {
	[K in `$${string}`]?: any; // Support $-prefixed reactive properties
};

export type DeclarativeHTMLBodyElement = Omit<HTMLBodyElement, keyof WritableOverrides> & WritableOverrides & {};

export type DeclarativeHTMLElement = Omit<HTMLElement, keyof WritableOverrides> & WritableOverrides & {
	tagName: string; // Required for elements
};

export type DeclarativeHTMLHeadElement = Omit<HTMLHeadElement, keyof WritableOverrides> & WritableOverrides & {};

export type DeclarativeDocument = Omit<Document, keyof WritableOverrides> & WritableOverrides & {
	body?: Partial<DeclarativeHTMLBodyElement>;
	head?: Partial<DeclarativeHTMLHeadElement>;
};

export type DeclarativeWindow = Omit<Window, keyof WritableOverrides> & WritableOverrides & {};

export type DeclarativeDOM = DeclarativeHTMLElement | DeclarativeHTMLBodyElement | DeclarativeHTMLHeadElement | DeclarativeDocument | DeclarativeWindow | DeclarativeCustomElement;

export type DeclarativeDOMElement = DeclarativeHTMLElement | DeclarativeHTMLBodyElement | DeclarativeHTMLHeadElement | DeclarativeCustomElement;

export type DOMNode = HTMLElement | HTMLBodyElement | HTMLHeadElement | Document | ShadowRoot | DocumentFragment | Window;