import { DeclarativeCustomElement, DeclarativeHTMLElement, DeclarativeWindow, DeclarativeDocument } from '../spec/types';
import { clearDDOMStyles } from './css';
export declare function render(desc: DeclarativeHTMLElement | DeclarativeWindow | DeclarativeDocument, element?: HTMLBodyElement | HTMLElement | HTMLHeadElement | Document | Window): HTMLBodyElement | HTMLElement | HTMLHeadElement | Document | Window | null;
export declare function registerCustomElements(elements: DeclarativeCustomElement[]): void;
/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
export declare function renderWindow(desc: DeclarativeWindow): void;
declare global {
    interface Window {
        DDOM: {
            renderWindow: typeof renderWindow;
            render: typeof render;
            registerCustomElements: typeof registerCustomElements;
            clearDDOMStyles: typeof clearDDOMStyles;
        };
    }
}
