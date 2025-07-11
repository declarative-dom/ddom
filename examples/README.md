# DDOM Examples

This directory contains examples demonstrating the DDOM declarative syntax and reactive features. Each example consists of a JavaScript file that exports a default DDOM object, and an HTML file that loads and executes that DDOM app.

## Examples

- **`basic`** - Basic declarative DOM example showing fundamental syntax
- **`complete-demo`** - Comprehensive demonstration of all DDOM features
- **`complete-demo-modular`** - Modular version of the complete demo
- **`dynamic-list`** - Dynamic list with transparent reactivity
- **`interactive-form`** - Interactive form handling with reactivity
- **`reactive-custom-elements`** - Custom elements with transparent reactivity
- **`custom-elements`** - Basic custom elements example
- **`computed-properties/`** - Examples of computed properties using getters
- **`storage-apis`** - Storage APIs demonstration (Cookies, LocalStorage, SessionStorage)
- **`reactive-indexeddb`** - Reactive IndexedDB database operations with declarative queries
- **`declarative-fetch`** - Declarative fetch requests with reactive URLs
- **`builder/`** - Interactive DDOM object builder tool

## Structure

Each example follows the pattern:
- `example-name.js` - Exports a default DDOM object configuration
- `example-name.html` - Simple HTML file that loads and runs the DDOM app
- `example-name/` - Directory containing more complex examples with multiple files

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

### 5. Storage Namespaces
DDOM provides first-class support for Storage APIs with reactive updates:
```javascript
{
  // Cookie management
  $userPrefs: {
    prototype: 'Cookie',
    name: 'userPreferences', 
    value: '{"theme":"light"}'
  },
  
  // localStorage with automatic serialization
  $settings: {
    prototype: 'LocalStorage',
    key: 'appSettings',
    value: { notifications: true }
  },
  
  // IndexedDB reactive queries
  $products: {
    prototype: 'IndexedDB',
    database: 'CatalogDB',
    store: 'products',
    operation: 'getAll',
    filter: [{ leftOperand: 'name', operator: 'includes', rightOperand: 'this.$searchTerm' }]
  }
}
```

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