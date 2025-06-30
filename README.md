<!-- Logo -->

<p align="left">
  <img src="logo/ddom.min.svg" alt="Declarative DOM Logo" width="100" height="100" />
</p>

# Declarative DOM

## ⚠️ This is a preview of an in-progress schema definition and could change at any time. Do not use this in production. ⚠️

**The Declarative Document Object Model** *(or DDOM)* is a schema and runtime for building and deploying web applications via [JavaScript object literals](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Object_basics). DDOM intends is to expose all [Open Web Platform](https://www.w3.org/wiki/Open_Web_Platform) functionality within an object syntax that closely follows the [Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

Just as JSON provides a syntax and grammar for defining arbitrary data, DDOM defines a type-enforced object structure for defining web applications (documents, nodes, and custom elements) in a declarative manner which attempts to mirror and extend the [official DOM API](https://dom.spec.whatwg.org/), borrowing from the [CSSOM](https://www.w3.org/TR/cssom-1/), [ECMAScript](https://tc39.es/), and related web standards.

DDOM is developed as a [specification](spec/spec.md), a [collection of types](types/), and a [reference runtime library](lib/) for deploying reactive web applications using the DDOM syntax. The DDOM runtime library is developed in Typescript and integrates the [TC39 JavaScript Signals proposal](https://github.com/tc39/proposal-signals) to provide a standardized signal-based reactivity model.

## Quick Example

Create a reactive application web component with a simple JavaScript object:

```JavaScript
import DDOM from '@declarative-dom/lib';

DDOM.customElements.define({
  tagName: 'my-app',
  $count: 0,        // ← Dollar-prefixed properties become reactive signals
  $name: 'World',   // ← Accessed via .get() and .set() methods
  
  children: [{
    tagName: 'h1',
    textContent: 'Hello ${this.$name.get()}!' // ← Signals available in component scope
  }, {
    tagName: 'p', 
    textContent: 'Count: ${this.$count.get()}' // ← Standard properties are bound to Signal Effects, for reactive updates
  }, {
    tagName: 'button',
    textContent: 'Increment',
    onclick: function() { 
      this.$count.set(this.$count.get() + 1); // ← Direct signal access via 'this'
    }
  }]
});
```

That's it for a simple but powerful custom [Web Component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)! The syntax follows the DOM, \$-prefixed properties automatically become reactive signals that are shared across the component scope. Template literals update the DOM using `.get()` calls, and signal updates via `.set()` provide predictable reactivity.

## Key Features

### 🏗️ DOM Conformance

DDOM aligns closely with the native DOM API: object properties mirror standard DOM element properties. This makes for an efficient, comprehensive, standards-driven syntax.

```JavaScript
/**
 * DOM/DDOM Equivalent to:
 * <div id="my-element" class="container" hidden="false" tabindex="0">
 *   Hello World
 * </div>
 */
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

```JavaScript
/**
 * DDOM equivalent to:
 * <div>
 *   <h1>Title</h1>
 *   <p>Pargraph content <strong>Bold text</strong></p>
 * </div>
 */
{
  tagName: 'div',
  children: [
    {
      tagName: 'h1',
      textContent: 'Title'
    },
    {
      tagName: 'p',
      textContent: 'Paragraph content ',
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

Styles are represented as objects with CSSOM camelCase property names and support full CSS nesting syntax:

```JavaScript
/**
 * DDOM Equivalent to:
 * div {
 *   background-color: blue;
 *   margin-top: 10px;
 *   font-size: 16px;
 *   display: flex;
 * }
 *
 * div:hover {
 *   background-color: red;
 *   cursor: pointer;
 * }
 *
 * div .child {
 *   color: white;
 *   font-weight: bold;
 * }
 */
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

### 🌐 Property Accessor Resolution

Strings beginning with `document.`, `this.` or `window.` are provisioned as property accessors. Reference data from anywhere in your application using standard JavaScript dot notation:

```JavaScript
{
  // Reference global data
  userData: 'window.currentUser',
  settings: 'document.appConfig',
  
  // Reference parent element data  
  parentData: 'this.parentNode.sharedState',
  
  // Use in any property
  items: 'window.$todoList',
  signal: 'this.$count'
}
```

### ⚡ Template Literal Reactivity

Strings with `${...}` are automatically converted to reactive template expressions, allowing dynamic content updates:

```JavaScript
{
  tagName: 'div',
  // Standard property with template - provisioned as reactive DOM binding
  textContent: 'Count is ${window.$counter.get()}',
  className: 'status ${window.$counter.get() > 10 ? "high" : "low"}',
}
```

### 🎯 Scoped & Reactive Properties

`$`-prefixed properties are mapped across the current scope, providing direct addressing throughout the object.

Non-function properties automatically become Signals to facilitate reactivity. The type of signal depends on the value:

```JavaScript
const app = DDOM({
  // Data values become State signals
  $count: 0,
  $message: 'Hello',
  $isVisible: true,
  
  // Template literals become Computed signals
  $displayText: 'Count is ${this.$count.get()}',
  $status: '${this.$isVisible.get() ? "Visible" : "Hidden"}',
  
  // Functions are shared in scope (as functions, not signals)
  $increment: function() {
    this.$count.set(this.$count.get() + 1);
  },
  
  children: [{
    tagName: 'p',
    textContent: '${this.$displayText.get()}' // ← Signals available here
  }, {
    tagName: 'button',
    textContent: 'Click me',
    onclick: function() {
      this.$increment(); // ← Shared function available here
    }
  }]
});

// Signal access uses explicit .get() and .set() methods
app.$count.set(42);                    // Sets the signal value
console.log(app.$count.get());         // Gets the signal value (42)
console.log(app.$displayText.get());     // Gets computed value: "Count is 42"

// Direct property access returns the signal object
console.log(app.$counter);               // Signal.State { ... }
console.log(app.$displayText);           // Signal.Computed { ... }
```

NOTE: Scopes are partitioned at the window, document, and custom element levels. Each custom element creates a new scope boundary, enforcing component-level isolation.

### 🔒 Protected Properties

DOM immutable properties `id` and `tagName` are automatically protected from reactivity:

```JavaScript
{
  tagName: 'my-element',  // ← Set once, never reactive
  id: 'unique-id',        // ← Protected property
  $count: 0               // ← This becomes reactive
}
```

### 🌐 Dynamic Mapped Arrays

Create dynamic lists that automatically update when data changes:

```JavaScript
{ // Object for defining an entire window
    $todoList = [
      { id: 1, text: 'Learn DDOM basics', completed: false },
      { id: 2, text: 'Build a todo app', completed: false },
      { id: 3, text: 'Deploy to production', completed: true }
    ],

    // Define the todo-item custom element
    customElements: [{
        tagName: 'todo-item',
        $todoItem: {},
        $todoIndex: 0,

        textContent: '${this.todoItem.get().text}'
    }],
    // Document body structure
    document: {
        body: {
            children: { // ← Dynamic Mapped Array Expression using items/map instead of direct array
                items: 'window.$todoList', // ← Reference data from anywhere
                // items: [{ id: 1, text: 'Task 1' }, { id: 2, text: 'Task 2' }], // ← Or a static array
                map: {
                    tagName: 'todo-item', // ← element tag for each item
                    $todoItem: (item, _index) => item, // ← Access each array item
                    $todoIndex: (_item, index) => index, // ← Access the item's index
                }
            }
        }
    }
}
```

### 🔄 Fine-grained Reactivity

Each property manages its own reactivity - no component-level re-rendering:

```JavaScript
const app = DDOM({
  // Only dollar-prefixed properties become signals
  $name: 'John',
  $age: 30,
  
  // Regular properties are static
  id: 'user-profile',
  className: 'container',
  
  // But can be signal-driven with templates or getters
  textContent: 'Name: ${this.$name.get()}',
  title: function () {
    return `User: ${this.$name.get()} (${this.$age.get()})`;
  }
});

// Only signal updates trigger reactivity
app.$name.set('Jane');  // ← Updates textContent and title
app.$age.set(31);       // ← Updates title

// Regular property changes don't trigger reactivity
app.className = 'updated'; // ← Just sets the property directly
```

## Getting Started

### Installation

```Shell
# Clone the repository
git clone https://github.com/declarative-dom/ddom.git
cd ddom

# Install dependencies
cd lib && npm install

# Build the library
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Lint and auto-fix issues
npm run lint:fix
```

### Basic Usage

```HTML
<!DOCTYPE html>
<html>
<head>
    <title>DDOM App</title>
</head>
<body>
    <script type="module">
        import DDOM from '@declarative-dom/lib';
        
        // Create a reactive app
        const app = DDOM({
            $count: 0,
            $name: 'World',
            
            // Define the DOM structure
            document: {
                body: {
                    children: [
                        {
                            tagName: 'h1',
                            textContent: 'Hello ${this.$name.get()}!'
                        },
                        {
                            tagName: 'p',
                            textContent: 'Count: ${this.$count.get()}'
                        },
                        {
                            tagName: 'button',
                            textContent: 'Increment',
                            onclick: function() { 
                                this.$count.set(this.$count.get() + 1);
                            }
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

* **`basic-reactivity.html`** - Basic reactivity features
* **`complete-demo.html`** - Comprehensive feature showcase
* **`validation-test.html`** - Full test suite validating all features
* **`dynamic-list.html`** - Dynamic list with reactive signals
* **`reactive-custom-elements.html`** - Custom elements with reactivity
* **`performance-test.html`** - Performance benchmarking

## Testing

DDOM includes a comprehensive testing framework using Vitest:

```Shell
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Core Concepts

### Dollar-Prefixed Signal Properties

DDOM automatically wraps dollar-prefixed properties in reactive signals based on their value type:

* **Data values** (strings, numbers, booleans, objects) become **State signals**
* **Template literals** (strings with `${...}`) become **Computed signals**
* **Functions** are shared in scope but are not wrapped in signals

These signals provide explicit `.get()` and `.set()` methods for predictable access and maintain fine-grained reactivity for property-level updates.

### Component-Level Scoping

Dollar-prefixed properties are automatically shared across the current component scope:

* **Component definition** creates a new scope boundary
* **All dollar properties** (signals and functions) are available as `this.$property`
* **Child elements** inherit parent scope properties automatically
* **Local properties** always take precedence over inherited ones

### Template Literal Processing

DDOM converts strings containing `${...}` patterns to reactive expressions:

* **Dollar-prefixed properties** with templates become computed signals
* **Regular properties** with templates get reactive DOM bindings
* **Template expressions** use `.get()` calls for signal access
* **Automatic updates** when referenced signals change

### Non-Reactive Property Handling

Properties without the `$` prefix remain static but can still be signal-driven:

* **Static values** are set once and don't create signals
* **Getters/setters** can reference signals for reactive behavior
* **Template literals** on regular properties create reactive DOM bindings
* **Property accessors** (`this.$signal`, `window.data`) are resolved once

### Protected Properties

DOM immutable properties `id` and `tagName` are automatically protected from reactivity to maintain element identity and prevent conflicts with the browser's internal handling.

## Philosophy

### DOM-First Design

DDOM maintains strict alignment with DOM APIs and web standards. In general, DDOM aims to mirror and support valid DOM properties, keys, and value types as closely as possible.

### Developer Experience

DDOM prioritizes:

* **Familiar syntax** - Works like normal JavaScript
* **Minimal novelty** - Standards-alignment over DSLs
* **Predictable behavior** - Standard property access patterns
* **Debugging friendly** - Properties work in dev tools

### Standards Alignment

* Uses standard JavaScript object patterns
* Template literals follow ES6 specifications
* DOM property names and behavior match web standards
* Custom elements align with Web Components specs

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Artificial Intelligence Notice

The contents of this repository have been developed with support from one or more generative artificial intelligence solutions.
