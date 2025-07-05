/**
 * DOM CSS Style Sheet Management
 * 
 * This module provides imperative CSS style sheet management for DDOM.
 * Styles are declared once and applied immediately - they are not reactive.
 * Reactivity is achieved through reactive attributes that can be targeted
 * by CSS selectors (e.g., [data-state="active"]).
 * 
 * Key principles:
 * - Styles are imperative and declared once
 * - Use reactive attributes for dynamic styling
 * - Global CSS rules are managed through adopted stylesheets
 * - Nested selectors are flattened into proper CSS rules
 * 
 * @example
 * ```typescript
 * // Declare styles once (imperative)
 * insertRules({
 *   color: 'blue',
 *   '[data-active="true"]': { backgroundColor: 'yellow' },
 *   ':hover': { color: 'red' }
 * }, '.my-button');
 * 
 * // Use reactive attributes for dynamic styling
 * element.setAttribute('data-active', isActive.get());
 * ```
 */

import {
	StyleExpr,
} from '../types';


// Global stylesheet reference for DDOM styles
let ddomStyleSheet: CSSStyleSheet | null = null;

/**
 * Adopts or creates the global DDOM stylesheet.
 * Creates a new CSSStyleSheet and adds it to the document's adopted stylesheets
 * if one doesn't already exist. This allows for efficient CSS rule management
 * without polluting the document with style tags.
 * 
 * @returns The global DDOM stylesheet instance
 * @throws {Error} If the browser doesn't support adopted stylesheets
 * @example
 * ```typescript
 * const sheet = adoptStyleSheet();
 * sheet.insertRule('.my-class { color: red; }');
 * ```
 */
export function adoptStyleSheet(): CSSStyleSheet {
	if (!ddomStyleSheet) {
		ddomStyleSheet = new CSSStyleSheet();
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, ddomStyleSheet];
	}
	return ddomStyleSheet!;
}

/**
 * Clears all DDOM styles from the stylesheet.
 * This function removes all CSS rules from the global DDOM stylesheet,
 * effectively resetting all declarative styles. Use this for testing
 * or when you need to completely reset the styling system.
 * 
 * @example
 * ```typescript
 * clearStyleSheet(); // Removes all DDOM-generated CSS rules
 * ```
 * 
 * @example
 * ```typescript
 * // Useful for testing - clear between tests
 * beforeEach(() => {
 *   clearStyleSheet();
 * });
 * ```
 */
export function clearStyleSheet(): void {
	const sheet = adoptStyleSheet();
	while (sheet.cssRules.length > 0) {
		sheet.deleteRule(0);
	}
}

/**
 * Checks if a key represents a CSS property (not a nested selector).
 * Returns true for standard CSS properties and CSS custom properties,
 * false for selectors like pseudo-classes, media queries, attribute
 * selectors, class/ID selectors, etc.
 * 
 * @param key - The property key to check
 * @returns True if the key is a CSS property, false if it's a selector
 * @example
 * ```typescript
 * isCSSProperty('color');           // true (standard CSS property)
 * isCSSProperty('--my-var');        // true (CSS custom property)
 * isCSSProperty(':hover');          // false (pseudo-class selector)
 * isCSSProperty('.class');          // false (class selector)
 * isCSSProperty('[data-active]');   // false (attribute selector)
 * isCSSProperty('@media screen');   // false (media query)
 * ```
 */
function isCSSProperty(key: string): boolean {
	// CSS custom properties (variables) are valid CSS properties
	if (key.startsWith('--')) {
		return true;
	}
	
	return !key.startsWith(':') && !key.startsWith('@') && !key.includes(' ') &&
		!key.startsWith('.') && !key.startsWith('#') && !key.startsWith('[');
}

/**
 * Flattens nested CSS styles into individual rules with full selectors.
 * This function recursively processes nested style objects and generates
 * flat CSS rules with proper selector hierarchies. It handles pseudo-selectors,
 * attribute selectors, and nested element selectors correctly.
 * 
 * @param styles - The nested declarative CSS properties object
 * @param baseSelector - The base CSS selector to build upon
 * @returns Array of flattened CSS rules with selectors and properties
 * @example
 * ```typescript
 * flattenRules({
 *   color: 'red',
 *   ':hover': { backgroundColor: 'blue' },
 *   '[data-active="true"]': { fontWeight: 'bold' },
 *   '.child': { margin: '10px' }
 * }, '.my-class');
 * // Returns: [
 * //   { selector: '.my-class', properties: { color: 'red' } },
 * //   { selector: '.my-class:hover', properties: { backgroundColor: 'blue' } },
 * //   { selector: '.my-class[data-active="true"]', properties: { fontWeight: 'bold' } },
 * //   { selector: '.my-class .child', properties: { margin: '10px' } }
 * // ]
 * ```
 */
function flattenRules(styles: StyleExpr, baseSelector: string): Array<{ selector: string; properties: { [key: string]: string } }> {
	const rules: Array<{ selector: string; properties: { [key: string]: string } }> = [];

	// Collect direct CSS properties
	const directProperties: { [key: string]: string } = {};

	for (const [key, value] of Object.entries(styles)) {
		if (isCSSProperty(key) && typeof value === 'string') {
			directProperties[key] = value;
		} else if (typeof value === 'object' && value !== null) {
			// Handle nested selectors
			let nestedSelector: string;

			if (key.startsWith(':') || key.startsWith('[')) {
				// Pseudo-selectors and attribute selectors
				nestedSelector = `${baseSelector}${key}`;
			} else {
				// Element, Class, ID, or other selectors
				nestedSelector = `${baseSelector} ${key}`;
			}

			// Recursively flatten nested styles
			const nestedRules = flattenRules(value as StyleExpr, nestedSelector);
			rules.push(...nestedRules);
		}
	}

	// Add rule for direct properties if any exist
	if (Object.keys(directProperties).length > 0) {
		rules.push({ selector: baseSelector, properties: directProperties });
	}

	return rules;
}

/**
 * Inserts CSS rules into the DDOM stylesheet imperatively.
 * This function processes declarative CSS styles and generates appropriate
 * CSS rules with proper selectors and nesting support. Rules are applied
 * immediately and are not reactive - use reactive attributes for dynamic styling.
 * 
 * @param styles - The declarative CSS properties object with nested selectors
 * @param selector - The CSS selector to apply the styles to
 * @throws {Error} If CSS rule insertion fails due to invalid syntax
 * @example
 * ```typescript
 * // Basic styling with pseudo-selectors
 * insertRules({
 *   color: 'red',
 *   fontSize: '16px',
 *   ':hover': { backgroundColor: 'blue' },
 *   ':focus': { outline: '2px solid blue' }
 * }, '.my-button');
 * ```
 * 
 * @example
 * ```typescript
 * // Attribute-based styling for reactivity
 * insertRules({
 *   padding: '10px',
 *   '[data-state="loading"]': { 
 *     opacity: '0.5',
 *     cursor: 'wait'
 *   },
 *   '[data-state="error"]': { 
 *     borderColor: 'red',
 *     backgroundColor: '#ffebee'
 *   }
 * }, '.status-indicator');
 * ```
 * 
 * @example
 * ```typescript
 * // Nested selectors for component styling
 * insertRules({
 *   display: 'flex',
 *   '.header': { 
 *     fontSize: '18px',
 *     fontWeight: 'bold'
 *   },
 *   '.content': {
 *     padding: '20px',
 *     'p': { lineHeight: '1.6' }
 *   }
 * }, '.my-component');
 * ```
 */
export function insertRules(styles: StyleExpr, selector: string): void {
	const sheet = adoptStyleSheet();
	const rules = flattenRules(styles, selector);

	for (const rule of rules) {
		try {
			// Insert empty rule first
			const ruleIndex = sheet.insertRule(`${rule.selector} {}`, sheet.cssRules.length);
			const cssRule = sheet.cssRules[ruleIndex] as CSSStyleRule;

			// Apply properties using camelCase directly
			for (const [property, value] of Object.entries(rule.properties)) {
				if (property.startsWith('--')) {
					// CSS custom properties need special handling
					cssRule.style.setProperty(property, value);
				} else {
					cssRule.style[property as any] = value;
				}
			}
		} catch (e) {
			console.warn('Failed to add CSS rule:', rule.selector, e);
		}
	}
}