import { Signal } from 'signal-polyfill';
export { Signal } from 'signal-polyfill';

/**
 * Global Signal Watcher for tracking all signal effects.
 * This is primarily used for debugging and development purposes.
 */
new Signal.subtle.Watcher(() => {
    // Global watcher for debugging - logs all signal changes
    // console.debug('Signal changed', arguments);
});
/**
 * Creates an effect that runs when its signal dependencies change.
 * This is the core reactivity primitive for DDOM.
 *
 * @param callback The effect callback function
 * @returns A cleanup function to dispose of the effect
 */
function createEffect(callback) {
    const watcher = new Signal.subtle.Watcher(callback);
    watcher.watch();
    // Return cleanup function
    return () => {
        watcher.unwatch();
    };
}

/**
 * Transparent Signal Property Wrapper
 * Provides getter/setter syntax while maintaining reactivity with the TC39 Signals proposal.
 * This allows properties to feel like normal properties while being reactive underneath.
 */
class SignalProperty {
    _signal;
    constructor(initialValue) {
        this._signal = new Signal.State(initialValue);
        // Create a proxy that intercepts property access
        return new Proxy(this, {
            get(target, prop) {
                // Special method to access the underlying signal
                if (prop === '__getSignal') {
                    return () => target._signal;
                }
                // Special method to check if this is a SignalProperty
                if (prop === '__isSignalProperty') {
                    return true;
                }
                // For any other property access, return the signal value
                if (prop === Symbol.toPrimitive || prop === 'valueOf' || prop === 'toString') {
                    return () => target._signal.get();
                }
                // Default behavior for other properties
                return target[prop];
            },
            set(target, prop, value) {
                // Setting any property on the proxy updates the signal
                target._signal.set(value);
                return true;
            }
        });
    }
    // Make it work with template literals and string coercion
    valueOf() {
        return this._signal.get();
    }
    toString() {
        return String(this._signal.get());
    }
    // Symbol.toPrimitive for better type coercion
    [Symbol.toPrimitive](hint) {
        const value = this._signal.get();
        if (hint === 'number')
            return Number(value);
        if (hint === 'string')
            return String(value);
        return value;
    }
}
/**
 * Resolves a signal address string to the actual signal object.
 * Supports addresses like "window.todos", "this.parentNode.items", etc.
 *
 * @param address - The signal address string
 * @param contextNode - The context node for resolving "this" references
 * @returns The resolved signal object or null if not found
 */
function resolveSignalAddress(address, contextNode) {
    try {
        const resolved = new Function('return ' + address).call(contextNode);
        // Check if it's a signal
        if (resolved && (Signal.isState(resolved) || Signal.isComputed(resolved))) {
            return resolved;
        }
        // Check if it's a SignalProperty
        if (resolved && resolved.__isSignalProperty) {
            return resolved.__getSignal();
        }
        return null;
    }
    catch (error) {
        console.warn(`Failed to resolve signal address "${address}":`, error);
        return null;
    }
}
/**
 * Creates a reactive property using a transparent signal wrapper.
 * This makes the property feel like a normal property while being reactive.
 *
 * @param el - The element to attach the property to
 * @param property - The property name
 * @param initialValue - The initial value for the property
 * @returns The SignalProperty instance
 */
function createReactiveProperty(el, property, initialValue) {
    const signalProperty = new SignalProperty(initialValue);
    el[property] = signalProperty;
    return signalProperty;
}
/**
 * Evaluates JavaScript template literals using DOM nodes as context.
 * Uses native JavaScript template literal syntax with the context node as 'this'.
 *
 * @param template - The template string to evaluate as a JavaScript template literal
 * @param contextNode - The DOM node to use as the context ('this') for template evaluation
 * @returns The template string evaluated with the context
 */
function evalTemplate(template, contextNode) {
    try {
        return new Function('return `' + template + '`').call(contextNode);
    }
    catch (error) {
        console.warn(`Template evaluation failed: ${error}, Template: ${template}`);
        return template;
    }
}
/**
 * Detects if a template string contains reactive expressions (${...}).
 *
 * @param template - The template string to check
 * @returns True if the template contains reactive expressions
 */
function hasReactiveExpressions(template) {
    return /\$\{.*?\}/.test(template);
}
/**
 * Creates a template function bound to a specific context.
 *
 * @param template - The template string to bind
 * @returns A function that evaluates the template with the given context
 */
const bindTemplate = (template) => (context) => new Function('return `' + template + '`').call(context);
/**
 * Creates a Computed Signal that automatically re-evaluates a template
 * when its dependencies change.
 *
 * @param template - The template string to make reactive
 * @param contextNode - The DOM node to use as context
 * @returns A Computed Signal that re-evaluates the template when dependencies change
 */
function computedTemplate(template, contextNode) {
    const templateFn = bindTemplate(template);
    return new Signal.Computed(() => {
        try {
            return templateFn(contextNode);
        }
        catch (error) {
            console.warn(`Computed template evaluation failed: ${error}, Template: ${template}`);
            return template;
        }
    });
}
/**
 * Sets up reactive template binding for a property.
 * Creates a computed signal and effect that updates the property when template dependencies change.
 *
 * @param el - The DOM element
 * @param property - The property name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
function bindReactiveProperty(el, property, template) {
    const computedValue = computedTemplate(template, el);
    const cleanup = createEffect(() => {
        const newValue = computedValue.get();
        // Only update if the value actually changed
        if (el[property] !== newValue) {
            el[property] = newValue;
        }
    });
    // If there's a global cleanup collector, add this cleanup to it
    const globalCollector = globalThis.__ddom_cleanup_collector;
    if (globalCollector && Array.isArray(globalCollector)) {
        globalCollector.push(cleanup);
    }
    return cleanup;
}
/**
 * Sets up reactive template binding for an attribute.
 * Creates a computed signal and effect that updates the attribute when template dependencies change.
 *
 * @param el - The DOM element
 * @param attribute - The attribute name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
function bindReactiveAttribute(el, attribute, template) {
    const computedValue = computedTemplate(template, el);
    const cleanup = createEffect(() => {
        const newValue = computedValue.get();
        const currentValue = el.getAttribute(attribute);
        // Only update if the value actually changed
        if (currentValue !== newValue) {
            if (newValue === null || newValue === undefined || newValue === '') {
                el.removeAttribute(attribute);
            }
            else {
                el.setAttribute(attribute, String(newValue));
            }
        }
    });
    // If there's a global cleanup collector, add this cleanup to it
    const globalCollector = globalThis.__ddom_cleanup_collector;
    if (globalCollector && Array.isArray(globalCollector)) {
        globalCollector.push(cleanup);
    }
    return cleanup;
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
    expr;
    parentElement;
    sourceSignal;
    computed;
    /**
     * Creates a new DeclarativeArray instance with the specified configuration.
     * Sets up the reactive pipeline for processing array data through filtering,
     * sorting, mapping, and composition operations.
     *
     * Supports string addresses like "window.todos" or "this.parentNode.items" for signal resolution.
     *
     * @param expr - The ArrayExpr configuration defining the processing pipeline
     * @param parentElement - Optional parent element for context-aware operations
     */
    constructor(expr, parentElement) {
        this.expr = expr;
        this.parentElement = parentElement;
        // Handle different source types
        if (Signal.isState(expr.items) || Signal.isComputed(expr.items)) {
            this.sourceSignal = expr.items;
        }
        else if (Array.isArray(expr.items)) {
            this.sourceSignal = new Signal.State(expr.items);
        }
        else if (typeof expr.items === 'string') {
            // Handle string address resolution (new feature)
            const resolvedSignal = resolveSignalAddress(expr.items, parentElement || document.body);
            if (resolvedSignal) {
                this.sourceSignal = resolvedSignal;
            }
            else {
                console.error('DeclarativeArray: Failed to resolve string address:', expr.items);
                throw new Error(`Cannot resolve signal address: ${expr.items}`);
            }
        }
        else if (typeof expr.items === 'function') {
            // Handle function that returns array or Signal
            try {
                const functionResult = expr.items(parentElement);
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
            throw new Error('ArrayExpr items must be an array, Signal, string address, or function');
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
                if (expr.filter && expr.filter.length > 0) {
                    processedArray = processedArray.filter((item, index) => {
                        return expr.filter.every(filter => evaluateFilter(item, index, filter));
                    });
                }
                // Apply sorting
                if (expr.sort && expr.sort.length > 0) {
                    processedArray = applySorting(processedArray, expr.sort);
                } // Apply mapping
                let mappedArray;
                if (expr.map) {
                    if (typeof expr.map === 'function') {
                        mappedArray = processedArray.map(expr.map);
                    }
                    else if (typeof expr.map === 'string') {
                        // String template mapping
                        mappedArray = processedArray.map((item, index) => {
                            if (typeof item === 'object' && item !== null) {
                                return evalTemplate(expr.map, item);
                            }
                            return item;
                        });
                    }
                    else {
                        // Static object mapping with template support
                        mappedArray = processedArray.map((item, index) => {
                            if (typeof expr.map === 'object' && expr.map !== null) {
                                return transformObjectTemplate(expr.map, item, index);
                            }
                            return expr.map;
                        });
                    }
                }
                else {
                    mappedArray = processedArray;
                }
                // Apply prepend/append
                const finalArray = [
                    ...(expr.prepend || []),
                    ...mappedArray,
                    ...(expr.append || [])
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
        return evalTemplate(template, context);
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
                // Pseudo-selectors and attribute selectors
                nestedSelector = `${baseSelector}${key}`;
            }
            else {
                // Element, Class, ID, or other selectors
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
                if (property.startsWith('--')) {
                    // CSS custom properties need special handling
                    cssRule.style.setProperty(property, value);
                }
                else {
                    cssRule.style[property] = value;
                }
            }
        }
        catch (e) {
            console.warn('Failed to add CSS rule:', rule.selector, e);
        }
    }
}

// Protected properties that should never be reactive
const PROTECTED_PROPERTIES = new Set(['id', 'tagName']);
const ddomHandlers = {
    children: (spec, el, key, descriptor, css) => {
        const value = descriptor.value;
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
    attributes: (spec, el, key, descriptor) => {
        const value = descriptor.value;
        if (value && typeof value === 'object') {
            for (const [attrName, attrValue] of Object.entries(value)) {
                if (typeof attrValue === 'string') {
                    // Check if this is a reactive template expression
                    if (hasReactiveExpressions(attrValue) && el instanceof Element) {
                        // Set up fine-grained reactivity for this attribute
                        bindReactiveAttribute(el, attrName, attrValue);
                    }
                    else {
                        // Static string - evaluate once and set
                        const evaluatedValue = evalTemplate(attrValue, el);
                        if (el instanceof Element) {
                            if (typeof evaluatedValue === 'boolean') {
                                // Handle boolean attributes
                                if (evaluatedValue) {
                                    el.setAttribute(attrName, '');
                                }
                                else {
                                    el.removeAttribute(attrName);
                                }
                            }
                            else {
                                // Set other attributes directly
                                el.setAttribute(attrName, evaluatedValue);
                            }
                        }
                    }
                }
                else if (typeof attrValue === 'function') {
                    // eval function attributes
                    const evaluatedValue = attrValue(el);
                    if (el instanceof Element) {
                        if (typeof evaluatedValue === 'boolean') {
                            // Handle boolean attributes
                            if (evaluatedValue) {
                                el.setAttribute(attrName, '');
                            }
                            else {
                                el.removeAttribute(attrName);
                            }
                        }
                        else {
                            // Set other attributes directly
                            el.setAttribute(attrName, evaluatedValue);
                        }
                    }
                }
                else {
                    // Direct value assignment
                    if (el instanceof Element) {
                        if (typeof attrValue === 'boolean') {
                            // Handle boolean attributes
                            if (attrValue) {
                                el.setAttribute(attrName, '');
                            }
                            else {
                                el.removeAttribute(attrName);
                            }
                        }
                        else {
                            // Set other attributes directly
                            el.setAttribute(attrName, attrValue);
                        }
                    }
                }
            }
        }
    },
    style: (spec, el, key, descriptor, css) => {
        const value = descriptor.value;
        if (css && value && typeof value === 'object') {
            adoptStyles$1(el, value);
        }
    },
    document: (spec, el, key, descriptor) => {
        const value = descriptor.value;
        if (value && el === window) {
            adoptNode(value, document);
        }
    },
    body: (spec, el, key, descriptor) => {
        const value = descriptor.value;
        if (value && (el === document || 'documentElement' in el)) {
            adoptNode(value, document.body);
        }
    },
    head: (spec, el, key, descriptor) => {
        const value = descriptor.value;
        if (value && (el === document || 'documentElement' in el)) {
            adoptNode(value, document.head);
        }
    },
    customElements: (spec, el, key, descriptor) => {
        const value = descriptor.value;
        if (value) {
            // Import define dynamically to avoid circular dependency
            import('./index-CKFv0wY6.js').then(({ define }) => {
                define(value);
            });
        }
    },
    default: (spec, el, key, descriptor) => {
        // Handle event listeners first - they should always be added regardless of precedence
        if (key.startsWith('on') && typeof descriptor.value === 'function' && el instanceof Element) {
            const eventName = key.slice(2).toLowerCase();
            el.addEventListener(eventName, descriptor.value);
        }
        // For all other properties, only proceed if the property doesn't exist as an instance property
        else if (!Object.prototype.hasOwnProperty.call(el, key)) {
            // Handle native getter/setter properties (ES6+ syntax)
            if (descriptor.get || descriptor.set) {
                Object.defineProperty(el, key, descriptor);
            }
            // Handle non-event function properties
            else if (typeof descriptor.value === 'function') {
                el[key] = descriptor.value;
            }
            else if (typeof descriptor.value === 'string') {
                // Check if this is a reactive template expression
                if (hasReactiveExpressions(descriptor.value)) {
                    // Set up fine-grained reactivity - the template will auto-update when dependencies change
                    bindReactiveProperty(el, key, descriptor.value);
                }
                else {
                    // Static string - evaluate once and set
                    el[key] = evalTemplate(descriptor.value, el);
                }
            }
            else {
                // For non-function, non-templated properties, wrap in transparent signal proxy
                // but only if not protected (id, tagName)
                if (!PROTECTED_PROPERTIES.has(key)) {
                    createReactiveProperty(el, key, descriptor.value);
                }
                else {
                    // Protected properties are set once and never reactive
                    el[key] = descriptor.value;
                }
            }
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
 * Uses the new reactivity model:
 * - Template literals with ${...} get computed signals + effects
 * - Non-function, non-templated properties get transparent signal proxies
 * - Protected properties (id, tagName) are set once and never reactive
 *
 * @param spec The declarative DOM object to adopt
 * @param el The target DOM node to apply properties to
 * @param css Whether to process CSS styles (default: true)
 * @param ignoreKeys Array of property keys to ignore during adoption
 * @example
 * ```typescript
 * adoptNode({
 *   textContent: 'Hello ${this.name}', // Template literal - creates computed signal
 *   count: 0, // Non-templated - gets transparent signal proxy
 *   id: 'my-element', // Protected - set once, never reactive
 *   style: { color: 'red' }
 * }, myElement);
 * ```
 */
function adoptNode(spec, el, css = true, ignoreKeys = []) {
    let allIgnoreKeys = [...ignoreKeys];
    // Process all properties using descriptors - handles both values and native getters/setters
    const specDescriptors = Object.getOwnPropertyDescriptors(spec);
    // Handle protected properties first (id, tagName) - set once, never reactive
    if ('id' in spec && spec.id !== undefined && el instanceof HTMLElement) {
        el.id = evalTemplate(spec.id, el);
        allIgnoreKeys.push('id');
    }
    // Process all other properties with new reactivity model
    Object.entries(specDescriptors).forEach(([key, descriptor]) => {
        if (allIgnoreKeys.includes(key)) {
            return;
        }
        const handler = ddomHandlers[key] || ddomHandlers.default;
        handler(spec, el, key, descriptor, css);
    });
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
                appendChild(item, parentElement, css);
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
 * Uses the new reactivity model:
 * - Template literals with ${...} get computed signals + effects automatically
 * - Non-function, non-templated properties get transparent signal proxies
 * - No component-level reactivity - only property-level reactivity
 *
 * @param elements Array of declarative custom element definitions to register
 * @example
 * ```typescript
 * define([{
 *   tagName: 'my-component',
 *   textContent: 'Hello ${this.name}', // Template literal - automatic reactivity
 *   count: 0, // Non-templated - gets transparent signal proxy
 *   children: [{ tagName: 'p', textContent: 'Content' }],
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
        // Get computed properties (getters/setters) from the spec
        const specDescriptors = Object.getOwnPropertyDescriptors(spec);
        const computedProps = Object.entries(specDescriptors).filter(([key, descriptor]) => descriptor.get || descriptor.set);
        // debug
        if (computedProps.length > 0) {
            console.debug(`Registering computed properties for ${spec.tagName}:`, computedProps);
        }
        // Apply all properties using the unified dispatch table
        // No more DSL-based reactive props - all reactivity is now property-level
        const ignoreKeys = [
            'tagName', 'document', 'adoptedCallback', 'attributeChangedCallback',
            'connectedCallback', 'connectedMoveCallback', 'disconnectedCallback',
            'formAssociatedCallback', 'formDisabledCallback', 'formResetCallback',
            'formStateRestoreCallback', 'observedAttributes', 'constructor', 'style',
            ...computedProps.map(([key]) => key)
        ];
        customElements.define(spec.tagName, class extends HTMLElement {
            #abortController = new AbortController();
            #container;
            #cleanupFunctions = [];
            constructor() {
                super();
                // Set up computed properties (getters/setters) from the spec
                computedProps.forEach(([key, descriptor]) => {
                    Object.defineProperty(this, key, descriptor);
                });
                // Call custom constructor if defined
                if (spec.constructor && typeof spec.constructor === 'function') {
                    spec.constructor(this);
                }
            }
            connectedCallback() {
                // Check for existing shadow root (declarative or programmatic)
                const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
                const internals = supportsDeclarative ? this.attachInternals() : undefined;
                // Check for a Declarative Shadow Root or existing shadow root
                this.#container = internals?.shadowRoot || this.shadowRoot || this;
                // Create the DOM structure with automatic property-level reactivity
                this.#createDOMStructure();
                if (spec.connectedCallback && typeof spec.connectedCallback === 'function') {
                    spec.connectedCallback(this);
                }
            }
            disconnectedCallback() {
                // Clean up all property-level reactive bindings
                this.#cleanupFunctions.forEach(cleanup => cleanup());
                this.#cleanupFunctions = [];
                this.#abortController.abort();
                if (spec.disconnectedCallback && typeof spec.disconnectedCallback === 'function') {
                    spec.disconnectedCallback(this);
                }
            }
            #createDOMStructure() {
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
                // Create a cleanup collector to gather all reactive binding cleanup functions
                const cleanupCollector = [];
                // Temporarily monkey-patch the global cleanup collector so adoptNode can contribute to it
                globalThis.__ddom_cleanup_collector = cleanupCollector;
                try {
                    // Create the DOM structure with automatic property-level reactivity
                    // Template literals get computed signals + effects automatically
                    // Non-templated properties get transparent signal proxies
                    adoptNode(spec, this.#container, false, ignoreKeys);
                }
                finally {
                    // Clean up the temporary collector
                    delete globalThis.__ddom_cleanup_collector;
                }
                // Store all cleanup functions for later disposal
                this.#cleanupFunctions.push(...cleanupCollector);
            }
            adoptedCallback() {
                if (spec.adoptedCallback && typeof spec.adoptedCallback === 'function') {
                    spec.adoptedCallback(this);
                }
            }
            attributeChangedCallback(name, oldValue, newValue) {
                // No automatic re-rendering - attribute changes should be handled by fine-grained reactivity
                if (spec.attributeChangedCallback && typeof spec.attributeChangedCallback === 'function') {
                    spec.attributeChangedCallback(this, name, oldValue, newValue);
                }
            }
            connectedMoveCallback() {
                if (spec.connectedMoveCallback && typeof spec.connectedMoveCallback === 'function') {
                    spec.connectedMoveCallback(this);
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
            let childSelector = selector;
            const tagName = child.tagName?.toLowerCase() || '*';
            const count = tagNameCounts.get(tagName) || 0;
            if (count > 1) {
                // Multiple elements of same type - use nth-of-type selector (consistent with elements.ts)
                const currentIndex = (tagNameIndexes.get(tagName) || 0) + 1;
                tagNameIndexes.set(tagName, currentIndex);
                childSelector = `${selector} > ${tagName}:nth-of-type(${currentIndex})`;
            }
            else {
                // Single element of this type - use simple descendant selector
                childSelector = `${selector} > ${tagName}`;
            }
            adoptStyles(child, childSelector);
        });
    }
}

// Default export with DDOM namespace
const DDOM = {
    adoptDocument,
    adoptNode,
    adoptStyleSheet,
    adoptWindow,
    appendChild,
    clearStyleSheet,
    createElement,
    customElements: {
        define
    },
    createEffect,
    createReactiveProperty,
    DeclarativeArray,
    Signal,
    evalTemplate,
    bindTemplate,
    computedTemplate,
    hasReactiveExpressions,
    bindReactiveProperty,
    bindReactiveAttribute
};
// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
    window.DDOM = DDOM;
    window.DeclarativeArray = DeclarativeArray;
    window.Signal = Signal;
}

export { DeclarativeArray, adoptDocument, adoptNode, adoptStyleSheet, adoptWindow, bindReactiveAttribute, bindReactiveProperty, bindTemplate, clearStyleSheet, computedTemplate, createEffect, createElement, createReactiveProperty, DDOM as default, define, evalTemplate, hasReactiveExpressions };
