import { DeclarativeCSSProperties } from '../spec/types';
/**
 * Adopts or creates the global DDOM stylesheet
 */
export declare function adoptStyleSheet(): CSSStyleSheet;
/**
 * Clears all DDOM styles from the stylesheet
 */
export declare function clearStyleSheet(): void;
/**
 * Inserts CSS rules into the DDOM stylesheet for an element
 */
export declare function insertRules(styles: DeclarativeCSSProperties, selector: string): void;
