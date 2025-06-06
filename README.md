# Declarative DOM (DDOM)

Declarative DOM is a JavaScript library for building reactive web applications using pure object syntax. DDOM features a transparent reactivity model that uses seamless, standards-aligned JavaScript without any special DSL syntax.

## Quick Example

Create reactive applications with simple JavaScript objects:

```javascript
import DDOM from './lib/dist/index.js';

const app = DDOM({
  tagName: 'my-app',
  count: 0,        // ← Automatically reactive via transparent proxy
  name: 'World',   // ← No special syntax needed
  
  children: [{
    tagName: 'h1',
    textContent: 'Hello ${this.parentNode.name}!' // ← Template literals are reactive
  }, {
    tagName: 'p', 
    textContent: 'Count: ${this.parentNode.count}'
  }, {
    tagName: 'button',
    textContent: 'Increment',
    onclick: () => app.count++ // ← Direct property access
  }]
});
```

That's it! Properties automatically become reactive, template literals update the DOM, and everything works like normal JavaScript.

## Key Features

### 🎯 Transparent Signal Proxies

Properties automatically become reactive without special syntax:

```javascript
const app = DDOM({
  counter: 0,
  message: 'Hello'
});

// Seamless property access - works exactly like normal JavaScript
app.counter = 42;           // Sets the value
console.log(app.counter);   // Gets the value (42)
```

### ⚡ Template Literal Reactivity

Template literals with `${...}` expressions automatically get computed signals + effects:

```javascript
{
  name: 'World',
  children: [{
    textContent: 'Hello ${this.parentNode.name}!',  // ← Automatically reactive
    className: 'greeting ${this.parentNode.name.toLowerCase()}',
    style: {
      color: '${this.parentNode.name === "World" ? "blue" : "green"}'
    }
  }]
}
```

### 🌐 Expressive Arrays

Create dynamic lists that automatically update when data changes:

```javascript
{
  items: 'window.todoList',           // ← Reference data from anywhere
  // items: 'this.parentNode.data',   // ← Or from relative locations
  children: {
    tagName: 'todo-item',
    item: (item) => item,             // ← Access each array item
    index: (item, index) => index,    // ← Access the item's index
    textContent: '${this.item}: ${this.index}'
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
app.name = 'Jane';

// Only elements using 'age' will update when this changes  
app.age = 31;
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
            // Properties automatically become reactive
            count: 0,
            name: 'World',
            
            // Define the DOM structure
            document: {
                body: {
                    children: [
                        {
                            tagName: 'h1',
                            textContent: 'Hello ${this.parentNode.name}!'
                        },
                        {
                            tagName: 'p',
                            textContent: 'Count: ${this.parentNode.count}'
                        },
                        {
                            tagName: 'button',
                            textContent: 'Increment',
                            onclick: () => app.count++
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
- **`dynamic-list.html`** - Dynamic list with transparent reactivity
- **`reactive-custom-elements.html`** - Custom elements with reactivity
- **`performance-test.html`** - Performance benchmarking

## Core Concepts

### Transparent Signal Proxies

DDOM automatically wraps non-function, non-templated properties in transparent signal proxies. These proxies:

- Intercept property get/set operations
- Provide seamless JavaScript property syntax
- Maintain signal reactivity under the hood
- Include special methods like `__getSignal()` for internal access

### Template Literal Processing

Template literals containing `${...}` expressions are automatically processed to:

- Create computed signals for the entire template
- Set up effects that update DOM properties when signals change
- Support complex expressions and multiple signal dependencies
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
- **Transparent proxies** - Minimal overhead for property access
- **Computed signals** - Efficient template literal updates
- **No component re-rendering** - Granular updates only

Benchmarks show DDOM can handle 1000+ property updates per second with sub-millisecond average update times.

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

- Uses standard JavaScript proxy patterns
- Template literals follow ES6 specifications
- DOM property names and behavior match web standards
- Custom elements align with Web Components specs

## Contributing

We welcome contributions! See our [contributing guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v2.0.0 - Current Release

- ✅ Transparent signal proxies for seamless reactivity
- ✅ Template literal automatic reactivity
- ✅ String address resolution for clean signal binding
- ✅ Property-level reactivity system
- ✅ Protected properties (id, tagName)
- ✅ Complete standards-aligned architecture
- ✅ Comprehensive test suite and examples

---

**The DOM is eternal. DDOM now aligns perfectly with that truth.**
