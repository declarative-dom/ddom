# JavaScript Template Literals

DDOM supports dynamic content through **JavaScript Template Literals**, leveraging native ES6+ template literal syntax. This approach aligns with DDOM's philosophy of using native JavaScript features rather than inventing new domain-specific templating languages.

## Syntax

Templates use native JavaScript template literal syntax `${expression}` within string values. The context DOM node is available as `this` within expressions:

* **`${this.property}`** - Direct property access on the DOM context node
* **`${this.getAttribute('name')}`** - Method calls on the context node
* **`${this.property.method()}`** - Complex expressions and method chaining
* **`${this.$signal.get()}`** - Signal access (though signals auto-resolve in many cases)

## Rationale

DDOM adopts JavaScript Template Literals because:

* **Native JavaScript**: Uses standard ES6+ template literal syntax - no new DSL to learn
* **Powerful**: JavaScript expressions provide unlimited flexibility and capability
* **Familiar**: All JavaScript developers already know template literal syntax
* **IDE Support**: Full syntax highlighting, autocomplete, and error checking in IDEs
* **Type Safe**: Works seamlessly with TypeScript for compile-time type checking
* **DOM-aligned**: Context node available as `this` maintains DDOM's DOM-first philosophy

## Examples

```javascript
// Property access
{ tagName: 'span', textContent: 'Hello, ${this.firstName}' }

// Method calls  
{ tagName: 'div', textContent: 'Element ID: ${this.getAttribute("id")}' }

// Complex expressions
{ tagName: 'p', textContent: 'Uppercase: ${this.name.toUpperCase()}' }

// Conditional expressions
{ tagName: 'span', textContent: '${this.isValid ? "Valid" : "Invalid"}' }

// Parent node access
{ tagName: 'span', textContent: 'Parent: ${this.parentNode.tagName}' }
```