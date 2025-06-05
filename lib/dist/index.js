import { Signal } from 'signal-polyfill';
export { Signal } from 'signal-polyfill';

// Re-export the standard Signal implementation
/**
 * Global signal watcher system following the recommended pattern from the Signal polyfill examples.
 * This creates a single global watcher that processes all signal effects efficiently.
 */
let needsEnqueue = true;
const globalSignalWatcher = new Signal.subtle.Watcher(() => {
    if (needsEnqueue) {
        needsEnqueue = false;
        queueMicrotask(processPending);
    }
});
const processPending = () => {
    needsEnqueue = true;
    for (const computedSignal of globalSignalWatcher.getPending()) {
        computedSignal.get();
    }
    globalSignalWatcher.watch();
};
/**
 * Creates a reactive property on an element using the Signal standard.
 * Returns the Signal object directly - no wrapper getters/setters.
 *
 * @param el The element to add the reactive property to
 * @param key The property name (should start with $)
 * @param initialValue The initial value or a function that returns a Signal.State
 * @returns The Signal.State object for direct .get()/.set() usage
 */
function createReactiveProperty(el, key, initialValue) {
    let signalInstance;
    console.log(`[createReactiveProperty] Creating signal for ${key} with initial value:`, initialValue);
    // Check if this is a function that should return a signal object
    if (typeof initialValue === 'function') {
        // Evaluate the function to see what it returns
        const referencedValue = initialValue();
        console.log(`[createReactiveProperty] Function evaluated to:`, referencedValue);
        // Use the proper Signal polyfill type checking
        if (Signal.isState(referencedValue) || Signal.isComputed(referencedValue)) {
            // This is already a signal object - use it directly
            console.log(`[createReactiveProperty] Function returned a signal object, using directly`);
            signalInstance = referencedValue;
        }
        else {
            // Function returned a value, create a new signal with that value
            console.log(`[createReactiveProperty] Function returned a value, creating new signal`);
            signalInstance = new Signal.State(referencedValue);
        }
    }
    else if (Signal.isState(initialValue) || Signal.isComputed(initialValue)) {
        // This is already a signal object
        console.log(`[createReactiveProperty] Using existing signal object for ${key}`);
        signalInstance = initialValue;
    }
    else {
        // Regular reactive property - create new signal
        console.log(`[createReactiveProperty] Creating new Signal.State for ${key} with value:`, initialValue);
        signalInstance = new Signal.State(initialValue);
    }
    // Store the signal directly on the element
    el[key] = signalInstance;
    console.log(`[createReactiveProperty] Created signal instance for ${key}:`, signalInstance);
    return signalInstance;
}

/**
 * A reactive DeclarativeArray class that uses Signal.Computed for real-time updates
 *
 * This class creates a reactive array that automatically recomputes when any of its
 * dependencies change. It uses Signal.Computed for filtering, sorting, and mapping
 * operations, enabling true reactivity without manual re-evaluation.
 */
class DeclarativeArray {
    expression;
    contextNode;
    _items;
    _filtered;
    _sorted;
    _mapped;
    _final;
    constructor(expression, contextNode) {
        this.expression = expression;
        this.contextNode = contextNode;
        // Create reactive items computation
        this._items = new Signal.Computed(() => {
            const { items } = this.expression;
            let resolvedItems;
            if (typeof items === 'function') {
                resolvedItems = items(this.contextNode);
                // If the function returns a signal, get its value
                if (typeof resolvedItems === 'object' && (Signal.isState(resolvedItems) || Signal.isComputed(resolvedItems))) {
                    resolvedItems = resolvedItems.get();
                }
            }
            else {
                resolvedItems = items;
            }
            if (!Array.isArray(resolvedItems)) {
                throw new Error('items must be an array or a function that returns an array');
            }
            return [...resolvedItems];
        });
        // Create reactive filtered computation
        this._filtered = new Signal.Computed(() => {
            const items = this._items.get();
            const { filter } = this.expression;
            if (!filter || !Array.isArray(filter)) {
                return items;
            }
            return items.filter((item, index) => {
                return filter.every(filterCondition => {
                    const { leftOperand, operator, rightOperand } = filterCondition;
                    const leftValue = typeof leftOperand === 'string' ? item[leftOperand] : leftOperand;
                    const rightValue = typeof rightOperand === 'string' ? item[rightOperand] : rightOperand;
                    switch (operator) {
                        case '>': return leftValue > rightValue;
                        case '<': return leftValue < rightValue;
                        case '>=': return leftValue >= rightValue;
                        case '<=': return leftValue <= rightValue;
                        case '==': return leftValue == rightValue;
                        case '===': return leftValue === rightValue;
                        case '!=': return leftValue != rightValue;
                        case '!==': return leftValue !== rightValue;
                        case 'includes': return Array.isArray(leftValue) ? leftValue.includes(rightValue) : String(leftValue).includes(String(rightValue));
                        case 'startsWith': return String(leftValue).startsWith(String(rightValue));
                        case 'endsWith': return String(leftValue).endsWith(String(rightValue));
                        default: return true;
                    }
                });
            });
        });
        // Create reactive sorted computation
        this._sorted = new Signal.Computed(() => {
            const filtered = this._filtered.get();
            const { sort } = this.expression;
            if (!sort || !Array.isArray(sort)) {
                return filtered;
            }
            return [...filtered].sort((a, b) => {
                for (const sortCondition of sort) {
                    const { sortBy, direction = 'asc' } = sortCondition;
                    let aValue, bValue;
                    if (typeof sortBy === 'function') {
                        aValue = sortBy(a, filtered.indexOf(a));
                        bValue = sortBy(b, filtered.indexOf(b));
                    }
                    else {
                        aValue = a[sortBy];
                        bValue = b[sortBy];
                    }
                    let comparison = 0;
                    if (aValue < bValue)
                        comparison = -1;
                    else if (aValue > bValue)
                        comparison = 1;
                    if (comparison !== 0) {
                        return direction === 'desc' ? -comparison : comparison;
                    }
                }
                return 0;
            });
        });
        // Create reactive mapped computation
        this._mapped = new Signal.Computed(() => {
            const sorted = this._sorted.get();
            const { map } = this.expression;
            return sorted.map((item, index) => {
                if (typeof map === 'function') {
                    return map(item, index);
                }
                else if (typeof map === 'object' && map !== null) {
                    // Object template - copy all properties from the template
                    const mappedObj = {};
                    // copy properties from the array item
                    for (const [key, value] of Object.entries(map)) {
                        if (typeof value === 'function') {
                            // Execute function with item and index
                            mappedObj[key] = value(item, index);
                        }
                        else {
                            mappedObj[key] = value;
                        }
                    }
                    return mappedObj;
                }
                else {
                    return map;
                }
            });
        });
        // Create final computation with prepend/append
        this._final = new Signal.Computed(() => {
            const mapped = this._mapped.get();
            const { prepend, append } = this.expression;
            let final = mapped;
            if (prepend && Array.isArray(prepend)) {
                final = [...prepend, ...final];
            }
            if (append && Array.isArray(append)) {
                final = [...final, ...append];
            }
            return final;
        });
    }
    /**
     * Get the current processed array result
     */
    get() {
        return this._final.get();
    }
    /**
     * Get the computed signal for the final result
     * This allows external systems to reactively depend on this array
     */
    getSignal() {
        return this._final;
    }
    /**
     * Update the expressionuration of this ArrayExpr
     */
    updateexpression(newexpression) {
        Object.assign(this.expression, newexpression);
        // Note: The computations will automatically recompute when accessed next
    }
}
/**
 * Process a ArrayExpr object and render elements directly to a parent container
 *
 * This function takes a ArrayExpr specification and processes it through
 * a series of transformations: filtering, sorting, mapping, and appending/prepending items.
 * Instead of returning synthesized DDOM objects, it directly creates and manages DOM elements
 * with their reactive properties properly assigned.
 *
 * @template T - The type of items in the source array
 * @param ArrayExpr - The ArrayExpr specification containing items and transformation rules
 * @param parentElement - The parent DOM element to render the array items into
 * @param contextNode - Optional DOM element context for function evaluation
 *
 * @throws {Error} When the items property is not an array
 *
 * @example
 * ```typescript
 * fromArray({
 *   items: [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }],
 *   filter: [{ leftOperand: 'age', operator: '>', rightOperand: 27 }],
 *   sort: [{ sortBy: 'name', direction: 'asc' }],
 *   map: { tagName: 'todo-item', $item: (item) => item, $index: (item, index) => index }
 * }, containerElement);
 * ```
 */
function isArrayExpr(value) {
    return value && typeof value === 'object' &&
        value.items !== undefined &&
        value.map !== undefined;
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
            if (key.startsWith(':') || key.startsWith('[')) {
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
* Evaluates template strings with W3C XSLT Attribute Value Template syntax using DOM nodes as context.
* Supports three syntax types:
* - {property} or {nested.property} - Direct property access on the DOM node
* - {@attribute} - Attribute access via getAttribute()
* - {xpath/expression} - Full XPath evaluation for complex queries
*
* @param str - The template string containing placeholders in curly braces
* @param contextNode - The DOM node to use as the context for property/attribute/XPath evaluation
* @returns The template string with placeholders replaced by their evaluated values
*
* @example
* ```typescript
* const element = document.querySelector('#myElement') as HTMLElement;
* element.firstName = 'John';
*
* // Property access
* transform('Hello, {firstName}', element); // "Hello, John"
*
* // Attribute access
* transform('ID: {@id}', element); // "ID: myElement"
*
* // XPath expression
* transform('First item: {ul/li[1]}', element); // "First item: Item 1"
* ```
*/
function transform(str, contextNode) {
    return str.replace(/{([^}]+)}/g, (match, expression) => {
        const trimmed = expression.trim();
        // Handle @attribute syntax - fast path
        if (trimmed.startsWith('@')) {
            const attrName = trimmed.slice(1);
            return contextNode.getAttribute(attrName) ?? match;
        }
        // Handle simple property access - fast path
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*)*$/.test(trimmed)) {
            const parts = trimmed.split('.');
            let value = contextNode;
            // Walk the property chain, auto-resolving Signals
            for (const key of parts) {
                value = value?.[key];
                // Auto-detect and resolve Signal objects at each step
                if (value && typeof value === 'object' && (Signal.isState(value) || Signal.isComputed(value))) {
                    value = value.get();
                }
                // If we hit undefined at any point, stop
                if (value === undefined)
                    break;
                // debug
                console.log(`[transform] Resolved property '${key}':`, value);
            }
            if (value !== undefined)
                return String(value);
        }
        // Everything else goes through XPath
        return evaluate(trimmed, contextNode) ?? match;
    });
}
/**
* Evaluates an XPath expression against a DOM node context.
* Uses the browser's native XPath evaluator for standards compliance and performance.
*
* @param xpath - The XPath expression to evaluate
* @param contextNode - The DOM node to use as the context for XPath evaluation
* @returns The text content of the first matching node, or undefined if no match or error
*
* @example
* ```typescript
* const element = document.querySelector('#container') as HTMLElement;
*
* // Find first span with class "name"
* evaluate('span[@class="name"]', element); // "John Doe"
*
* // Get text content of first list item
* evaluate('ul/li[1]/text()', element); // "First item"
* ```
*/
function evaluate(xpath, contextNode) {
    try {
        const result = document.evaluate(xpath, contextNode, null, // namespaceResolver
        XPathResult.FIRST_ORDERED_NODE_TYPE, null // result
        );
        const node = result.singleNodeValue;
        return node?.textContent ?? undefined;
    }
    catch (error) {
        // Silently handle XPath evaluation errors
        return undefined;
    }
}

const ddomHandlers = {
    children: (ddom, el, key, value, css) => {
        // Handle function-based children (for reactive/computed children)
        if (isArrayExpr(value)) {
            try {
                adoptArray(value, el);
            }
            catch (error) {
                console.warn(`Failed to process ArrayExpr for children:`, error);
            }
        }
        else if (Array.isArray(value)) {
            value.forEach((child) => {
                appendChild(child, el, css);
            });
        }
        else {
            console.warn(`Invalid children value for key "${key}":`, value);
        }
    },
    attributes: (ddom, el, key, value) => {
        if (value && typeof value === 'object') {
            for (const [attrName, attrValue] of Object.entries(value)) {
                let value = attrValue;
                if (typeof attrValue === 'string') {
                    value = transform(attrValue, el);
                }
                else if (typeof attrValue === 'function') {
                    // eval function attributes
                    value = attrValue(el);
                }
                if (el instanceof Element) {
                    if (typeof value === 'boolean') {
                        // Handle boolean attributes
                        if (value) {
                            el.setAttribute(attrName, '');
                        }
                        else {
                            el.removeAttribute(attrName);
                        }
                    }
                    else {
                        // Set other attributes directly
                        el.setAttribute(attrName, value);
                    }
                }
            }
        }
    },
    style: (ddom, el, key, value, css) => {
        if (css && value && typeof value === 'object') {
            adoptStyles$1(el, value);
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
            // Import define dynamically to avoid circular dependency
            import('./index-CKFv0wY6.js').then(({ define }) => {
                define(value);
            });
        }
    },
    default: (ddom, el, key, value) => {
        // Handle functions properties
        if (typeof value === 'function') {
            if (key.startsWith('on') && el instanceof Element) {
                // Handle event listeners (properties starting with 'on')
                const eventName = key.slice(2).toLowerCase();
                el.addEventListener(eventName, value);
            }
            else {
                // set property as a function
                el[key] = value;
            }
        }
        else if (typeof value === 'string') {
            // evalute xpath expressions
            el[key] = transform(value, el);
        }
        else {
            // Set all other properties directly on the element
            el[key] = value;
        }
    }
};
/**
 * Adopts a WindowSpec into the current document context.
 */
/**
 * Adopts a DocumentSpec into the current document context.
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
    // const renderXPath = ['className',
    // 	'dir',
    // 	'innerHTML',
    // 	'lang',
    // 	'name',
    // 	'role',
    // 	'tabIndex',
    // 	'textContent',
    // 	'title'
    // ];
    // let allIgnoreKeys = [...ignoreKeys, ...renderXPath];
    let allIgnoreKeys = [...ignoreKeys];
    const reactiveProps = Object.entries(ddom).filter(([key, value]) => key.startsWith('$') && !ignoreKeys.includes(key));
    if (reactiveProps.length > 0) {
        reactiveProps.forEach(([key, initialValue]) => {
            // if they property does not exist on the element, create it
            if (!(key in el)) {
                // Create a reactive property on the element
                createReactiveProperty(el, key, initialValue);
            }
            allIgnoreKeys.push(key);
        });
    }
    // set id using XPath if it's defined
    if ('id' in ddom && ddom.id !== undefined && el instanceof HTMLElement) {
        el.id = transform(ddom.id, el);
        allIgnoreKeys.push('id');
    }
    // Apply all properties
    for (const [key, value] of Object.entries(ddom)) {
        if (allIgnoreKeys.includes(key)) {
            continue;
        }
        const handler = ddomHandlers[key] || ddomHandlers.default;
        handler(ddom, el, key, value, css);
    }
    // // Handle textContent and innerHTML with XPath transformation
    // for (const key of renderXPath) {
    // 	if (ddom[key as keyof DOMSpec]) {
    // 		(el as any)[key] = transform(ddom[key as keyof DOMSpec] as string, (el as Node));
    // 	}
    // }
}
/**
 * Adopts a WindowSpec into the current window context.
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
function adoptStyles$1(el, styles) {
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
    insertRules(styles, selector);
}
/**
 * Adopts a ArrayExpr and renders its items as DOM elements in the parent container
 *
 * This function creates a reactive ArrayExpr instance and renders each mapped item
 * as a DOM element, properly handling reactive properties and leveraging existing element
 * creation functions.
 *
 * @param arrayExpr - The DeclarativeArray configuration
 * @param parentElement - The parent DOM element to render items into
 * @param css - Whether to process CSS styles (default: true)
 */
function adoptArray(arrayExpr, parentElement, css = true) {
    // Create the reactive ArrayExpr instance
    const reactiveArray = new DeclarativeArray(arrayExpr, parentElement);
    const reactiveProps = Object.keys(arrayExpr?.map || {}).filter(key => key.startsWith('$'));
    // Function to render the current array state
    const renderArray = () => {
        // Clear existing children
        parentElement.innerHTML = '';
        // Get current processed items
        const items = reactiveArray.get();
        // Render each mapped item
        items.forEach((item) => {
            if (item && typeof item === 'object' && item.tagName) {
                // append the element
                const el = appendChild(item, parentElement, css);
                // assign reactive properties if they exist
                reactiveProps.forEach(key => {
                    const property = el[key];
                    if (Signal.isState(property)) {
                        // If it's a state signal, set its value
                        // debvug
                        console.log(`[adoptArray] Setting reactive property ${key} to`, item[key]);
                        property.set(item[key]);
                    }
                });
            }
        });
    };
    // Initial render
    renderArray();
    // Set up reactive subscription using the Signal.Computed from the array
    // This will automatically re-render when the array changes
    const arraySignal = reactiveArray.getSignal();
    // Create a computed that triggers re-render when array changes
    const renderComputed = new Signal.Computed(() => {
        arraySignal.get(); // Access the signal to establish dependency
        queueMicrotask(renderArray); // Schedule re-render
        return true;
    });
    // Trigger the computed to establish the subscription
    renderComputed.get();
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
        adoptStyles(ddom, ddom.tagName);
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
        const reactiveProps = Object.entries(ddom).filter(([key, value]) => key.startsWith('$'));
        // debug
        console.log(`[define] Registering custom element: ${ddom.tagName}`, {
            reactiveProps,
            ignoreKeys: customElementIgnoreKeys
        });
        // const allIgnoreKeys = [...customElementIgnoreKeys, ...reactiveProps.map(([key]) => key)];
        customElements.define(ddom.tagName, class extends HTMLElement {
            #abortController = new AbortController();
            #container;
            #adoptNode() {
                console.log(`[${ddom.tagName}] Starting re-render...`);
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
                console.log(`[${ddom.tagName}] Calling adoptNode...`);
                // Apply all properties to the container with reactive context
                adoptNode(ddom, this.#container, false, customElementIgnoreKeys);
                console.log(`[${ddom.tagName}] Re-render complete`);
            }
            constructor() {
                super();
                // create signals for reactive keys and set up proper signal effect
                const signals = [];
                reactiveProps.forEach(([key, initialValue]) => {
                    console.log(`[${ddom.tagName}] Processing reactive prop: ${key}`, initialValue);
                    const signal = createReactiveProperty(this, key, initialValue);
                    signals.push(signal);
                    console.log(`[${ddom.tagName}] Added signal for ${key}:`, signal);
                });
                // Create a proper effect using the exact pattern from the React example
                if (signals.length > 0) {
                    console.log(`[${ddom.tagName}] Creating effect for ${signals.length} signals`);
                    // Use the exact effect pattern from the React example
                    const createEffect = (callback) => {
                        let cleanup;
                        const computed = new Signal.Computed(() => {
                            cleanup?.();
                            cleanup = callback();
                        });
                        globalSignalWatcher.watch(computed);
                        computed.get();
                        return () => {
                            globalSignalWatcher.unwatch(computed);
                            cleanup?.();
                        };
                    };
                    // Create the effect that tracks our reactive properties
                    const effectCleanup = createEffect(() => {
                        console.log(`[${ddom.tagName}] Effect running - tracking dependencies`);
                        // Access all signals directly to establish dependencies
                        signals.forEach((signal, index) => {
                            const value = signal.get(); // Direct signal access - no wrapper
                            console.log(`[${ddom.tagName}] Effect tracking signal ${index}:`, value);
                        });
                        console.log(`[${ddom.tagName}] Effect dependencies established - will trigger re-render on next change`);
                        // Return a cleanup function that triggers re-render
                        return () => {
                            console.log(`[${ddom.tagName}] Effect triggered - scheduling re-render`);
                            this.#triggerAdoptNode();
                        };
                    });
                    // Clean up on disconnect
                    this.#abortController.signal.addEventListener('abort', () => {
                        console.log(`[${ddom.tagName}] Cleaning up effect on disconnect`);
                        effectCleanup();
                    });
                }
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
                this.#triggerAdoptNode();
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
                this.#adoptNode();
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
            #triggerAdoptNode() {
                queueMicrotask(() => {
                    if (this.#abortController.signal.aborted) {
                        console.log(`[${ddom.tagName}] Re-render aborted - element disconnected`);
                        return;
                    }
                    console.log(`[${ddom.tagName}] Triggering re-render...`);
                    // Re-render the custom element
                    this.#adoptNode();
                });
            }
        });
    });
}
/**
 * Recursively registers styles for a custom element and all its children.
 * This function processes the style object of the element and its nested children,
 * generating CSS rules with appropriate selectors. When multiple elements of the same
 * type have different styles, it adds :nth-of-type() selectors for specificity.
 *
 * @param ddom The declarative DOM element or any object with style and children properties
 * @param selector The CSS selector to use for this element's styles
 * @example
 * ```typescript
 * adoptStyles(myElement, 'my-component');
 * // Generates CSS rules for my-component and its children
 * ```
 */
function adoptStyles(ddom, selector) {
    // Register styles for the element itself
    if (ddom.style) {
        insertRules(ddom.style, selector);
    }
    // Recursively register styles for children
    if (ddom.children && Array.isArray(ddom.children)) {
        // Track occurrences of each tagName to detect duplicates
        const tagNameCounts = new Map();
        const tagNameIndexes = new Map();
        // Count occurrences of each tagName that has styles
        ddom.children.forEach((child) => {
            if (child.style && typeof child.style === 'object' && child.tagName) {
                const tagName = child.tagName.toLowerCase();
                tagNameCounts.set(tagName, (tagNameCounts.get(tagName) || 0) + 1);
            }
        });
        ddom.children.forEach((child) => {
            if (child.style && typeof child.style === 'object') {
                const tagName = child.tagName?.toLowerCase() || '*';
                const count = tagNameCounts.get(tagName) || 0;
                let childSelector;
                if (count > 1) {
                    // Multiple elements of same type - use nth-of-type selector (consistent with elements.ts)
                    const currentIndex = (tagNameIndexes.get(tagName) || 0) + 1;
                    tagNameIndexes.set(tagName, currentIndex);
                    childSelector = `${selector} ${tagName}:nth-of-type(${currentIndex})`;
                }
                else {
                    // Single element of this type - use simple descendant selector
                    childSelector = `${selector} ${tagName}`;
                }
                adoptStyles(child, childSelector);
            }
        });
    }
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
        customElements: {
            define
        },
    };
}

export { adoptDocument, adoptNode, adoptStyleSheet, adoptWindow, clearStyleSheet, createElement, createReactiveProperty, define };
