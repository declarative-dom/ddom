import { DeclarativeDocument, DeclarativeDOM, DeclarativeHTMLElement, DeclarativeWindow, DOMNode } from '../spec/types';
/**
 * Adopts a DeclarativeWindow into the current document context.
 */
export declare function adoptDocument(ddom: DeclarativeDocument): void;
export declare function adoptNode(ddom: DeclarativeDOM, el: DOMNode, css?: boolean, ignoreKeys?: string[]): void;
/**
 * Adopts a DeclarativeWindow into the current window context.
 */
export declare function adoptWindow(ddom: DeclarativeWindow): void;
export declare function createElement(ddom: DeclarativeHTMLElement, css?: boolean): HTMLElement;
