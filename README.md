# Declarative DOM

**Declarative DOM** is a data format for expressing nearly 100% DOM-consistent structure using JavaScript object literals. Think of it as a subset and superset of the current DOM specifications, where certain readonly DOM properties become writable in a declarative manner.

Just as JSON provides a syntax and grammar for describing arbitrary data, Declarative DOM defines a constrained structure for describing DOM nodes and documents.

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
- 🛠️ Enable app builders and editor tooling
- 📦 JSON/JS-friendly for transport, storage, and analysis

## Example

```js
import { renderWindow } from 'declarative-dom';

renderWindow({
  customElements: {
    'my-box': {
      tagName: 'div',
      style: { backgroundColor: 'skyblue', padding: '1em' },
      children: [
        { tagName: 'h2', textContent: 'Hello!' },
        { tagName: 'button', textContent: 'Click me', onclick: () => alert('Clicked!') }
      ]
    }
  },
  document: {
    body: {
      style: { margin: '2em', background: '#111', color: 'white' },
      children: [
        { tagName: 'my-box' }
      ]
    }
  }
});
```

## License

MIT
