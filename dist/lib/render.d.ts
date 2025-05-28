import { DeclarativeCustomElement, DeclarativeWindow, DeclarativeDOM, DOMNode } from '../spec/types';
export declare function render(ddom: DeclarativeDOM, element?: DOMNode, parentSelector?: string, childIndex?: number, addStyles?: boolean): DOMNode | null;
export declare function registerCustomElements(elements: DeclarativeCustomElement[]): void;
/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
export declare function renderWindow(ddom: DeclarativeWindow): void;
