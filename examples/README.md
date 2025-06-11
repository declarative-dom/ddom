# DDOM Examples

This directory contains examples demonstrating the DDOM transparent reactivity model.

## Core Examples

These examples showcase the current DDOM features:

- **`basic-reactivity.html`** - Basic test of reactivity features
- **`complete-demo.html`** - Comprehensive demonstration of all features  
- **`dynamic-list.html`** - Dynamic list with transparent reactivity
- **`reactive-custom-elements.html`** - Custom elements with new reactivity model
- **`validation-test.html`** - Full test suite validating all features
- **`performance-test.html`** - Performance benchmarking

## Additional Examples

- **`basic.html`** - Basic declarative DOM example (no reactivity)
- **`custom-elements.js`** - Custom elements example
- **`interactive-form.html`** - Form handling example
- **`template-literal-test.html`** - Template literal testing

## Key Features

### 1. Transparent Signal Proxies
Properties automatically become reactive without special syntax:
```javascript
{
  count: 0,  // Automatically reactive
  name: 'John'  // Automatically reactive
}
```

### 2. Template Literal Reactivity
Template literals with `${...}` automatically get computed signals:
```javascript
{
  textContent: 'Hello ${this.name}!',
  className: 'status-${this.status}'
}
```

### 3. String Address Resolution
Use string addresses for signal resolution:
```javascript
{
  items: 'window.todos',  // Resolves to window.todos
  items: 'this.parentNode.items'  // Resolves to parent element's items
}
```

### 4. Protected Properties
`id` and `tagName` are protected from reactivity and set only once.

## Running the Examples

1. Start a local server:
   ```bash
   python3 -m http.server 8080
   ```

2. Open your browser to:
   ```
   http://localhost:8080/examples/
   ```

3. Navigate to any of the `.html` files to see the examples in action.