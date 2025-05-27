import { DeclarativeHTMLElement } from './../types';
export declare function getSelector(element: Element | DeclarativeHTMLElement, parentSelector?: string, childIndex?: number): string;
/**
 * Generate a CSS selector for a rendered element based on its position in the document
 */
export declare function generateElementSelector(element: HTMLElement): string;
