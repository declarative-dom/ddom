import {
	StyleExpr,
} from '../../../types/src';


// Global stylesheet reference for DDOM styles
let ddomStyleSheet: CSSStyleSheet | null = null;

/**
 * Adopts or creates the global DDOM stylesheet.
 * Creates a new CSSStyleSheet and adds it to the document's adopted stylesheets
 * if one doesn't already exist. This allows for efficient CSS rule management.
 * 
 * @returns The global DDOM stylesheet instance
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
 * effectively resetting all declarative styles.
 * 
 * @example
 * ```typescript
 * clearStyleSheet(); // Removes all DDOM-generated CSS rules
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
 * Returns true for standard CSS properties, false for selectors like
 * pseudo-classes, media queries, class/ID selectors, etc.
 * 
 * @param key The property key to check
 * @returns True if the key is a CSS property, false if it's a selector
 * @example
 * ```typescript
 * isCSSProperty('color'); // true
 * isCSSProperty(':hover'); // false
 * isCSSProperty('.class'); // false
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
 * flat CSS rules with proper selector hierarchies.
 * 
 * @param styles The nested declarative CSS properties object
 * @param baseSelector The base CSS selector to build upon
 * @returns Array of flattened CSS rules with selectors and properties
 * @example
 * ```typescript
 * flattenRules({
 *   color: 'red',
 *   ':hover': { backgroundColor: 'blue' }
 * }, '.my-class');
 * // Returns: [
 * //   { selector: '.my-class', properties: { color: 'red' } },
 * //   { selector: '.my-class:hover', properties: { backgroundColor: 'blue' } }
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
 * Inserts CSS rules into the DDOM stylesheet for an element.
 * This function processes declarative CSS styles and generates appropriate
 * CSS rules with proper selectors and nesting support.
 * 
 * @param styles The declarative CSS properties object
 * @param selector The CSS selector to apply the styles to
 * @param targetStyleSheet Optional specific stylesheet to use (for shadow DOM)
 * @example
 * ```typescript
 * insertRules({
 *   color: 'red',
 *   ':hover': { backgroundColor: 'blue' }
 * }, '.my-component');
 * ```
 */
export function insertRules(styles: StyleExpr, selector: string, targetStyleSheet?: CSSStyleSheet): void {
	const sheet = targetStyleSheet || adoptStyleSheet();
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

/**
 * Creates and manages a shadow DOM stylesheet.
 * This function creates a new CSSStyleSheet specifically for shadow DOM contexts
 * and adds it to the shadow root's adopted stylesheets.
 * 
 * @param shadowRoot The shadow root to create a stylesheet for
 * @returns The shadow-specific stylesheet
 * @example
 * ```typescript
 * const shadowSheet = adoptShadowStyleSheet(shadowRoot);
 * insertRules({ color: 'red' }, ':host', shadowSheet);
 * ```
 */
export function adoptShadowStyleSheet(shadowRoot: ShadowRoot): CSSStyleSheet {
	const shadowStyleSheet = new CSSStyleSheet();
	shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, shadowStyleSheet];
	return shadowStyleSheet;
}

/**
 * Inserts CSS rules specifically for shadow DOM contexts.
 * This function creates a shadow-specific stylesheet and applies styles using
 * the same flattening logic as the main stylesheet system.
 * 
 * @param shadowRoot The shadow root to apply styles to
 * @param styles The declarative CSS properties object
 * @param baseSelector Base selector for the styles (defaults to ':host')
 * @example
 * ```typescript
 * insertShadowRules(shadowRoot, {
 *   color: 'red',
 *   ':hover': { backgroundColor: 'blue' }
 * });
 * ```
 */
export function insertShadowRules(shadowRoot: ShadowRoot, styles: StyleExpr, baseSelector: string = ':host'): void {
	const shadowStyleSheet = adoptShadowStyleSheet(shadowRoot);
	insertRules(styles, baseSelector, shadowStyleSheet);
}