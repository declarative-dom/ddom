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
 * Processes inline styles and nested styles for an element
 */
export declare function processElementStyles(styles: NestedCSSProperties, element: HTMLElement, selector: string): void;
