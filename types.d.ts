/**
 * DeclarativeDOM is a type system and specification for defining structured DOM data
 * in a JS-native format. It is intended to reflect the shape of the real DOM 
 * (HTMLElement, Window, etc.) as closely as possible, with only the minimal
 * necessary changes to support declarative definition.
 */

type WritableHTMLElementOverrides = {
	tagName: string;
	attributes?: Record<string, string>;
	children?: DeclarativeHTMLElement[];
};

export type DeclarativeHTMLBodyElement = Omit<HTMLBodyElement, keyof WritableHTMLElementOverrides> & WritableHTMLElementOverrides & {};

export type DeclarativeHTMLElement = Omit<HTMLElement, keyof WritableHTMLElementOverrides> & WritableHTMLElementOverrides & {};

export type DeclarativeHTMLHeadElement = Omit<HTMLHeadElement, keyof WritableHTMLElementOverrides> & WritableHTMLElementOverrides & {};

type WritableDocumentOverrides = {
	body?: Partial<DeclarativeHTMLBodyElement>;
	head?: Partial<DeclarativeHTMLHeadElement>;
};

export type DeclarativeDocument = Omit<Document, keyof WritableDocumentOverrides> & WritableDocumentOverrides & {};

type WritableWindowOverrides = {
	document?: Partial<DeclarativeDocument>;
	customElements?: Record<string, DeclarativeHTMLElement>;
};

export type DeclarativeWindow = Omit<Window, keyof WritableWindowOverrides> & WritableWindowOverrides & {};