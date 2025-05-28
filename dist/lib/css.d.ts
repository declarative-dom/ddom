import { NestedCSSProperties } from '../spec/types';
/**
 * Gets or creates the global DDOM stylesheet
 */
export declare function getDDOMStyleSheet(): CSSStyleSheet;
/**
 * Clears all DDOM styles from the stylesheet
 */
export declare function clearDDOMStyles(): void;
/**
 * Adds styles to the DDOM stylesheet for an element
 */
export declare function addElementStyles(styles: NestedCSSProperties, selector: string): void;
/**
 * Recursively registers styles for a custom element and all its children
 */
export declare function registerCustomElementStyles(ddom: any, selector: string): void;
