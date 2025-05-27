// Global stylesheet reference for DDOM styles
let ddomStyleSheet = null;
let styleCounter = 0;
/**
 * Gets or creates the global DDOM stylesheet
 */
export function getDDOMStyleSheet() {
    if (!ddomStyleSheet) {
        if ('CSSStyleSheet' in window && 'adoptedStyleSheets' in Document.prototype) {
            // Use modern CSSStyleSheet API
            ddomStyleSheet = new CSSStyleSheet();
            document.adoptedStyleSheets = [...document.adoptedStyleSheets, ddomStyleSheet];
        }
        else {
            // Fallback to style element
            const styleElement = document.createElement('style');
            styleElement.id = 'ddom-styles';
            document.head.appendChild(styleElement);
            ddomStyleSheet = styleElement.sheet;
        }
    }
    return ddomStyleSheet;
}
/**
 * Clears all DDOM styles from the stylesheet
 */
export function clearDDOMStyles() {
    const sheet = getDDOMStyleSheet();
    // Clear all rules
    while (sheet.cssRules.length > 0) {
        sheet.deleteRule(0);
    }
    styleCounter = 0;
}
/**
 * Converts camelCase CSS property names to kebab-case
 */
function camelToKebab(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}
/**
 * Checks if a key is a CSS property (not a nested selector)
 */
function isCSSProperty(key) {
    // CSS properties don't start with special characters or contain spaces
    return !key.startsWith(':') && !key.startsWith('@') && !key.includes(' ') &&
        !key.startsWith('.') && !key.startsWith('#') && !key.startsWith('[');
}
/**
 * Generates CSS text from nested CSS properties with proper nesting syntax
 */
function generateCSSText(styles, baseSelector) {
    let cssText = '';
    // Collect direct CSS properties and nested selectors
    const directProperties = [];
    const nestedSelectors = {};
    const pseudoSelectors = {};
    for (const [key, value] of Object.entries(styles)) {
        if (isCSSProperty(key) && typeof value === 'string') {
            const kebabKey = camelToKebab(key);
            directProperties.push(`  ${kebabKey}: ${value};`);
        }
        else if (typeof value === 'object' && value !== null) {
            if (key.startsWith(':') || key.startsWith('::')) {
                pseudoSelectors[key] = value;
            }
            else {
                nestedSelectors[key] = value;
            }
        }
    }
    // Generate main rule with direct properties
    if (directProperties.length > 0 || Object.keys(pseudoSelectors).length > 0) {
        cssText += `${baseSelector} {\n`;
        cssText += directProperties.join('\n');
        // Add pseudo-selectors using & syntax
        for (const [pseudoSelector, pseudoStyles] of Object.entries(pseudoSelectors)) {
            const pseudoProps = [];
            const nestedPseudos = {};
            for (const [key, value] of Object.entries(pseudoStyles)) {
                if (isCSSProperty(key) && typeof value === 'string') {
                    const kebabKey = camelToKebab(key);
                    pseudoProps.push(`    ${kebabKey}: ${value};`);
                }
                else if (typeof value === 'object' && value !== null) {
                    nestedPseudos[key] = value;
                }
            }
            if (pseudoProps.length > 0) {
                cssText += `\n\n  &${pseudoSelector} {\n`;
                cssText += pseudoProps.join('\n') + '\n';
                // Handle nested pseudo-selectors within pseudo-selectors
                for (const [nestedPseudo, nestedStyles] of Object.entries(nestedPseudos)) {
                    if (nestedPseudo.startsWith(':') || nestedPseudo.startsWith('::')) {
                        const nestedProps = [];
                        for (const [key, value] of Object.entries(nestedStyles)) {
                            if (isCSSProperty(key) && typeof value === 'string') {
                                const kebabKey = camelToKebab(key);
                                nestedProps.push(`      ${kebabKey}: ${value};`);
                            }
                        }
                        if (nestedProps.length > 0) {
                            cssText += `\n    &${nestedPseudo} {\n`;
                            cssText += nestedProps.join('\n') + '\n';
                            cssText += '    }\n';
                        }
                    }
                }
                cssText += '  }\n';
            }
        }
        // Add nested class/element selectors
        for (const [selector, nestedStyles] of Object.entries(nestedSelectors)) {
            const nestedProps = [];
            const deepNested = {};
            for (const [key, value] of Object.entries(nestedStyles)) {
                if (isCSSProperty(key) && typeof value === 'string') {
                    const kebabKey = camelToKebab(key);
                    nestedProps.push(`    ${kebabKey}: ${value};`);
                }
                else if (typeof value === 'object' && value !== null) {
                    deepNested[key] = value;
                }
            }
            if (nestedProps.length > 0 || Object.keys(deepNested).length > 0) {
                cssText += `\n\n  ${selector} {\n`;
                if (nestedProps.length > 0) {
                    cssText += nestedProps.join('\n') + '\n';
                }
                // Handle nested selectors within class selectors
                for (const [deepSelector, deepStyles] of Object.entries(deepNested)) {
                    if (deepSelector.startsWith(':') || deepSelector.startsWith('::')) {
                        const deepProps = [];
                        for (const [key, value] of Object.entries(deepStyles)) {
                            if (isCSSProperty(key) && typeof value === 'string') {
                                const kebabKey = camelToKebab(key);
                                deepProps.push(`      ${kebabKey}: ${value};`);
                            }
                        }
                        if (deepProps.length > 0) {
                            cssText += `\n    &${deepSelector} {\n`;
                            cssText += deepProps.join('\n') + '\n';
                            cssText += '    }\n';
                        }
                    }
                }
                cssText += '  }\n';
            }
        }
        cssText += '}\n\n';
    }
    // Generate separate rules for descendant element selectors
    for (const [selector, nestedStyles] of Object.entries(nestedSelectors)) {
        if (!selector.startsWith('.') && !selector.startsWith('#') && !selector.startsWith('[') &&
            !selector.startsWith(':') && !selector.startsWith('::')) {
            // This is an element selector - create a descendant rule
            const fullSelector = `${baseSelector} ${selector}`;
            const descendantCss = generateCSSText(nestedStyles, fullSelector);
            if (descendantCss.trim()) {
                cssText += descendantCss;
            }
        }
    }
    return cssText;
}
/**
 * Adds styles to the DDOM stylesheet for an element
 */
export function addElementStyles(styles, selector) {
    const sheet = getDDOMStyleSheet();
    const cssText = generateCSSText(styles, selector);
    if (cssText.trim()) {
        try {
            // For modern browsers with constructable stylesheets
            if ('replaceSync' in sheet && typeof sheet.replaceSync === 'function') {
                const currentRules = Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                sheet.replaceSync(currentRules + '\n' + cssText);
            }
            else {
                // Fallback: parse and insert rules manually
                const ruleBlocks = cssText.split(/}\s*(?=[^}]*{|$)/).filter(block => block.trim());
                for (const block of ruleBlocks) {
                    const trimmedBlock = block.trim();
                    if (trimmedBlock && trimmedBlock.includes('{')) {
                        try {
                            if ('insertRule' in sheet && typeof sheet.insertRule === 'function') {
                                sheet.insertRule(trimmedBlock + '}', sheet.cssRules.length);
                            }
                        }
                        catch (e) {
                            console.warn('Failed to insert CSS rule:', trimmedBlock, e);
                        }
                    }
                }
            }
        }
        catch (e) {
            console.warn('Failed to add CSS styles:', e);
        }
    }
}
/**
 * Processes inline styles and nested styles for an element
 */
export function processElementStyles(styles, element, selector) {
    // Apply direct CSS properties to element.style
    const directStyles = {};
    const hasNestedStyles = Object.keys(styles).some(key => !isCSSProperty(key) && typeof styles[key] === 'object');
    for (const [key, value] of Object.entries(styles)) {
        if (isCSSProperty(key) && typeof value === 'string') {
            directStyles[key] = value;
        }
    }
    // Apply direct styles to the element
    Object.assign(element.style, directStyles);
    // Add all styles (including direct ones) to the stylesheet if there are nested styles
    if (hasNestedStyles) {
        addElementStyles(styles, selector);
    }
}
