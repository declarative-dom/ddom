# XPath Templating

DDOM supports dynamic content through **Attribute Value Templates** (AVT), a W3C standard syntax that has been in use since XSLT 1.0 (1999). This approach aligns with DDOM's philosophy of leveraging established web standards rather than inventing new domain specific templating language.

## Syntax

Templates use the `{expression}` syntax within string values. Three types of expressions are supported:

* **`{property}`** - Direct property access on the DOM context node
* **`{@attribute}`** - Attribute access via `getAttribute()`
* **`{xpath/expression}`** - Full XPath evaluation for complex queries

## Rationale

DDOM adopts Attribute Value Templates because:

* **Standards-based**: AVT is an official W3C standard, not a framework-specific invention
* **Mature**: The syntax has been stable and proven for over 20 years
* **Familiar**: Web developers already know XPath from browser DevTools and testing frameworks
* **Powerful**: XPath provides sophisticated querying capabilities while maintaining declarative principles
* **DOM-aligned**: XPath operates directly on DOM nodes, maintaining DDOM's DOM-first philosophy

## Examples

```javascript
// Property access
{ tagName: 'span', textContent: 'Hello, {firstName}' }

// Attribute access
{ tagName: 'div', textContent: 'Element ID: {@id}' }

// XPath expressions
{ tagName: 'p', textContent: 'First item: {ul/li[1]}' }
```