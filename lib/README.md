# Declarative DOM Library (`@declarative-dom/lib`)

Declarative DOM (DDOM) is a JavaScript object schema for building web applications. This package provides the reference implementation for the DDOM specification, enabling you to construct reactive DOM trees using plain JavaScript objects.

## What is DDOM?

DDOM defines a strongly typed, JSON-like syntax for describing DOM documents, nodes, and custom elements in a declarative manner. It closely mirrors the [DOM API Standard](https://dom.spec.whatwg.org/) and supports modern web development features, including reactivity and template literal processing.

## Installation

```bash
npm install @declarative-dom/lib
```

## Usage

```javascript
import DDOM from '@declarative-dom/lib';

const app = DDOM.customElements.define({
  tagName: 'my-app',
  count: 0,        // Automatically becomes a reactive signal
  name: 'World',   // Accessed via .get() and .set() methods
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
      onclick: () => app.count.set(app.count.get() + 1)
    }
  ]
});
```

## Defining an Entire Page

You can declaratively define an entire HTML page structure, including the document, head, and body, using DDOM:

```javascript
const page = {
  document: {
    head: {
      children: [
        { tagName: 'title', textContent: 'My DDOM App' },
        { tagName: 'meta', attributes: { charset: 'utf-8' } }
      ]
    },
    body: {
      children: [
        {
          tagName: 'main',
          children: [
            { tagName: 'h1', textContent: 'Welcome to DDOM!' },
            { tagName: 'p', textContent: 'This page was defined declaratively.' }
          ]
        }
      ]
    }
  }
};
```

## Custom Elements Example

You can define custom elements with lifecycle callbacks and use them like standard elements:

```javascript
const userCard = {
  tagName: 'user-card',
  style: {
    display: 'block',
    border: '1px solid #ccc',
    padding: '1rem'
  },
  children: [
    {
      tagName: 'img',
      attributes: { src: '/default-avatar.png', alt: 'User avatar' }
    },
    {
      tagName: 'h3',
      textContent: 'Default Name'
    }
  ],
  connectedCallback: (element) => {
    const name = element.getAttribute('name') || 'Anonymous';
    const h3 = element.querySelector('h3');
    if (h3) h3.textContent = name;
  }
};

// Register and use the custom element
DDOM.customElements.define(userCard);

const page = {
  tagName: 'div',
  children: [
    {
      tagName: 'user-card',
      attributes: { name: 'John Doe' }
    }
  ]
};
```

## Key Features

- **DOM Conformance:** Object properties mirror standard DOM element properties.
- **Reactive Signals:** Custom data properties become reactive signals with explicit `.get()` and `.set()` methods.
- **Template Literals:** Template literals with `${...}` expressions are automatically reactive.
- **Property Accessors:** Reference values throughout the application using standard JavaScript dot notation.
- **Declarative Children:** Nested structures mirror the DOM tree using `children` arrays.
- **Declarative Styles:** Styles are objects with camelCase property names and support CSS nesting.
- **Custom Elements:** Define and use custom elements declaratively.

## Architecture

DDOM consists of several key modules:

- **`arrays/`** - Dynamic array implementation
- **`customElements/`** - Custom element registration and management
- **`elements/`** - DOM element creation/adoption
- **`events/`** - Signal system and effect management
- **`properties/`** - Property definition and management
- **`styleSheets/`** - Style object processing and application

## Performance

DDOM's reactivity model provides excellent performance:

- **Property-level reactivity** - Only affected elements update
- **Explicit signal access** - Predictable `.get()` and `.set()` operations
- **Computed signals** - Efficient template literal updates
- **No component re-rendering** - Granular updates only

## Development

### Build

```bash
npm run build
```

### Debug

```bash
npm run debug
```

### Watch

```bash
npm run dev
```

## License

MIT
