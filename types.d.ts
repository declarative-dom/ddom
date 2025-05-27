/**
 * DeclarativeDOM is a type system and specification for defining structured DOM data
 * in a JS-native format. It is intended to reflect the shape of the real DOM 
 * (HTMLElement, Window, etc.) as closely as possible, with only the minimal
 * necessary changes to support declarative definition.
 */

type WritableOverrides = {
	tagName?: string;
	attributes?: Record<string, string>;
	children?: DeclarativeHTMLElement[];
	document?: Partial<DeclarativeDocument>;
	customElements?: DeclarativeCustomElement[];
};

export type DeclarativeCustomElement = WritableOverrides & {
	tagName: string; // Required for custom elements
	connectedCallback?: (element: HTMLElement) => void;
	disconnectedCallback?: (element: HTMLElement) => void;
	attributeChangedCallback?: (element: HTMLElement, name: string, oldValue: string | null, newValue: string | null) => void;
	adoptedCallback?: (element: HTMLElement) => void;
	observedAttributes?: string[];
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