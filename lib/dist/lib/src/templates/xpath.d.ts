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
* parseTemplateLiteral('Hello, ${this.firstName}', element); // "Hello, John"
*
* // Method calls
* parseTemplateLiteral('ID: ${this.getAttribute("id")}', element); // "ID: myElement"
*
* // Complex expressions
* parseTemplateLiteral('${this.firstName.toUpperCase()}', element); // "JOHN"
* ```
*/
export declare function parseTemplateLiteral(template: string, contextNode: Node): string;
/**
* Legacy function kept for backward compatibility.
* @deprecated Use parseTemplateLiteral() instead
*/
export declare function transform(template: string, contextNode: Node): string;
/**
* Legacy function kept for backward compatibility.
* @deprecated Use parseTemplateLiteral with template literal syntax instead
*/
export declare function evaluate(xpath: string, contextNode: Node): string | undefined;
