import { Signal } from '../events';
/**
 * Resolves a signal address string to the actual signal object.
 * Supports addresses like "window.todos", "this.parentNode.items", etc.
 *
 * @param address - The signal address string
 * @param contextNode - The context node for resolving "this" references
 * @returns The resolved signal object or null if not found
 */
export declare function resolveSignalAddress(address: string, contextNode: Node): Signal.State<any> | Signal.Computed<any> | null;
/**
 * Creates a reactive property using a direct Signal.State object.
 * This ensures proper dependency tracking with the TC39 Signals polyfill.
 *
 * @param el - The element to attach the property to
 * @param property - The property name
 * @param initialValue - The initial value for the property
 * @returns The Signal.State instance
 */
export declare function createReactiveProperty(el: any, property: string, initialValue: any): Signal.State<any>;
/**
 * Evaluates JavaScript template literals using DOM nodes as context.
 * Uses native JavaScript template literal syntax with the context node as 'this'.
 *
 * @param template - The template string to evaluate as a JavaScript template literal
 * @param contextNode - The DOM node to use as the context ('this') for template evaluation
 * @returns The template string evaluated with the context
 */
export declare function parseTemplateLiteral(template: string, contextNode: Node): string;
/**
 * Detects if a template string contains reactive expressions (${...}).
 * Simple detection - just looks for ${. To display literal ${} in text,
 * escape the dollar sign with a backslash: \${
 *
 * @param template - The template string to check
 * @returns True if the template contains reactive expressions
 */
export declare function isTemplateLiteral(template: string): boolean;
/**
 * Creates a template function bound to a specific context.
 *
 * @param template - The template string to bind
 * @returns A function that evaluates the template with the given context
 */
export declare const bindTemplate: (template: string) => (context: any) => any;
/**
 * Creates a Computed Signal that automatically re-evaluates a template
 * when its dependencies change.
 *
 * @param template - The template string to make reactive
 * @param contextNode - The DOM node to use as context
 * @returns A Computed Signal that re-evaluates the template when dependencies change
 */
export declare function computedTemplate(template: string, contextNode: Node): Signal.Computed<string>;
/**
 * Sets up reactive template binding for a property.
 * Creates a computed signal and effect that updates the property when template dependencies change.
 *
 * @param el - The DOM element
 * @param property - The property name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export declare function bindReactiveProperty(el: any, property: string, template: string): () => void;
/**
 * Sets up reactive template binding for an attribute.
 * Creates a computed signal and effect that updates the attribute when template dependencies change.
 *
 * @param el - The DOM element
 * @param attribute - The attribute name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export declare function bindReactiveAttribute(el: Element, attribute: string, template: string): () => void;
