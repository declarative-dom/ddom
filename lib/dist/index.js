/**
 * A reactive signal that notifies subscribers when its value changes.
 * Signals provide a simple way to implement reactive programming patterns.
 *
 * @template T The type of value stored in the signal
 * @example
 * ```typescript
 * const count = new Signal(0);
 * const unsubscribe = count.subscribe(value => console.log('Count:', value));
 * count.value = 5; // Logs: "Count: 5"
 * unsubscribe();
 * ```
 */
class Signal {
    #value;
    #subscribers = new Set();
    /**
     * Creates a new Signal with the given initial value.
     *
     * @param initialValue The initial value for the signal
     */
    constructor(initialValue) {
        this.#value = initialValue;
    }
    /**
     * Gets the current value of the signal.
     *
     * @returns The current value
     */
    get value() {
        return this.#value;
    }
    /**
     * Sets a new value for the signal. If the new value is different from the current value
     * (using Object.is comparison), all subscribers will be notified.
     *
     * @param newValue The new value to set
     */
    set value(newValue) {
        if (!Object.is(this.#value, newValue)) {
            this.#value = newValue;
            this.#subscribers.forEach(fn => fn(newValue));
        }
    }
    /**
     * Subscribes to value changes on this signal.
     *
     * @param fn The function to call when the signal value changes
     * @returns A function that when called, unsubscribes the callback
     */
    subscribe(fn) {
        this.#subscribers.add(fn);
        return () => this.#subscribers.delete(fn);
    }
}

// Global stylesheet reference for DDOM styles
let ddomStyleSheet = null;
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
function adoptStyleSheet() {
    if (!ddomStyleSheet) {
        ddomStyleSheet = new CSSStyleSheet();
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, ddomStyleSheet];
    }
    return ddomStyleSheet;
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
function clearStyleSheet() {
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
function isCSSProperty(key) {
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
 * Inserts CSS rules into the DDOM stylesheet for an element.
 * This function processes declarative CSS styles and generates appropriate
 * CSS rules with proper selectors and nesting support.
 *
 * @param styles The declarative CSS properties object
 * @param selector The CSS selector to apply the styles to
 * @example
 * ```typescript
 * insertRules({
 *   color: 'red',
 *   ':hover': { backgroundColor: 'blue' }
 * }, '.my-component');
 * ```
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

/**
 * Registers an array of custom elements with the browser's CustomElementRegistry.
 * This function creates new custom element classes that extend HTMLElement and
 * implement the declarative DOM structure and behavior specified in the definitions.
 *
 * @param elements Array of declarative custom element definitions to register
 * @example
 * ```typescript
 * define([{
 *   tagName: 'my-component',
 *   children: [{ tagName: 'p', textContent: 'Hello World' }],
 *   connectedCallback: (el) => console.log('Component connected')
 * }]);
 * ```
 */
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
                // create signals for reactive fields
                reactiveFields.forEach(field => {
                    const initialValue = ddom[field];
                    const signal = new Signal(initialValue);
                    const propertyName = field.slice(1); // Remove the $ prefix for the actual property
                    Object.defineProperty(this, propertyName, {
                        get: () => signal.value,
                        set: (value) => signal.value = value,
                    });
                    signal.subscribe(() => this.#triggerCreateElement());
                });
                // Call custom constructor if defined
                if (ddom.constructor && typeof ddom.constructor === 'function') {
                    ddom.constructor(this);
                }
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
                // Create a reactive context for dynamic property resolution
                const reactiveContext = { ...ddom };
                reactiveFields.forEach(field => {
                    const propertyName = field.slice(1);
                    reactiveContext[propertyName] = this[propertyName];
                });
                // Apply all properties to the container with reactive context
                adoptNode(reactiveContext, this.#container, false, allIgnoreKeys);
            }
            #triggerCreateElement() {
                queueMicrotask(() => {
                    if (this.#abortController.signal.aborted)
                        return;
                    // Re-render the custom element
                    this.#createElement();
                });
            }
        });
    });
}
/**
 * Recursively registers styles for a custom element and all its children.
 * This function processes the style object of the element and its nested children,
 * generating CSS rules with appropriate selectors.
 *
 * @param ddom The declarative DOM element or any object with style and children properties
 * @param selector The CSS selector to use for this element's styles
 * @example
 * ```typescript
 * adoptStyles(myElement, 'my-component');
 * // Generates CSS rules for my-component and its children
 * ```
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
    children: (ddom, el, key, value, css) => {
        if (Array.isArray(value)) {
            value.forEach((child) => {
                appendChild(child, el, css);
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
/**
 * Adopts a DeclarativeDocument into the current document context.
 * This function applies the declarative document properties to the global document object.
 *
 * @param ddom The declarative document object to adopt
 * @example
 * ```typescript
 * adoptDocument({
 *   title: 'My App',
 *   head: { children: [{ tagName: 'meta', attributes: { charset: 'utf-8' } }] }
 * });
 * ```
 */
function adoptDocument(ddom) {
    adoptNode(ddom, document);
}
/**
 * Adopts a declarative DOM structure into an existing DOM node.
 * This function applies properties from the declarative object to the target element,
 * handling children, attributes, styles, and other properties appropriately.
 *
 * @param ddom The declarative DOM object to adopt
 * @param el The target DOM node to apply properties to
 * @param css Whether to process CSS styles (default: true)
 * @param ignoreKeys Array of property keys to ignore during adoption
 * @example
 * ```typescript
 * adoptNode({
 *   textContent: 'Hello',
 *   style: { color: 'red' }
 * }, myElement);
 * ```
 */
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
 * This function applies the declarative window properties to the global window object.
 *
 * @param ddom The declarative window object to adopt
 * @example
 * ```typescript
 * adoptWindow({
 *   document: { title: 'My App' },
 *   customElements: [{ tagName: 'my-component' }]
 * });
 * ```
 */
function adoptWindow(ddom) {
    adoptNode(ddom, window);
}
/**
 * Creates an HTML element from a declarative element definition and appends it to a parent node.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers, then immediately appends
 * it to the specified parent node.
 *
 * @param ddom The declarative HTML element definition
 * @param parentNode The parent node to append the created element to
 * @param css Whether to process CSS styles (default: true)
 * @returns The created HTML element
 * @example
 * ```typescript
 * const button = appendChild({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => alert('Clicked!')
 * }, document.body);
 * ```
 */
function appendChild(ddom, parentNode, css = true) {
    const el = document.createElement(ddom.tagName);
    // set id if it's defined and not undefined
    if (ddom.id && ddom.id !== undefined) {
        el.id = ddom.id;
    }
    // Append the element to the provided parent node
    if ('appendChild' in parentNode) {
        parentNode.appendChild(el);
    }
    // Apply all properties using the unified dispatch table
    adoptNode(ddom, el, css, ['id', 'parentNode', 'tagName']);
    return el;
}
/**
 * Creates an HTML element from a declarative element definition.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers.
 *
 * @param ddom The declarative HTML element definition
 * @param css Whether to process CSS styles (default: true)
 * @returns The created HTML element
 * @example
 * ```typescript
 * const button = createElement({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => alert('Clicked!')
 * });
 * ```
 */
function createElement(ddom, css = true) {
    const el = document.createElement(ddom.tagName);
    // set id if it's defined and not undefined
    if (ddom.id && ddom.id !== undefined) {
        el.id = ddom.id;
    }
    // Apply all properties using the unified dispatch table
    adoptNode(ddom, el, css, ['id', 'parentNode', 'tagName']);
    return el;
}
/**
 * Inserts CSS rules for a given element based on its declarative styles.
 * This function generates unique selectors and applies styles to the global DDOM stylesheet.
 *
 * @param el The DOM element to apply styles to
 * @param styles The declarative CSS properties object
 * @example
 * ```typescript
 * adoptStyles(myElement, {
 *   color: 'red',
 *   fontSize: '16px',
 *   ':hover': { backgroundColor: 'blue' }
 * });
 * ```
 */
function adoptStyles(el, styles) {
    // Generate a unique selector for this element
    let selector;
    if (el.id) {
        // Use ID if available
        selector = `#${el.id}`;
    }
    else {
        // Generate a path-based selector
        const path = [];
        let current = el;
        while (current && current !== document.documentElement) {
            const tagName = current.tagName.toLowerCase();
            const parent = current.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter((child) => child.tagName.toLowerCase() === tagName);
                if (siblings.length === 1) {
                    path.unshift(tagName);
                }
                else {
                    const index = siblings.indexOf(current) + 1;
                    path.unshift(`${tagName}:nth-of-type(${index})`);
                }
            }
            else {
                path.unshift(tagName);
            }
            current = parent;
        }
        selector = path.join(' > ');
    }
    // debug
    console.debug(`Inserting styles for selector: ${selector}`, styles);
    insertRules(styles, selector);
}

// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
    window.ddom = {
        adoptDocument,
        adoptNode,
        adoptStyleSheet,
        adoptWindow,
        clearStyleSheet,
        createElement,
        customElements: {
            define
        }
    };
}

export { Signal, adoptDocument, adoptNode, adoptStyleSheet, adoptWindow, clearStyleSheet, createElement, define };
