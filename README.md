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

## Example

```js
import { renderWindow } from 'declarative-dom';

renderWindow({
  customElements: [
    {
      tagName: 'my-box',
      style: { backgroundColor: 'skyblue', padding: '1em' },
      children: [
        { tagName: 'h2', textContent: 'Hello!' },
        { tagName: 'button', textContent: 'Click me', onclick: () => alert('Clicked!') }
      ]
    }
  ],
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
