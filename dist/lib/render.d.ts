import { DeclarativeHTMLElement, DeclarativeWindow } from './../types';
export declare function buildElementTree(desc: DeclarativeHTMLElement, element?: HTMLBodyElement | HTMLElement | HTMLHeadElement): HTMLBodyElement | HTMLElement | HTMLHeadElement;
export declare function registerCustomElements(map: Record<string, DeclarativeHTMLElement>): void;
/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
export declare function renderWindow(desc: DeclarativeWindow): void;
declare global {
    interface Window {
        DDOM: {
            renderWindow: typeof renderWindow;
            buildElementTree: typeof buildElementTree;
            registerCustomElements: typeof registerCustomElements;
        };
    }
}
