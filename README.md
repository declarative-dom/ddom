<!-- Logo -->

<p align="left">
  <img src="logo/ddom.min.svg" alt="Declarative DOM Logo" width="100" height="100" />
</p>

# Declarative DOM

## ⚠️ This is a preview of an in-progress schema definition and could change at any time. Do not use this in production. ⚠️

**The Declarative Document Object Model** *(or DDOM)* is a schema and runtime for building and deploying web applications  (documents, variables, functions, and elements) via [JavaScript objects](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Object_basics) which closely mirror the [Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model).

Just as JSON provides a syntax and grammar for defining arbitrary data, DDOM defines a type-enforced object structure for exposing [Open Web Platform](https://www.w3.org/wiki/Open_Web_Platform) functionality within an object syntax inspired by the [official DOM API](https://dom.spec.whatwg.org/), the [CSSOM](https://www.w3.org/TR/cssom-1/), [ECMAScript static methods](https://tc39.es/), and related web standards.

DDOM is developed as a [specification](spec/spec.md), a [collection of types](lib/src/types/), and a [reference runtime library](lib/) for deploying reactive web applications using the DDOM syntax. The DDOM runtime library is developed in Typescript and integrates the [TC39 JavaScript Signals proposal](https://github.com/tc39/proposal-signals) to provide a standardized signal-based reactivity model.

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
    textContent: 'Hello ${this.$name}!' // ← Signals available in template strings
  }, {
    tagName: 'p', 
    textContent: 'Count: ${this.$count}' // ← Clean syntax without .get()
  }, {
    tagName: 'button',
    textContent: 'Increment',
    onclick: function() { 
      this.$count.set(this.$count.get() + 1); // ← .get()/.set() only needed in JavaScript functions
    }
  }]
});
```

That's it for a simple but powerful custom [Web Component](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)! The syntax follows the DOM, \$-prefixed properties automatically become reactive signals that are shared across the component scope. Template literals update the DOM reactively.

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

Strings with `${...}` are automatically converted to reactive template expressions, allowing dynamic content updates. **Signals are automatically unwrapped** - no need for explicit `.get()` calls in templates:

```JavaScript
{
  tagName: 'div',
  $count: 42,
  $status: 'active',
  
  // Signals auto-unwrapped in templates - clean syntax!
  textContent: 'Count is ${this.$count}',                    // ← No .get() needed!
  className: 'status ${this.$status} ${this.$count > 10 ? "high" : "low"}',
  title: 'Current value: ${this.$count} (${this.$status})', // ← Multiple signals
  
  // Mix signals with regular JavaScript expressions
  'data-info': 'User ${this.$count} of ${Math.max(100, this.$count)}',
  
  attributes: {
    'aria-label': 'Counter showing ${this.$count} items'
  }
}
```

**Template Benefits:**

* **Automatic unwrapping** - Signals work like regular variables
* **Reactive updates** - DOM updates when any referenced signal changes
* **Clean syntax** - No boilerplate `.get()` calls required
* **Multiple signals** - Use any number of signals in one template
* **JavaScript expressions** - Full expression support with auto-unwrapping

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
    textContent: '${this.$displayText}' // ← Signals auto-unwrapped in templates!
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

### 🌐 Dynamic Mapped Arrays

Create dynamic lists that automatically update when data changes using the prototype-based namespace syntax:

```JavaScript
{ // Object for defining an entire window
    $todoList: [
      { id: 1, text: 'Learn DDOM basics', completed: false },
      { id: 2, text: 'Build a todo app', completed: false },
      { id: 3, text: 'Deploy to production', completed: true }
    ],

    // Define the todo-item custom element
    customElements: [{
        tagName: 'todo-item',
        $todoItem: {},
        $todoIndex: 0,

        textContent: '${this.$todoItem.get().text}' // ← Explicit signal access
    }],
    
    // Document body structure
    document: {
        body: {
            children: { // ← Array namespace with prototype-based configuration
                prototype: 'Array',
                items: 'window.$todoList', // ← Reference data from anywhere
                // items: [{ id: 1, text: 'Task 1' }, { id: 2, text: 'Task 2' }], // ← Or a static array
                map: {
                    tagName: 'todo-item', // ← element tag for each item
                    $todoItem: 'item', // ← Declarative accessor for each array item
                    $todoIndex: 'index', // ← Declarative accessor for item index
                }
            }
        }
    }
}
```

### 🌐 Web API Namespaces

DDOM provides declarative access to Web APIs through prototype-based namespace configuration, enabling reactive integration with browser functionality:

```JavaScript
{
  // Reactive HTTP requests
  $userData: {
    prototype: 'Request',
    url: '/api/users/${this.$userId}',  // ← Signals auto-unwrapped in templates!
    method: 'GET',
    debounce: 300 // Debounce requests
  },
  
  // Reactive form data
  $uploadForm: {
    prototype: 'FormData',
    file: '${this.$selectedFile}',     // ← Clean syntax without .get()
    description: '${this.$description}'
  },
  
  // Reactive URL parameters
  $searchParams: {
    prototype: 'URLSearchParams',
    q: '${this.$query}',               // ← Auto-unwrapped signals
    page: '${this.$page}'
  },
  
  // Use in API calls
  $searchResults: {
    prototype: 'Request',
    url: '/api/search?${this.$searchParams}'
  }
}
```

**Supported Prototypes:**

* **Request** - Declarative fetch API integration
* **FormData** - Reactive form data construction
* **URLSearchParams** - Reactive URL parameter handling
* **Array, Set, Map** - Reactive collections with filtering, mapping, and sorting
* **TypedArrays** - Reactive binary data arrays
* **Blob** - Reactive binary data creation
* **ArrayBuffer** - Reactive buffer management
* **ReadableStream** - Reactive stream creation
* **LocalStorage, SessionStorage, Cookie** - Reactive storage APIs
* **IndexedDB** - Full reactive database support with CRUD operations

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
                          textContent: 'Hello ${this.$name}!'
                      },
                      {
                          tagName: 'p',
                          textContent: 'Count: ${this.$count}'
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
* **Template expressions** support **automatic signal unwrapping** - no `.get()` needed!
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

### The Rule of Least Power

DDOM follows [Tim Berners-Lee's Rule of Least Power](https://www.w3.org/DesignIssues/Principles.html#PLP): *"Given a choice of solutions, pick the least powerful solution capable of solving the problem."* This principle guides every design decision:

* **Declarative over imperative** - Use data structures instead of functions where possible
* **Templates over functions** - Template literals `'${item.name}'` instead of `(item) => item.name`
* **Configuration over code** - Describe what you want, not how to build it
* **Web standards over custom APIs** - Leverage existing browser capabilities

This approach creates more maintainable, serializable, and understandable code while preventing over-engineering.

### Developer Experience

DDOM prioritizes:

* **Familiar syntax** - Works like normal JavaScript
* **Minimal novelty** - Standards-alignment over DSLs
* **Least power** - Simplest solution that solves the problem
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
