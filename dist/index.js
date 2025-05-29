// Global stylesheet reference for DDOM styles
let ddomStyleSheet = null;
/**
 * Adopts or creates the global DDOM stylesheet
 */
function adoptStyleSheet() {
    if (!ddomStyleSheet) {
        ddomStyleSheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, ddomStyleSheet];
    }
    return ddomStyleSheet;
}
/**
 * Clears all DDOM styles from the stylesheet
 */
function clearStyleSheet() {
    const sheet = adoptStyleSheet();
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
function flattenRules(styles, baseSelector) {
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
            if (key.startsWith(':')) {
                // Pseudo-selectors
                nestedSelector = `${baseSelector}${key}`;
            }
            else {
                // Element, Class, ID, or attribute selectors
                nestedSelector = `${baseSelector} ${key}`;
            }
            // Recursively flatten nested styles
            const nestedRules = flattenRules(value, nestedSelector);
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
function insertRules(styles, selector) {
    const sheet = adoptStyleSheet();
    const rules = flattenRules(styles, selector);
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

function define(elements) {
    const unregisteredDDOMElements = elements.filter(element => !customElements.get(element.tagName));
    unregisteredDDOMElements.forEach(ddom => {
        // Register styles once during element registration
        adoptStyles$1(ddom, ddom.tagName);
        // Handle global document modifications from custom element
        if (ddom.document) {
            adoptNode(ddom.document, document);
        }
        // Apply all properties using the unified dispatch table
        const customElementIgnoreKeys = [
            'tagName', 'document', 'adoptedCallback', 'attributeChangedCallback',
            'connectedCallback', 'connectedMoveCallback', 'disconnectedCallback',
            'formAssociatedCallback', 'formDisabledCallback', 'formResetCallback',
            'formStateRestoreCallback', 'observedAttributes', 'constructor', 'style'
        ];
        const reactiveFields = Object.keys(ddom).filter(key => key.startsWith('$'));
        const allIgnoreKeys = [...customElementIgnoreKeys, ...reactiveFields];
        customElements.define(ddom.tagName, class extends HTMLElement {
            #abortController = new AbortController();
            #container;
            constructor() {
                super();
                // // create signals for reactive fields
                // reactiveFields.forEach(field => {
                // 	const initialValue = (ddom as any)[field];
                // 	const signal = new Signal(initialValue);
                // 	const propertyName = field.slice(1); // Remove the $ prefix for the actual property
                // 	Object.defineProperty(this, propertyName, {
                // 		get: () => signal.value,
                // 		set: (value: any) => signal.value = value,
                // 	});
                // 	signal.subscribe(() => this.#triggerCreateElement());
                // });
                // // Call custom constructor if defined
                // if (ddom.constructor && typeof ddom.constructor === 'function') {
                // 	ddom.constructor(this);
                // }
            }
            adoptedCallback() {
                if (ddom.adoptedCallback && typeof ddom.adoptedCallback === 'function') {
                    ddom.adoptedCallback(this);
                }
            }
            attributeChangedCallback(name, oldValue, newValue) {
                if (ddom.attributeChangedCallback && typeof ddom.attributeChangedCallback === 'function') {
                    ddom.attributeChangedCallback(this, name, oldValue, newValue);
                }
            }
            connectedCallback() {
                // Check for existing shadow root (declarative or programmatic)
                const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
                const internals = supportsDeclarative ? this.attachInternals() : undefined;
                // Check for a Declarative Shadow Root or existing shadow root
                this.#container = internals?.shadowRoot || this.shadowRoot || this;
                if (ddom.connectedCallback && typeof ddom.connectedCallback === 'function') {
                    ddom.connectedCallback(this);
                }
                this.#createElement();
            }
            connectedMoveCallback() {
                if (ddom.connectedMoveCallback && typeof ddom.connectedMoveCallback === 'function') {
                    ddom.connectedMoveCallback(this);
                }
            }
            disconnectedCallback() {
                this.#abortController.abort();
                if (ddom.disconnectedCallback && typeof ddom.disconnectedCallback === 'function') {
                    ddom.disconnectedCallback(this);
                }
            }
            formAssociatedCallback(form) {
                if (ddom.formAssociatedCallback && typeof ddom.formAssociatedCallback === 'function') {
                    ddom.formAssociatedCallback(this, form);
                }
            }
            formDisabledCallback(disabled) {
                if (ddom.formDisabledCallback && typeof ddom.formDisabledCallback === 'function') {
                    ddom.formDisabledCallback(this, disabled);
                }
            }
            formResetCallback() {
                if (ddom.formResetCallback && typeof ddom.formResetCallback === 'function') {
                    ddom.formResetCallback(this);
                }
            }
            formStateRestoreCallback(state, mode) {
                if (ddom.formStateRestoreCallback && typeof ddom.formStateRestoreCallback === 'function') {
                    ddom.formStateRestoreCallback(this, state, mode);
                }
            }
            static get observedAttributes() {
                return ddom.observedAttributes || [];
            }
            #createElement() {
                // Ensure container is initialized
                if (!this.#container) {
                    this.#container = this;
                }
                // Clear any existing content
                if ('innerHTML' in this.#container) {
                    this.#container.innerHTML = '';
                }
                else if (this.#container instanceof DocumentFragment) {
                    // For DocumentFragment, remove all children
                    while (this.#container.firstChild) {
                        this.#container.removeChild(this.#container.firstChild);
                    }
                }
                // Apply all properties to the container
                adoptNode(ddom, this.#container, false, allIgnoreKeys);
            }
            #triggerCreateElement() {
                queueMicrotask(() => {
                    if (this.#abortController.signal.aborted)
                        return;
                    // createElement the custom element
                    this.#createElement();
                });
            }
        });
    });
}
/**
 * Recursively registers styles for a custom element and all its children
 */
function adoptStyles$1(ddom, selector) {
    // Register styles for the element itself
    if (ddom.style) {
        insertRules(ddom.style, selector);
    }
    // Recursively register styles for children
    if (ddom.children && Array.isArray(ddom.children)) {
        ddom.children.forEach((child) => {
            if (child.style && typeof child.style === 'object') {
                // For custom element registration, we'll use a simple descendant selector
                const childSelector = `${selector} ${child.tagName?.toLowerCase() || '*'}`;
                adoptStyles$1(child, childSelector);
            }
        });
    }
}

const ddomHandlers = {
    children: (ddom, el, key, value) => {
        if (Array.isArray(value)) {
            value.forEach((child, index) => {
                child.parentNode = el;
                const childNode = createElement(child);
                if (childNode && 'appendChild' in el) {
                    el.appendChild(childNode);
                }
            });
        }
    },
    attributes: (ddom, el, key, value) => {
        if (value && typeof value === 'object') {
            for (const [attrName, attrValue] of Object.entries(value)) {
                if (attrValue && typeof attrValue === 'string' && el instanceof Element) {
                    el.setAttribute(attrName, attrValue);
                }
            }
        }
    },
    style: (ddom, el, key, value, css) => {
        if (css && value && typeof value === 'object') {
            adoptStyles(el, value);
        }
    },
    document: (ddom, el, key, value) => {
        if (value && el === window) {
            adoptNode(value, document);
        }
    },
    body: (ddom, el, key, value) => {
        if (value && (el === document || 'documentElement' in el)) {
            adoptNode(value, document.body);
        }
    },
    head: (ddom, el, key, value) => {
        if (value && (el === document || 'documentElement' in el)) {
            adoptNode(value, document.head);
        }
    },
    customElements: (ddom, el, key, value) => {
        if (value) {
            define(value);
        }
    },
    default: (ddom, el, key, value) => {
        // Handle event listeners (properties starting with 'on')
        if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, value);
        }
        else {
            // Set all other properties directly on the element
            el[key] = value;
        }
    }
};
/**
 * Adopts a DeclarativeWindow into the current document context.
 */
function adoptDocument(ddom) {
    adoptNode(ddom, document);
}
function adoptNode(ddom, el, css = true, ignoreKeys = []) {
    // Apply all properties
    for (const [key, value] of Object.entries(ddom)) {
        if (ignoreKeys.includes(key)) {
            continue;
        }
        const handler = ddomHandlers[key] || ddomHandlers.default;
        handler(ddom, el, key, value, css);
    }
}
/**
 * Adopts a DeclarativeWindow into the current window context.
 */
function adoptWindow(ddom) {
    adoptNode(ddom, window);
}
function createElement(ddom, css = true) {
    const el = document.createElement(ddom.tagName);
    // if the id is defined, set it on the element
    el.id = ddom.id;
    // Apply all properties using the unified dispatch table
    adoptNode(ddom, el, css, ['id', 'tagName']);
    return el;
}
/**
 * Inserts CSS rules for a given element based on its declarative styles
 */
function adoptStyles(el, styles) {
    // define the selector
    let path = [], parent;
    while (parent = el.parentNode) {
        let tag = el.tagName;
        path.unshift(el.id ? `#${el.id}` : (parent.querySelectorAll(tag).length === 1 ? tag :
            `${tag}:nth-child(${Array.from(parent.children).indexOf(el) + 1})`));
        el = parent;
    }
    const selector = `${path.join(' > ')}`.toLowerCase();
    insertRules(styles, selector);
}

// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
    window.DDOM = {
        adoptDocument,
        adoptNode,
        adoptStyleSheet,
        adoptWindow,
        clearStyleSheet,
        createElement,
    };
}

export { adoptDocument, adoptNode, adoptStyleSheet, adoptWindow, clearStyleSheet, createElement };
