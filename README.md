# Declarative DOM

**Declarative DOM** is a working draft-state data format for expressing nearly 100% DOM-consistent structure using JavaScript object literals. Think of it as an object syntax supporting a subset and re-casting of the current DOM properties, where certain readonly DOM properties become writable in a declarative manner. 

Just as JSON provides a syntax and grammar for describing arbitrary data, Declarative DOM defines a constrained structure for describing DOM nodes and documents. Special emphasis is placed on creating a standardized syntax to define the import and initiation of custom elements in a declarative way.

Included are type specifications and a reference rendering library.

## What It Is

Declarative DOM is:

- A specification for DOM structure-as-data
- Strongly typed using TypeScript
- Inspired by the semantics of `HTMLElement` and `Window`
- Useful for UI builders, visual editors, and component serialization

## What It Is Not

- It is not a template language
- It is not a virtual DOM diffing engine
- It does not define rendering semantics

## Goals

- 🧠 Treat UI as data: no strings, no templates
- 🎯 Align closely with native DOM types
- 🛠️ Designed for app builders and WYSIWYG editor tooling
- 📦 JSON/JS-friendly for transport, storage, and analysis

## Philosophy

The Declarative DOM specification follows strict guidelines to maintain consistency and predictability:

### Primary Principle: DOM Fidelity
DDOM should mirror and support valid DOM properties, keys, and value types as closely as possible. The specification aims for 1:1 correspondence with native DOM APIs wherever feasible.

### Exception 1: Read-Only Properties
When DOM properties are read-only but should be settable declaratively, DDOM defines syntax that aligns as closely as possible with the final intended DOM outcome. Examples include:
- `tagName` - normally read-only, but essential for declarative element creation
- `children` - allows declarative specification of child elements
- `document` and `customElements` - enable declarative document and component structure

### Exception 2: DOM Functionality Gaps
When no equivalent DOM syntax exists for functionality essential to a declarative UI, DDOM extends the DOM syntax, but only in alignment with existing (albeit non-DOM) web standards. This ensures that the syntax remains familiar to web developers while extending capabilities.

The most notable example:

**CSS Nesting**: The [CSSOM](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model) only exposes flattened CSS rules and doesn't allow selector-based targeting on DOM styles. DDOM adopts [CSS Nesting](CSS nesting) syntax because:
- It can be implemented using CSSOM-like APIs
- It provides a familiar, standardized syntax for nested selectors
- It aligns with DDOM's objective of treating UI structure as data
- It maintains the declarative nature while extending beyond basic DOM capabilities

### Design Constraints
1. **No Proprietary Syntax**: Avoid inventing new patterns when established web standards exist
2. **Predictable Mapping**: Developers should be able to predict DDOM syntax from their DOM knowledge
3. **Future-Proof**: Syntax should align with emerging web standards when possible
4. **Minimal Exceptions**: Only deviate from DOM APIs when absolutely necessary for declarative completeness

## Example

```js
import { renderWindow } from 'declarative-dom';

renderWindow({
  customElements: [
    {
      tagName: 'my-box',
      style: { 
        backgroundColor: 'skyblue', 
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

## License

MIT
