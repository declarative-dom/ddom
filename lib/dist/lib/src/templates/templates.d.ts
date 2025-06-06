import { Signal } from '../events';
/**
* Creates a template function bound to a specific context.
* This is the core building block for fine-grained reactivity.
*
* @param template - The template string to bind
* @returns A function that evaluates the template with the given context
*/
export declare const bindTemplate: (template: string) => (context: any) => any;
/**
* Creates a Computed Signal that automatically re-evaluates a template
* when its dependencies change. This enables fine-grained reactivity.
*
* @param template - The template string to make reactive
* @param contextNode - The DOM node to use as context
* @returns A Computed Signal that re-evaluates the template when dependencies change
*/
export declare function computedTemplate(template: string, contextNode: Node): Signal.Computed<string>;
/**
* Evaluates JavaScript template literals using DOM nodes as context.
* Uses native JavaScript template literal syntax with the context node as 'this'.
* Supports direct property access, method calls, and complex expressions.
*
* @param template - The template string to evaluate as a JavaScript template literal
* @param contextNode - The DOM node to use as the context ('this') for template evaluation
* @returns The template string evaluated with the context
*
* @example
* ```typescript
* const element = document.querySelector('#myElement') as HTMLElement;
* element.firstName = 'John';
* element.getAttribute = (attr) => attr === 'id' ? 'myElement' : null;
*
* // Property access
* evalTemplate('Hello, ${this.firstName}', element); // "Hello, John"
*
* // Method calls
* evalTemplate('ID: ${this.getAttribute("id")}', element); // "ID: myElement"
*
* // Complex expressions
* evalTemplate('${this.firstName.toUpperCase()}', element); // "JOHN"
* ```
*/
export declare function evalTemplate(template: string, contextNode: Node): string;
/**
* Detects if a template string contains reactive expressions (${...}).
* Used to determine if fine-grained reactivity should be applied.
*
* @param template - The template string to check
* @returns True if the template contains reactive expressions
*/
export declare function hasReactiveExpressions(template: string): boolean;
/**
* Sets up fine-grained reactivity for a property by creating a Computed Signal
* and an effect that updates the specific DOM property when the template changes.
*
* @param el - The DOM element
* @param property - The property name to bind
* @param template - The template string
* @returns A cleanup function to dispose of the effect
*/
export declare function bindReactiveProperty(el: any, property: string, template: string): () => void;
/**
* Sets up fine-grained reactivity for an attribute by creating a Computed Signal
* and an effect that updates the specific DOM attribute when the template changes.
*
* @param el - The DOM element
* @param attribute - The attribute name to bind
* @param template - The template string
* @returns A cleanup function to dispose of the effect
*/
export declare function bindReactiveAttribute(el: Element, attribute: string, template: string): () => void;
