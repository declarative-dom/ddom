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
 * Creates a reactive effect that integrates with the global signal watcher system.
 * This provides consistent reactive behavior across the entire DDOM system.
 *
 * @param callback The effect callback function
 * @returns A cleanup function to dispose of the effect
 */
function createEffect(callback) {
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
}
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
    // Check if this is a function that should return a signal object
    if (typeof initialValue === 'function') {
        // Evaluate the function to see what it returns
        const referencedValue = initialValue();
        // Use the proper Signal polyfill type checking
        if (Signal.isState(referencedValue) || Signal.isComputed(referencedValue)) {
            // This is already a signal object - use it directly
            signalInstance = referencedValue;
        }
        else {
            // Function returned a value, create a new signal with that value
            signalInstance = new Signal.State(referencedValue);
        }
    }
    else if (Signal.isState(initialValue) || Signal.isComputed(initialValue)) {
        // This is already a signal object
        signalInstance = initialValue;
    }
    else {
        // Regular reactive property - create new signal
        signalInstance = new Signal.State(initialValue);
    }
    // Store the signal directly on the element
    el[key] = signalInstance;
    return signalInstance;
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

/**
 * Evaluates a filter expression against an item in an array.
 * Handles both static values and dynamic functions for operands, supporting
 * all operators defined in the FilterExpr specification.
 *
 * @template T - The type of items being filtered
 * @param item - The current item being evaluated
 * @param index - The index of the current item in the array
 * @param filter - The filter expression to evaluate
 * @returns True if the item passes the filter condition, false otherwise
 * @example
 * ```typescript
 * const passes = evaluateFilter(
 *   { name: 'John', age: 30 },
 *   0,
 *   { leftOperand: 'age', operator: '>=', rightOperand: 18 }
 * ); // returns true
 * ```
 */
function evaluateFilter(item, index, filter) {
    // Get left operand value
    let leftValue;
    if (typeof filter.leftOperand === 'string') {
        leftValue = item[filter.leftOperand];
    }
    else if (typeof filter.leftOperand === 'function') {
        leftValue = filter.leftOperand(item, index);
    }
    else {
        leftValue = filter.leftOperand;
    }
    // Get right operand value
    let rightValue;
    if (typeof filter.rightOperand === 'function') {
        rightValue = filter.rightOperand(item, index);
    }
    else {
        rightValue = filter.rightOperand;
    }
    // Apply operator
    switch (filter.operator) {
        case '>': return leftValue > rightValue;
        case '<': return leftValue < rightValue;
        case '>=': return leftValue >= rightValue;
        case '<=': return leftValue <= rightValue;
        case '==': return leftValue == rightValue;
        case '!=': return leftValue != rightValue;
        case '===': return leftValue === rightValue;
        case '!==': return leftValue !== rightValue;
        case '&&': return leftValue && rightValue;
        case '||': return leftValue || rightValue;
        case '!': return !leftValue;
        case '?': return leftValue ? rightValue : false;
        case 'includes': return typeof leftValue?.includes === 'function' ? leftValue.includes(rightValue) : false;
        case 'startsWith': return typeof leftValue?.startsWith === 'function' ? leftValue.startsWith(rightValue) : false;
        case 'endsWith': return typeof leftValue?.endsWith === 'function' ? leftValue.endsWith(rightValue) : false;
        default: return false;
    }
}
/**
 * Applies sorting to an array based on sort expressions.
 * Processes multiple sort criteria in order, applying secondary sorts when primary values are equal.
 * Supports both property name strings and custom sort functions with configurable direction.
 *
 * @template T - The type of items in the array
 * @param array - The array to sort (will be modified in place)
 * @param sortExpressions - Array of sort expressions to apply in order
 * @returns The sorted array (same reference as input)
 * @example
 * ```typescript
 * const sorted = applySorting(users, [
 *   { sortBy: 'lastName', direction: 'asc' },
 *   { sortBy: 'firstName', direction: 'asc' }
 * ]);
 * ```
 */
function applySorting(array, sortExpressions) {
    return array.sort((a, b) => {
        for (const sortExpr of sortExpressions) {
            let aValue;
            let bValue;
            // Get sort values
            if (typeof sortExpr.sortBy === 'string') {
                aValue = a[sortExpr.sortBy];
                bValue = b[sortExpr.sortBy];
            }
            else if (typeof sortExpr.sortBy === 'function') {
                aValue = sortExpr.sortBy(a, 0); // Index not meaningful in sort context
                bValue = sortExpr.sortBy(b, 0);
            }
            else {
                continue;
            }
            // Compare values
            let comparison = 0;
            if (aValue < bValue)
                comparison = -1;
            else if (aValue > bValue)
                comparison = 1;
            // Apply direction
            if (sortExpr.direction === 'desc') {
                comparison = -comparison;
            }
            // If not equal, return the comparison result
            if (comparison !== 0) {
                return comparison;
            }
        }
        return 0;
    });
}
/**
 * Type guard to check if a value is an ArrayExpr.
 * Validates that the object has the required 'items' property to be considered an ArrayExpr.
 *
 * @template T - The type of items in the array
 * @param value - The value to check
 * @returns True if the value is an ArrayExpr, false otherwise
 * @example
 * ```typescript
 * if (isArrayExpr(someValue)) {
 *   // TypeScript now knows someValue is ArrayExpr<T, any>
 *   console.log(someValue.items);
 * }
 * ```
 */
function isArrayExpr(value) {
    return value && typeof value === 'object' && 'items' in value;
}
/**
 * Reactive array implementation that integrates with the Signal system.
 * Processes arrays through a complete pipeline of filtering, sorting, mapping, and composition.
 * Automatically re-renders when source data changes through Signal reactivity.
 *
 * @template T - The type of items in the source array
 * @template U - The type of items after mapping transformation
 * @example
 * ```typescript
 * const reactiveArray = new DeclarativeArray({
 *   items: userSignal,
 *   filter: [{ leftOperand: 'active', operator: '===', rightOperand: true }],
 *   sort: [{ sortBy: 'name', direction: 'asc' }],
 *   map: (user) => ({ tagName: 'div', textContent: user.name })
 * });
 * ```
 */
class DeclarativeArray {
    config;
    parentElement;
    sourceSignal;
    computed;
    /**
     * Creates a new DeclarativeArray instance with the specified configuration.
     * Sets up the reactive pipeline for processing array data through filtering,
     * sorting, mapping, and composition operations.
     *
     * @param config - The ArrayExpr configuration defining the processing pipeline
     * @param parentElement - Optional parent element for context-aware operations
     */
    constructor(config, parentElement) {
        this.config = config;
        this.parentElement = parentElement;
        if (Signal.isState(config.items) || Signal.isComputed(config.items)) {
            this.sourceSignal = config.items;
        }
        else if (Array.isArray(config.items)) {
            this.sourceSignal = new Signal.State(config.items);
        }
        else if (typeof config.items === 'function') {
            // Handle function that returns array or Signal
            try {
                const functionResult = config.items(parentElement);
                // Check if the function returned a Signal
                if (Signal.isState(functionResult) || Signal.isComputed(functionResult)) {
                    this.sourceSignal = functionResult;
                }
                else if (Array.isArray(functionResult)) {
                    // Function returned a plain array
                    this.sourceSignal = new Signal.State(functionResult);
                }
                else {
                    console.error('DeclarativeArray: Function returned unexpected value:', functionResult);
                    throw new Error('Function must return an array or Signal');
                }
            }
            catch (error) {
                console.error('DeclarativeArray: Error calling items function:', error);
                throw error;
            }
        }
        else {
            throw new Error('ArrayExpr items must be an array, Signal, or function');
        } // Create computed that processes the array through the full pipeline
        this.computed = new Signal.Computed(() => {
            try {
                const sourceArray = this.sourceSignal.get();
                if (!Array.isArray(sourceArray)) {
                    console.error('DeclarativeArray: sourceSignal.get() did not return an array:', sourceArray);
                    throw new Error('Source signal must contain an array');
                }
                let processedArray = [...sourceArray];
                // Apply filtering
                if (config.filter && config.filter.length > 0) {
                    processedArray = processedArray.filter((item, index) => {
                        return config.filter.every(filter => evaluateFilter(item, index, filter));
                    });
                }
                // Apply sorting
                if (config.sort && config.sort.length > 0) {
                    processedArray = applySorting(processedArray, config.sort);
                } // Apply mapping
                let mappedArray;
                if (config.map) {
                    if (typeof config.map === 'function') {
                        mappedArray = processedArray.map(config.map);
                    }
                    else if (typeof config.map === 'string') {
                        // String template mapping
                        mappedArray = processedArray.map((item, index) => {
                            if (typeof item === 'object' && item !== null) {
                                return transform(config.map, item);
                            }
                            return item;
                        });
                    }
                    else {
                        // Static object mapping with template support
                        mappedArray = processedArray.map((item, index) => {
                            if (typeof config.map === 'object' && config.map !== null) {
                                return transformObjectTemplate(config.map, item, index);
                            }
                            return config.map;
                        });
                    }
                }
                else {
                    mappedArray = processedArray;
                }
                // Apply prepend/append
                const finalArray = [
                    ...(config.prepend || []),
                    ...mappedArray,
                    ...(config.append || [])
                ];
                return finalArray;
            }
            catch (error) {
                console.error('DeclarativeArray processing error:', error);
                return [];
            }
        });
    }
    /**
     * Get the current processed array value.
     * Executes the complete processing pipeline and returns the final array.
     *
     * @returns The processed array with all transformations applied
     */
    get() {
        return this.computed.get();
    }
    /**
     * Get the underlying signal for direct access.
     * Useful for integrating with other reactive systems or debugging.
     *
     * @returns The computed signal that processes the array
     */
    getSignal() {
        return this.computed;
    } /**
     * Update the source array (only works if source is a Signal.State).
     * Triggers reactive updates throughout the system when called.
     *
     * @param newArray - The new array to set as the source
     * @throws Error if the source is not a Signal.State
     */
    set(newArray) {
        if (Signal.isState(this.sourceSignal)) {
            this.sourceSignal.set(newArray);
        }
        else {
            throw new Error('Cannot set array value on non-state source');
        }
    }
}
/**
 * Transforms an object template by replacing template strings within its properties.
 * Recursively processes objects, arrays, and strings to replace template expressions
 * with values from the provided context. Supports function evaluation with item and index.
 *
 * @param template - The template to transform (object, array, string, or function)
 * @param context - The context object containing values for template substitution
 * @param index - The current index in the array (for function evaluation)
 * @returns The transformed template with all substitutions applied
 * @example
 * ```typescript
 * const result = transformObjectTemplate(
 *   { tagName: 'div', textContent: '{name}', className: (item) => item.active ? 'active' : '' },
 *   { name: 'John', active: true },
 *   0
 * );
 * // Returns: { tagName: 'div', textContent: 'John', className: 'active' }
 * ```
 */
function transformObjectTemplate(template, context, index = 0) {
    if (typeof template === 'function') {
        // Function values are evaluated immediately with item and index
        return template(context, index);
    }
    else if (typeof template === 'string') {
        return transform(template, context);
    }
    else if (Array.isArray(template)) {
        return template.map((item, itemIndex) => transformObjectTemplate(item, context, itemIndex));
    }
    else if (template && typeof template === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(template)) {
            result[key] = transformObjectTemplate(value, context, index);
        }
        return result;
    }
    return template;
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

const ddomHandlers = {
    children: (spec, el, key, value, css) => {
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
    attributes: (spec, el, key, value) => {
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
    style: (spec, el, key, value, css) => {
        if (css && value && typeof value === 'object') {
            adoptStyles$1(el, value);
        }
    },
    document: (spec, el, key, value) => {
        if (value && el === window) {
            adoptNode(value, document);
        }
    },
    body: (spec, el, key, value) => {
        if (value && (el === document || 'documentElement' in el)) {
            adoptNode(value, document.body);
        }
    },
    head: (spec, el, key, value) => {
        if (value && (el === document || 'documentElement' in el)) {
            adoptNode(value, document.head);
        }
    },
    customElements: (spec, el, key, value) => {
        if (value) {
            // Import define dynamically to avoid circular dependency
            import('./index-CKFv0wY6.js').then(({ define }) => {
                define(value);
            });
        }
    },
    default: (spec, el, key, value) => {
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
 * @param spec The declarative document object to adopt
 * @example
 * ```typescript
 * adoptDocument({
 *   title: 'My App',
 *   head: { children: [{ tagName: 'meta', attributes: { charset: 'utf-8' } }] }
 * });
 * ```
 */
function adoptDocument(spec) {
    adoptNode(spec, document);
}
/**
 * Renders a declarative DOM specification on an existing DOM node.
 * This function applies properties from the declarative object to the target element,
 * handling children, attributes, styles, and other properties appropriately.
 *
 * @param spec The declarative DOM object to adopt
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
function adoptNode(spec, el, css = true, ignoreKeys = []) {
    let allIgnoreKeys = [...ignoreKeys];
    const reactiveProps = Object.entries(spec).filter(([key, value]) => key.startsWith('$') && !ignoreKeys.includes(key));
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
    if ('id' in spec && spec.id !== undefined && el instanceof HTMLElement) {
        el.id = transform(spec.id, el);
        allIgnoreKeys.push('id');
    }
    // Apply all properties
    for (const [key, value] of Object.entries(spec)) {
        if (allIgnoreKeys.includes(key)) {
            continue;
        }
        const handler = ddomHandlers[key] || ddomHandlers.default;
        handler(spec, el, key, value, css);
    }
}
/**
 * Adopts a WindowSpec into the current window context.
 * This function applies the declarative window properties to the global window object.
 *
 * @param spec The declarative window object to adopt
 * @example
 * ```typescript
 * adoptWindow({
 *   document: { title: 'My App' },
 *   customElements: [{ tagName: 'my-component' }]
 * });
 * ```
 */
function adoptWindow(spec) {
    adoptNode(spec, window);
}
/**
 * Creates an HTML element from a declarative element definition and appends it to a parent node.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers, then immediately appends
 * it to the specified parent node.
 *
 * @param spec The declarative HTML element definition
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
function appendChild(spec, parentNode, css = true) {
    const el = document.createElement(spec.tagName);
    // Append the element to the provided parent node
    if ('appendChild' in parentNode) {
        parentNode.appendChild(el);
    }
    // Apply all properties using the unified dispatch table
    adoptNode(spec, el, css, ['id', 'parentNode', 'tagName']);
    return el;
}
/**
 * Creates an HTML element from a declarative element definition.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers.
 *
 * @param spec The declarative HTML element definition
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
function createElement(spec, css = true) {
    const el = document.createElement(spec.tagName);
    // Apply all properties using the unified dispatch table
    adoptNode(spec, el, css, ['id', 'parentNode', 'tagName']);
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
                        property.set(item[key]);
                    }
                });
            }
        });
    };
    // Initial render
    renderArray();
    // Set up reactive effect using the integrated createEffect function
    // This will automatically re-render when the array's dependencies change
    createEffect(() => {
        // Access the array signal to establish dependencies
        reactiveArray.get();
        // Return cleanup function that triggers re-render
        return () => {
            queueMicrotask(renderArray);
        };
    });
    // Note: effectCleanup could be returned if the caller needs to clean up manually,
    // but typically the effect will be cleaned up when the parent element is removed
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
    unregisteredDDOMElements.forEach(spec => {
        // Register styles once during element registration
        adoptStyles(spec, spec.tagName);
        // Handle global document modifications from custom element
        if (spec.document) {
            adoptNode(spec.document, document);
        }
        // Apply all properties using the unified dispatch table
        const customElementIgnoreKeys = [
            'tagName', 'document', 'adoptedCallback', 'attributeChangedCallback',
            'connectedCallback', 'connectedMoveCallback', 'disconnectedCallback',
            'formAssociatedCallback', 'formDisabledCallback', 'formResetCallback',
            'formStateRestoreCallback', 'observedAttributes', 'constructor', 'style'
        ];
        const reactiveProps = Object.entries(spec).filter(([key, value]) => key.startsWith('$'));
        // const allIgnoreKeys = [...customElementIgnoreKeys, ...reactiveProps.map(([key]) => key)];
        customElements.define(spec.tagName, class extends HTMLElement {
            #abortController = new AbortController();
            #container;
            #adoptNode() {
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
                // Apply all properties to the container with reactive context
                adoptNode(spec, this.#container, false, customElementIgnoreKeys);
            }
            constructor() {
                super();
                // create signals for reactive keys and set up proper signal effect
                const signals = [];
                reactiveProps.forEach(([key, initialValue]) => {
                    const signal = createReactiveProperty(this, key, initialValue);
                    signals.push(signal);
                });
                // Create a proper effect using the exact pattern from the React example
                if (signals.length > 0) {
                    // Create the effect that tracks our reactive properties
                    const effectCleanup = createEffect(() => {
                        // Access all signals directly to establish dependencies
                        signals.forEach((signal, index) => {
                            signal.get(); // Direct signal access - no wrapper
                        });
                        // Return a cleanup function that triggers re-render
                        return () => {
                            this.#triggerAdoptNode();
                        };
                    });
                    // Clean up on disconnect
                    this.#abortController.signal.addEventListener('abort', () => {
                        effectCleanup();
                    });
                }
                // Call custom constructor if defined
                if (spec.constructor && typeof spec.constructor === 'function') {
                    spec.constructor(this);
                }
            }
            adoptedCallback() {
                if (spec.adoptedCallback && typeof spec.adoptedCallback === 'function') {
                    spec.adoptedCallback(this);
                }
            }
            attributeChangedCallback(name, oldValue, newValue) {
                this.#triggerAdoptNode();
                if (spec.attributeChangedCallback && typeof spec.attributeChangedCallback === 'function') {
                    spec.attributeChangedCallback(this, name, oldValue, newValue);
                }
            }
            connectedCallback() {
                // Check for existing shadow root (declarative or programmatic)
                const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
                const internals = supportsDeclarative ? this.attachInternals() : undefined;
                // Check for a Declarative Shadow Root or existing shadow root
                this.#container = internals?.shadowRoot || this.shadowRoot || this;
                if (spec.connectedCallback && typeof spec.connectedCallback === 'function') {
                    spec.connectedCallback(this);
                }
                this.#adoptNode();
            }
            connectedMoveCallback() {
                if (spec.connectedMoveCallback && typeof spec.connectedMoveCallback === 'function') {
                    spec.connectedMoveCallback(this);
                }
            }
            disconnectedCallback() {
                this.#abortController.abort();
                if (spec.disconnectedCallback && typeof spec.disconnectedCallback === 'function') {
                    spec.disconnectedCallback(this);
                }
            }
            formAssociatedCallback(form) {
                if (spec.formAssociatedCallback && typeof spec.formAssociatedCallback === 'function') {
                    spec.formAssociatedCallback(this, form);
                }
            }
            formDisabledCallback(disabled) {
                if (spec.formDisabledCallback && typeof spec.formDisabledCallback === 'function') {
                    spec.formDisabledCallback(this, disabled);
                }
            }
            formResetCallback() {
                if (spec.formResetCallback && typeof spec.formResetCallback === 'function') {
                    spec.formResetCallback(this);
                }
            }
            formStateRestoreCallback(state, mode) {
                if (spec.formStateRestoreCallback && typeof spec.formStateRestoreCallback === 'function') {
                    spec.formStateRestoreCallback(this, state, mode);
                }
            }
            static get observedAttributes() {
                return spec.observedAttributes || [];
            }
            #triggerAdoptNode() {
                queueMicrotask(() => {
                    if (this.#abortController.signal.aborted) {
                        return;
                    }
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
 * @param spec The declarative DOM element or any object with style and children properties
 * @param selector The CSS selector to use for this element's styles
 * @example
 * ```typescript
 * adoptStyles(myElement, 'my-component');
 * // Generates CSS rules for my-component and its children
 * ```
 */
function adoptStyles(spec, selector) {
    // Register styles for the element itself
    if (spec.style) {
        insertRules(spec.style, selector);
    }
    // Recursively register styles for children
    if (spec.children && Array.isArray(spec.children)) {
        // Track occurrences of each tagName to detect duplicates
        const tagNameCounts = new Map();
        const tagNameIndexes = new Map();
        // Count occurrences of each tagName that has styles
        spec.children.forEach((child) => {
            if (child.style && typeof child.style === 'object' && child.tagName) {
                const tagName = child.tagName.toLowerCase();
                tagNameCounts.set(tagName, (tagNameCounts.get(tagName) || 0) + 1);
            }
        });
        spec.children.forEach((child) => {
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
