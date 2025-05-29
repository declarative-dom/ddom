import {
	DeclarativeHTMLElement,
	DeclarativeCSSProperties,
} from '../spec/types';


// Global stylesheet reference for DDOM styles
let ddomStyleSheet: CSSStyleSheet | null = null;

/**
 * Adopts or creates the global DDOM stylesheet
 */
export function adoptStyleSheet(): CSSStyleSheet {
	if (!ddomStyleSheet) {
		ddomStyleSheet = new CSSStyleSheet();
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, ddomStyleSheet];
	}
	return ddomStyleSheet!;
}

/**
 * Clears all DDOM styles from the stylesheet
 */
export function clearStyleSheet(): void {
	const sheet = adoptStyleSheet();
	while (sheet.cssRules.length > 0) {
		sheet.deleteRule(0);
	}
}

/**
 * Checks if a key is a CSS property (not a nested selector)
 */
function isCSSProperty(key: string): boolean {
	return !key.startsWith(':') && !key.startsWith('@') && !key.includes(' ') &&
		!key.startsWith('.') && !key.startsWith('#') && !key.startsWith('[');
}

/**
 * Flattens nested CSS styles into individual rules with full selectors
 */
function flattenRules(styles: DeclarativeCSSProperties, baseSelector: string): Array<{ selector: string; properties: { [key: string]: string } }> {
	const rules: Array<{ selector: string; properties: { [key: string]: string } }> = [];

	// Collect direct CSS properties
	const directProperties: { [key: string]: string } = {};

	for (const [key, value] of Object.entries(styles)) {
		if (isCSSProperty(key) && typeof value === 'string') {
			directProperties[key] = value;
		} else if (typeof value === 'object' && value !== null) {
			// Handle nested selectors
			let nestedSelector: string;

			if (key.startsWith(':')) {
				// Pseudo-selectors
				nestedSelector = `${baseSelector}${key}`;
			} else {
				// Element, Class, ID, or attribute selectors
				nestedSelector = `${baseSelector} ${key}`;
			}

			// Recursively flatten nested styles
			const nestedRules = flattenRules(value as DeclarativeCSSProperties, nestedSelector);
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
 * Inserts CSS rules into the DDOM stylesheet for an element
 */
export function insertRules(styles: DeclarativeCSSProperties, selector: string): void {
	const sheet = adoptStyleSheet();
	const rules = flattenRules(styles, selector);

	for (const rule of rules) {
		try {
			// Insert empty rule first
			const ruleIndex = sheet.insertRule(`${rule.selector} {}`, sheet.cssRules.length);
			const cssRule = sheet.cssRules[ruleIndex] as CSSStyleRule;

			// Apply properties using camelCase directly
			for (const [property, value] of Object.entries(rule.properties)) {
				cssRule.style[property as any] = value;
			}
		} catch (e) {
			console.warn('Failed to add CSS rule:', rule.selector, e);
		}
	}
}