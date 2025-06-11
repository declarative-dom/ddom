# Declarative DOM

**Declarative DOM** *(or DDOM)* is a JavaScript object schema for building web applications. It is designed to encompass all modern web development features within an object syntax that closely follows the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model), [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model), and related web standards.

Just as JSON provides a syntax and grammar for describing arbitrary data, DDOM defines a type-enforced structure for describing web applications and components. Specifically, DDOM provides a strongly typed, JSON-like syntax for defining DOM documents, nodes, and custom elements, in a declarative manner which attempts to mirror and extend the [official DOM API Standard](https://dom.spec.whatwg.org/).

DDOM is developed as a [specification](spec/spec.md), a [collection of types](types/) and a [reference library](lib/) for deploying reactive web applications using the DDOM syntax. The DDOM library is developed in Typescript and integrates the [TC39 JavaScript Signals proposal polyfill](https://github.com/tc39/proposal-signals) to provide a standardized signal-based reactivity model with fine-grained updates.


## Quick Example

Create reactive applications and web components with simple JavaScript objects:

```javascript
import DDOM from './lib/dist/index.js';

const app = DDOM.customElements.define({
  tagName: 'my-app',
  count: 0,        // ← Automatically becomes a reactive signal
  name: 'World',   // ← Accessed via .get() and .set() methods
  
  children: [{
    tagName: 'h1',
    textContent: 'Hello ${this.parentNode.name.get()}!' // ← Template literals use .get()
  }, {
    tagName: 'p', 
    textContent: 'Count: ${this.parentNode.count.get()}'
  }, {
    tagName: 'button',
    textContent: 'Increment',
    onclick: () => app.count.set(app.count.get() + 1) // ← Explicit signal updates
  }]
});
```

That's it! Properties automatically become reactive signals, template literals update the DOM using `.get()` calls, and signal updates via `.set()` provide predictable reactivity.

## Key Features

### 🏗️ DOM Conformance

DDOM aligns closely with the native DOM API, ensuring that object properties mirror standard DOM element properties. This makes it easy to transition from imperative DOM manipulation to declarative syntax without losing familiarity.

```javascript
{
  tagName: 'div',
  id: 'my-element',
  className: 'container',
  textContent: 'Hello World',
  hidden: false,
  tabIndex: 0
}
```

### 🌳 Child Arrays

DDOM supports declarative child elements using arrays, enabling nested structures that mirror the DOM tree:

```javascript
{
  tagName: 'div',
  children: [
    {
      tagName: 'h1',
      textContent: 'Title'
    },
    {
      tagName: 'p',
      textContent: 'Paragraph content',
      children: [
        {
          tagName: 'strong',
          textContent: 'Bold text'
        }
      ]
    }
  ]
}
```

### 🎨 Nested CSS

Styles are represented as objects with camelCase property names and support full CSS nesting syntax:

```javascript
{
  tagName: 'div',
  style: {
    backgroundColor: 'blue',
    marginTop: '10px',
    fontSize: '16px',
    display: 'flex',
    ':hover': {
      backgroundColor: 'red',
      cursor: 'pointer'
    },
    '.child': {
      color: 'white',
      fontWeight: 'bold'
    }
  }
}
```

### 🎯 Standardized Reactive Signals

Properties automatically become reactive signals with explicit `.get()` and `.set()` methods:

```javascript
const app = DDOM({
  counter: 0,
  message: 'Hello'
});

// Explicit signal access for predictable reactivity
app.counter.set(42);                    // Sets the signal value
console.log(app.counter.get());         // Gets the signal value (42)

// Direct property access returns the signal object
console.log(app.counter);               // Signal { ... }
```

### ⚡ Template Literal Reactivity

Template literals with `${...}` expressions automatically get computed signals + effects:

```javascript
{
  name: 'World',
  children: [{
    textContent: 'Hello ${this.parentNode.name.get()}!',  // ← Automatically reactive
    className: 'greeting ${this.parentNode.name.get().toLowerCase()}',
  }]
}
```

### 🌐 Expressive Arrays

Create dynamic lists that automatically update when data changes:

```javascript
{
  items: 'window.todoList',           // ← Reference data from anywhere
  // items: 'this.parentNode.data',   // ← Or from relative locations
  // items: [{ id: 1, text: 'Task 1' }, { id: 2, text: 'Task 2' }], // ← Or a static array
  children: {
    tagName: 'todo-item',
    item: (item) => item,             // ← Access each array item
    index: (item, index) => index,    // ← Access the item's index
    textContent: '${this.item.get()}: ${this.index.get()}'
  }
}
```

### 🔒 Protected Properties

`id` and `tagName` are automatically protected from reactivity:

```javascript
{
  tagName: 'my-element',  // ← Set once, never reactive
  id: 'unique-id',        // ← Protected property
  count: 0                // ← This becomes reactive
}
```

### 🎛️ Property-Level Reactivity

Each property manages its own reactivity - no component-level re-rendering:

```javascript
const app = DDOM({
  name: 'John',
  age: 30,
  email: 'john@example.com'
});

// Only elements using 'name' will update when this changes
app.name.set('Jane');

// Only elements using 'age' will update when this changes  
app.age.set(31);
```

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/declarative-dom.git
cd declarative-dom

# Install dependencies
cd lib && npm install

# Build the library
npm run build
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>DDOM App</title>
</head>
<body>
    <script type="module">
        import DDOM from './lib/dist/index.js';
        
        // Create a reactive app
        const app = DDOM({
            count: 0,
            name: 'World',
            
            // Define the DOM structure
            document: {
                body: {
                    children: [
                        {
                            tagName: 'h1',
                            textContent: 'Hello ${this.parentNode.name.get()}!'
                        },
                        {
                            tagName: 'p',
                            textContent: 'Count: ${this.parentNode.count.get()}'
                        },
                        {
                            tagName: 'button',
                            textContent: 'Increment',
                            onclick: () => app.count.set(app.count.get() + 1)
                        }
                    ]
                }
            }
        });
        
        console.log('App created:', app);
    </script>
</body>
</html>
```

## Examples

The `examples/` directory contains comprehensive demonstrations:

- **`basic-reactivity.html`** - Basic reactivity features
- **`complete-demo.html`** - Comprehensive feature showcase
- **`validation-test.html`** - Full test suite validating all features
- **`dynamic-list.html`** - Dynamic list with reactive signals
- **`reactive-custom-elements.html`** - Custom elements with reactivity
- **`performance-test.html`** - Performance benchmarking

## Core Concepts

### Standardized Reactive Signals

DDOM automatically wraps non-function, non-templated properties in reactive signals. These signals:

- Provide explicit `.get()` and `.set()` methods for predictable access
- Maintain fine-grained reactivity for property-level updates
- Support computed signals for template literal expressions
- Include internal signal state management for optimal performance

### Template Literal Processing

Template literals containing `${...}` expressions are automatically processed to:

- Create computed signals for the entire template
- Set up effects that update DOM properties when signals change
- Support complex expressions using `.get()` calls for signal access
- Work with any DOM property (textContent, attributes, styles, etc.)

### String Address Resolution

DDOM supports clean string-based data binding for arrays and signals:

```javascript
// These all work:
'window.globalData'           // Global window property
'this.parentNode.items'       // Relative to current element
'document.body.userData'      // Document reference
```

### Protected Properties

Certain properties are automatically protected from becoming reactive:

- `id` - Set once during element creation
- `tagName` - Set once during element creation

## Architecture

DDOM consists of several key modules:

- **`templates/`** - Template literal processing and signal property creation
- **`elements/`** - DOM element creation and property handling
- **`events/`** - Signal system and effect management
- **`arrays/`** - Dynamic array handling with string address support
- **`customElements/`** - Custom element registration and management

## Performance

DDOM's reactivity model provides excellent performance:

- **Property-level reactivity** - Only affected elements update
- **Explicit signal access** - Predictable `.get()` and `.set()` operations
- **Computed signals** - Efficient template literal updates
- **No component re-rendering** - Granular updates only

## Philosophy

### DOM-First Design

DDOM maintains strict alignment with DOM APIs and web standards. The library eliminates non-standard syntax while preserving powerful reactivity through standard JavaScript patterns.

### Developer Experience

DDOM prioritizes:
- **Familiar syntax** - Works like normal JavaScript
- **Zero learning curve** - No special DSL to learn
- **Predictable behavior** - Standard property access patterns
- **Debugging friendly** - Properties work in dev tools

### Standards Alignment

- Uses standard JavaScript object patterns with explicit signal access
- Template literals follow ES6 specifications
- DOM property names and behavior match web standards
- Custom elements align with Web Components specs

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
