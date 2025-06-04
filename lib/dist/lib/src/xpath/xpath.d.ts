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
export declare function transform(str: string, contextNode: Node): string;
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
export declare function evaluate(xpath: string, contextNode: Node): string | undefined;
