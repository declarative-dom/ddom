# Declarative DOM

**Declarative DOM** *(or DDOM)* is a JavaScript object schema for defining and deploying web applications. It aims to support all current web development capabilities within an object structure aligned to the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model), [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model), and adjacent web standards.&#x20;

Just as JSON provides a syntax and grammar for describing arbitrary data, DDOM defines a type-enforced structure for describing web applications and components. Specifically, DDOM provides a strongly typed, JSON-like syntax for defining DOM documents, nodes, and custom elements, in a declarative manner. Special emphasis is placed on creating a consistent and predictable standards-aligned syntax to define the structure and functionality of custom elements (aka [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)).

This specification is designed to be used with JavaScript and TypeScript, enabling developers to create and manipulate DOM structures without relying on traditional imperative programming patterns. Any developer familiar with the DOM should easily understand the intent of a DDOM definition, while DOM conformance facilitates minimal-translation deployments.

This repository houses a working draft-state [data specification](spec/SPEC.md), [type specifications](spec/types.d.ts) and a [reference rendering library](lib/).

## What It Is

Declarative DOM is:

* A specification for DOM structure-as-data
* A collection of types for use with JSDoc or TypeScript
* Inspired by the semantics of [`HTMLElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) and [`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window)
* Useful for UI builders, visual application editors, and component serialization

## What It Is Not

* It is not a template language
* It is not a virtual DOM diffing engine
* It does not define rendering semantics

## Goals

* 🧠 Treat UI as data: no strings, no templates
* 🎯 Align closely with native DOM types
* 🛠️ Designed for app builders and WYSIWYG editor tooling
* 📦 JSON/JS-friendly for transport, storage, and analysis

## Philosophy

The Declarative DOM specification follows strict guidelines to maintain consistency and predictability:

### Primary Principle: DOM Fidelity

DDOM should mirror and support valid DOM properties, keys, and value types as closely as possible. The specification aims for near 1:1 correspondence with native DOM APIs.

### Core Tenet: DOM Primacy

**"Libraries and frameworks shall pass away, but the DOM shall endure forever."**

All naming conventions, method signatures, and behavior patterns should align with current DOM APIs first and foremost. While framework conventions *could* be relevant to address functionality gaps in web standards (see Exception 2, below), web standards always take precedence. This ensures DDOM remains stable and familiar as the web platform evolves, regardless of changing framework trends.

### Exception 1: Read-Only Properties

When standard DOM properties are read-only but should be declarable, DDOM defines syntax that aligns as closely as possible with the intended DOM result. Examples include:

* `tagName` - normally read-only, but essential for declarative element creation
* `children` - allows declarative specification of child elements inside a list element.
* `document` and `customElements` - enable declarative document and web component structure

### Exception 2: DOM Functionality Gaps

When no equivalent DOM syntax exists for functionality essential to a declarative UI, DDOM extends the DOM syntax, but with best-effort alignment to adjacent web standards and established conventions. This ensures that the syntax remains familiar to web developers while supporting essential capabilities.

Notable examples include:

**CSS Nesting**: The [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model) only exposes flattened CSS rules and doesn't allow selector-based targeting on [HTMLElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement) [styles](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style). DDOM adopts [CSS nesting](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting) syntax because:

* It can be implemented using CSSOM-like APIs
* It provides a familiar, standardized syntax for nested selectors
* It aligns with DDOM's objective of treating UI structure as data
* It maintains the declarative nature while extending beyond basic DOM capabilities

The bottom line: CSS nesting is currently a draft specification, may not be directly supported in all browsers, and may never be adopted in the CSSOM. DDOM adopts this syntax to support essential functionality, align with emerging standards, and provide a consistent declarative approach.

**Reactive Properties**: Unlike string-only *attributes*, web component standards don't currently provide native rendering reactivity for custom element *properties*. DDOM adopts a `$`-prefixed syntax for reactive properties in custom elements because:

* Reactive properties are considered essential for modern web applications
* No existing DOM API provides a way to define reactive properties
* It borrows from the `#`-prefix JavaScript private properties standard, providing a familiar syntax
* It aligns with modern web development patterns while maintaining declarative consistency

The Bottom Line: The `$`-prefixed syntax is not part of the official DOM or web standards. It is inspired by conventions in modern frameworks like Svelte to provide a familiar and intuitive approach for developers.

### Design Constraints

1. **Standards-based Syntax**: Avoid inventing new patterns when sufficient web standards exist; adopt established conventions when necessary
2. **Predictable Mapping**: Developers should be able to predict DDOM syntax from their DOM knowledge
3. **Future-Proof**: Syntax should align with emerging web standards when possible
4. **Minimal Exceptions**: Only deviate from DOM APIs when absolutely necessary for declarative completeness

## Example

```JavaScript
// adoptWindow initializes the DDOM structure and applies it to the current document
import { adoptWindow } from 'declarative-dom';

adoptWindow({
  customElements: [
    {
      tagName: 'my-box',
      style: { 
        backgroundColor: 'skyblue', 
        display: 'block',
        width: 'fit-content',
        padding: '1em',
        ':hover': {
          backgroundColor: 'lightblue',
          transform: 'scale(1.05)'
        }
      },
      children: [
        { tagName: 'h2', textContent: 'Hello!' },
        { 
          tagName: 'button', 
          textContent: 'Click me', 
          style: {
            padding: '0.5em 1em',
            border: 'none',
            borderRadius: '4px',
            ':hover': { backgroundColor: '#007acc', color: 'white' }
          },
          onclick: () => alert('Clicked!') 
        }
      ]
    }
  ],
  document: {
    head: {
      title: 'Declarative DOM Example'
    },
    body: {
      style: { 
        margin: '2em', 
        background: '#111', 
        color: 'white',
        fontFamily: 'system-ui, sans-serif'
      },
      children: [
        { tagName: 'my-box' }
      ]
    }
  }
});
```
Which can be rendered as the following HTML equivalent:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Declarative DOM Example</title>
  <style>
    body {
      margin: 2em;
      background: #111;
      color: white;
      font-family: system-ui, sans-serif;
    }
    my-box {
      background-color: skyblue;
      display: block;
      width: fit-content;
      padding: 1em;
    }
    my-box:hover {
      background-color: lightblue;
      transform: scale(1.05);
    }
    my-box h2 {
      margin: 0;
    }
    my-box button {
      padding: 0.5em 1em;
      border: none;
      border-radius: 4px;
    }
    my-box button:hover {
      background-color: #007acc;
      color: white;
    }
  </style>
</head>
<body>
  <my-box>
    <h2>Hello!</h2>
    <button onclick="alert('Clicked!')">Click me</button>
  </my-box>
</body>
</html>
```
## License

MIT
