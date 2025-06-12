import { Signal } from '../events';
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
 * Uses AbortController for modern cleanup pattern.
 *
 * @param el - The DOM element
 * @param property - The property name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export declare function bindPropertyTemplate(el: any, property: string, template: string): () => void;
/**
 * Sets up reactive template binding for an attribute.
 * Creates a computed signal and effect that updates the attribute when template dependencies change.
 * Uses AbortController for modern cleanup pattern.
 *
 * @param el - The DOM element
 * @param attribute - The attribute name to bind
 * @param template - The template string
 * @returns A cleanup function to dispose of the effect
 */
export declare function bindAttributeTemplate(el: Element, attribute: string, template: string): () => void;
