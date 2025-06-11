# Declarative DOM Technical Specification
## Version 0.1.1

### Abstract

Declarative DOM (DDOM) is a universal syntax for expressing DOM structures using JavaScript object literals. It provides a standardized representation of HTML elements, custom elements, documents, and windows, enabling declarative construction of web interfaces. The DDOM types serve as the universal source of truth for syntax definitions, while the bundled library provides the reference implementation. Other renderers and compilers may advertise DDOM conformance, provided they adhere to the syntax defined herein.

### 1. Introduction

#### 1.1 Purpose

This specification defines Declarative DOM, a syntax for representing DOM structures as JavaScript objects. The syntax is designed to:

- Enable programmatic construction of DOM trees without imperative APIs
- Provide type-safe representations of HTML elements and their properties
- Support reactive user interface development
- Allow flexibility for alternative implementations

#### 1.2 Design Principles

1. **Syntax Alignment**: Object properties closely mirror native DOM element properties
2. **Type Safety**: Full TypeScript support with accurate type definitions
3. **Declarative**: No imperative construction logic required
4. **Extensible**: Custom elements are first-class citizens
5. **Reactive**: Support for reactive properties and template literals
6. **Implementation-Agnostic**: Syntax is tightly defined, allowing multiple implementations

#### 1.3 Scope

This specification covers:
- Element property mappings
- Document and window structures
- Custom element definitions
- Event handler specifications
- Style object definitions
- Attribute handling

### 2. Core Syntax

#### 2.1 WritableOverrides

Defines properties that override normally read-only DOM properties to enable declarative definition:

```typescript
type WritableOverrides = {
  tagName?: string;
  attributes?: Record<string, string>;
  children?: HTMLElementSpec[] | MappedArrayExpr<any[], CustomElementSpec>;
  document?: Partial<DocumentSpec>;
  customElements?: CustomElementSpec[];
  style?: StyleExpr;
};
```

#### 2.2 HTMLElementSpec

Represents any HTML element:

```typescript
type HTMLElementSpec = Omit<HTMLElement, keyof WritableOverrides | 'parentNode'> & WritableOverrides & {
  tagName: string; // Required for elements
  parentNode?: DOMNode | ElementSpec; // Allow parentNode to be declared during processing
};
```

#### 2.3 CustomElementSpec

Defines a custom element:

```typescript
type CustomElementSpec = WritableOverrides & {
  tagName: string; // Required for custom elements
  constructor?: (element: HTMLElement) => void;
  adoptedCallback?: (element: HTMLElement) => void;
  attributeChangedCallback?: (element: HTMLElement, name: string, oldValue: string | null, newValue: string | null) => void;
  connectedCallback?: (element: HTMLElement) => void;
  disconnectedCallback?: (element: HTMLElement) => void;
  observedAttributes?: string[];
};
```

#### 2.4 DocumentSpec

Represents a document:

```typescript
type DocumentSpec = Omit<Document, keyof WritableOverrides> & WritableOverrides & {
  body?: Partial<HTMLBodyElementSpec>;
  head?: Partial<HTMLHeadElementSpec>;
};
```

#### 2.5 WindowSpec

Represents a window:

```typescript
type WindowSpec = Omit<Window, keyof WritableOverrides> & WritableOverrides & {};
```

#### 2.6 StyleExpr

Extends standard CSS properties to support nested selectors and pseudo-selectors:

```typescript
type StyleExpr = {
  [K in keyof CSSStyleDeclaration]?: CSSStyleDeclaration[K];
} & {
  [selector: string]: StyleExpr;
};
```

### 3. Syntax Rules

#### 3.1 Standard Properties

All standard DOM properties are supported with their native types:

```javascript
{
  tagName: 'div',
  id: 'my-element',
  className: 'container active',
  textContent: 'Hello World',
  hidden: false,
  tabIndex: 0
}
```

#### 3.2 Style Properties

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

#### 3.3 Attributes

HTML attributes are specified in the `attributes` object:

```javascript
{
  tagName: 'input',
  attributes: {
    type: 'text',
    placeholder: 'Enter text',
    'data-testid': 'search-input',
    'aria-label': 'Search field'
  }
}
```

#### 3.4 Event Handlers

Event handlers are functions assigned to `on*` properties:

```javascript
{
  tagName: 'button',
  textContent: 'Click me',
  onclick: (event) => {
    console.log('Button clicked!');
  }
}
```

#### 3.5 Children and Nesting

Child elements are specified in the `children` array:

```javascript
{
  tagName: 'div',
  className: 'container',
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

### 4. Custom Elements

#### 4.1 Definition

Custom elements are defined in the `customElements` array:

```javascript
{
  customElements: [
    {
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
    }
  ]
}
```

#### 4.2 Usage

Once defined, custom elements can be used like standard elements:

```javascript
{
  tagName: 'div',
  children: [
    {
      tagName: 'user-card',
      attributes: { name: 'John Doe' }
    }
  ]
}
```

### 5. Implementation Flexibility

While the bundled library serves as the reference implementation, alternative renderers and compilers may be developed to suit specific purposes. These implementations must adhere to the syntax defined in this specification to ensure compatibility.

### 6. Security Considerations

#### 6.1 Script Injection

Implementations should sanitize input to prevent XSS vulnerabilities. Event handler functions, `innerHTML`, and similar properties should be validated when accepting declarative DOM from untrusted sources.

#### 6.2 Sanitization

When accepting declarative DOM from untrusted sources:
- Function properties should be stripped or validated
- HTML content should be sanitized
- Attribute values should be validated

### 7. Conformance

An implementation conforms to this specification if it:
- Correctly interprets all declarative DOM structures defined herein
- Produces equivalent DOM trees to imperative construction
- Supports all specified property types and mappings
- Handles custom elements according to Web Components standards
- Maintains type safety in TypeScript environments