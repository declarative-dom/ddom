// Utility to get a unique selector for a DOM element or DDOM object
function getSelector(element, parentSelector, childIndex) {
    // If the id is defined, use it directly with parent context
    if (element.id) {
        const idSelector = `#${element.id}`;
        return parentSelector ? `${parentSelector} ${idSelector}` : idSelector;
    }
    // If the childIndex is defined, use nth-child directly
    if (childIndex !== undefined && parentSelector) {
        const tagName = 'tagName' in element ? element.tagName : element.nodeName;
        return `${parentSelector}>${tagName.toLowerCase()}:nth-child(${childIndex})`;
    }
    // Only proceed if we have an actual DOM element
    if (!(element instanceof Element)) {
        const tagName = element.tagName?.toLowerCase() || '';
        return parentSelector ? `${parentSelector} ${tagName}` : tagName;
    }
    // Build a selector based on the element's tag name and its position in the DOM tree
    let path = [];
    let currentElement = element;
    while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
        let selector = currentElement.nodeName.toLowerCase();
        // Add nth-child if needed for uniqueness
        let siblings = Array.from(currentElement.parentNode?.children || []);
        let sameTagSiblings = siblings.filter(s => s.nodeName === currentElement.nodeName);
        if (sameTagSiblings.length > 1) {
            let index = sameTagSiblings.indexOf(currentElement) + 1;
            selector += `:nth-child(${index})`;
        }
        path.unshift(selector);
        currentElement = currentElement.parentNode;
    }
    return path.join('>');
}
/**
 * Generate a CSS selector for a rendered element based on its position in the document
 */
function generateElementSelector(element) {
    if (element.id) {
        return `#${element.id}`;
    }
    let path = [];
    let currentElement = element;
    while (currentElement && currentElement !== document.body && currentElement !== document.documentElement) {
        let selector = currentElement.nodeName.toLowerCase();
        // Add nth-child for specificity
        if (currentElement.parentElement) {
            const siblings = Array.from(currentElement.parentElement.children);
            const sameTagSiblings = siblings.filter(s => s.nodeName === currentElement.nodeName);
            if (sameTagSiblings.length > 1) {
                const index = sameTagSiblings.indexOf(currentElement) + 1;
                selector += `:nth-child(${index})`;
            }
        }
        path.unshift(selector);
        currentElement = currentElement.parentElement;
    }
    // Prepend body if element is in body
    if (element.closest('body')) {
        path.unshift('body');
    }
    return path.join('>');
}

// Global stylesheet reference for DDOM styles
let ddomStyleSheet = null;
/**
 * Gets or creates the global DDOM stylesheet
 */
function getDDOMStyleSheet() {
    if (!ddomStyleSheet) {
        ddomStyleSheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, ddomStyleSheet];
    }
    return ddomStyleSheet;
}
/**
 * Clears all DDOM styles from the stylesheet
 */
function clearDDOMStyles() {
    const sheet = getDDOMStyleSheet();
    while (sheet.cssRules.length > 0) {
        sheet.deleteRule(0);
    }
}
/**
 * Checks if a key is a CSS property (not a nested selector)
 */
function isCSSProperty(key) {
    return !key.startsWith(':') && !key.startsWith('@') && !key.includes(' ') &&
        !key.startsWith('.') && !key.startsWith('#') && !key.startsWith('[');
}
/**
 * Flattens nested CSS styles into individual rules with full selectors
 */
function flattenStyles(styles, baseSelector) {
    const rules = [];
    // Collect direct CSS properties
    const directProperties = {};
    for (const [key, value] of Object.entries(styles)) {
        if (isCSSProperty(key) && typeof value === 'string') {
            directProperties[key] = value;
        }
        else if (typeof value === 'object' && value !== null) {
            // Handle nested selectors
            let nestedSelector;
            if (key.startsWith(':') || key.startsWith('::')) {
                // Pseudo-selectors
                nestedSelector = `${baseSelector}${key}`;
            }
            else if (key.startsWith('.') || key.startsWith('#') || key.startsWith('[')) {
                // Class, ID, or attribute selectors
                nestedSelector = `${baseSelector} ${key}`;
            }
            else {
                // Element selectors
                nestedSelector = `${baseSelector} ${key}`;
            }
            // Recursively flatten nested styles
            const nestedRules = flattenStyles(value, nestedSelector);
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
 * Adds styles to the DDOM stylesheet for an element
 */
function addElementStyles(styles, selector) {
    const sheet = getDDOMStyleSheet();
    const rules = flattenStyles(styles, selector);
    for (const rule of rules) {
        try {
            // Insert empty rule first
            const ruleIndex = sheet.insertRule(`${rule.selector} {}`, sheet.cssRules.length);
            const cssRule = sheet.cssRules[ruleIndex];
            // Apply properties using camelCase directly
            for (const [property, value] of Object.entries(rule.properties)) {
                cssRule.style[property] = value;
            }
        }
        catch (e) {
            console.warn('Failed to add CSS rule:', rule.selector, e);
        }
    }
}
/**
 * Recursively registers styles for a custom element and all its children
 */
function registerCustomElementStyles(ddom, selector) {
    // Register styles for the element itself
    if (ddom.style) {
        addElementStyles(ddom.style, selector);
    }
    // Recursively register styles for children
    if (ddom.children && Array.isArray(ddom.children)) {
        ddom.children.forEach((child, index) => {
            if (child.style && typeof child.style === 'object') {
                const childSelector = getSelector(child, ddom.tagName, index + 1);
                registerCustomElementStyles(child, childSelector);
            }
        });
    }
}

function render(ddom, element, parentSelector, childIndex, addStyles = true) {
    const el = element || (() => {
        if ('tagName' in ddom && ddom.tagName) {
            return document.createElement(ddom.tagName);
        }
        return null;
    })();
    if (!el)
        return null;
    // Generate selector for the element
    const selector = getSelector(el, parentSelector, childIndex);
    for (const [key, value] of Object.entries(ddom)) {
        switch (key) {
            case 'tagName':
                // Skip - already used for createElement
                break;
            case 'children':
                if (Array.isArray(value)) {
                    value.forEach((child, index) => {
                        const childNode = render(child, undefined, selector, index + 1);
                        if (childNode && 'appendChild' in el) {
                            el.appendChild(childNode);
                        }
                    });
                }
                break;
            case 'attributes':
                if (value && typeof value === 'object') {
                    for (const [attrName, attrValue] of Object.entries(value)) {
                        if (attrValue && typeof attrValue === 'string' && el instanceof Element) {
                            el.setAttribute(attrName, attrValue);
                        }
                    }
                }
                break;
            case 'style':
                if (addStyles && value && typeof value === 'object') {
                    addElementStyles(value, selector);
                }
                break;
            case 'document':
                if (value && el === window) {
                    render(value, document);
                }
                break;
            case 'body':
                if (value && (el === document || 'documentElement' in el)) {
                    render(value, document.body);
                }
                break;
            case 'head':
                if (value && (el === document || 'documentElement' in el)) {
                    render(value, document.head);
                }
                break;
            case 'customElements':
                if (value) {
                    registerCustomElements(value);
                }
                break;
            default:
                // Handle event listeners (properties starting with 'on')
                if (key.startsWith('on') && typeof value === 'function') {
                    const eventName = key.slice(2).toLowerCase();
                    el.addEventListener(eventName, value);
                }
                else {
                    // Set all other properties directly on the element
                    el[key] = value;
                }
                break;
        }
    }
    return el;
}
function registerCustomElements(elements) {
    const unregisteredDDOMElements = elements.filter(element => !customElements.get(element.tagName));
    for (const ddom of unregisteredDDOMElements) {
        console.log(`Registering custom element: ${ddom.tagName}`);
        // Register styles once during element registration
        registerCustomElementStyles(ddom, ddom.tagName);
        // Handle global document modifications from custom element
        if (ddom.document) {
            render(ddom.document, document);
        }
        customElements.define(ddom.tagName, class extends HTMLElement {
            constructor() {
                super();
                // Call custom constructor if defined
                if (ddom.constructor) {
                    new ddom.constructor(this);
                }
            }
            connectedCallback() {
                // Check for existing shadow root (declarative or programmatic)
                const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
                const internals = supportsDeclarative ? this.attachInternals() : undefined;
                // Check for a Declarative Shadow Root or existing shadow root
                let container = internals?.shadowRoot || this.shadowRoot || this;
                // Clear any existing content
                container.innerHTML = '';
                const selector = ddom.tagName;
                // Apply the definition to the container
                for (const [key, value] of Object.entries(ddom)) {
                    switch (key) {
                        case 'tagName':
                        case 'document':
                        case 'connectedCallback':
                        case 'disconnectedCallback':
                        case 'attributeChangedCallback':
                        case 'adoptedCallback':
                        case 'observedAttributes':
                            // Skip these - handled separately
                            break;
                        case 'children':
                            if (Array.isArray(value)) {
                                value.forEach((childDdom, index) => {
                                    const childNode = render(childDdom, undefined, selector, index + 1, false);
                                    if (childNode && 'appendChild' in container) {
                                        container.appendChild(childNode);
                                    }
                                });
                            }
                            break;
                        case 'attributes':
                            if (value && typeof value === 'object') {
                                for (const [attrName, attrValue] of Object.entries(value)) {
                                    if (attrValue && typeof attrValue === 'string') {
                                        this.setAttribute(attrName, attrValue);
                                    }
                                }
                            }
                            break;
                        case 'style':
                            // Skip - styles already registered during element registration
                            break;
                        default:
                            // Handle event listeners (properties starting with 'on')
                            if (key.startsWith('on') && typeof value === 'function') {
                                const eventName = key.slice(2).toLowerCase();
                                this.addEventListener(eventName, value);
                            }
                            else {
                                // Set all other properties directly on this element
                                this[key] = value;
                            }
                            break;
                    }
                }
                // Call custom connectedCallback if defined
                if (ddom.connectedCallback) {
                    ddom.connectedCallback(this);
                }
            }
            disconnectedCallback() {
                if (ddom.disconnectedCallback) {
                    ddom.disconnectedCallback(this);
                }
            }
            attributeChangedCallback(name, oldValue, newValue) {
                if (ddom.attributeChangedCallback) {
                    ddom.attributeChangedCallback(this, name, oldValue, newValue);
                }
            }
            adoptedCallback() {
                if (ddom.adoptedCallback) {
                    ddom.adoptedCallback(this);
                }
            }
            static get observedAttributes() {
                return ddom.observedAttributes || [];
            }
        });
    }
}
/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
function renderWindow(ddom) {
    render(ddom, window);
}

// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
    window.DDOM = {
        clearDDOMStyles,
        getDDOMStyleSheet,
        registerCustomElements,
        render,
        renderWindow,
    };
}

export { addElementStyles, clearDDOMStyles, generateElementSelector, registerCustomElements, render, renderWindow };
