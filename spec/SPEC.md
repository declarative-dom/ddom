# Declarative DOM Technical Specification
## Draft Version 0.1.0

### Abstract

Declarative DOM is a data format specification for expressing DOM structure using JavaScript object literals. It provides a JSON-serializable representation of HTML elements, custom elements, documents, and windows that closely mirrors native DOM APIs while enabling declarative construction of web interfaces.

### 1. Introduction

#### 1.1 Purpose

This specification defines Declarative DOM, a format for representing DOM structures as JavaScript objects. The format is designed to:

- Enable programmatic construction of DOM trees without imperative APIs
- Provide type-safe representations of HTML elements and their properties
- Support serialization and deserialization of UI structures

#### 1.2 Design Principles

1. **DOM Alignment**: Object properties closely mirror native DOM element properties
2. **Type Safety**: Full TypeScript support with accurate type definitions
3. **JSON Compatibility**: All structures can be serialized to/from JSON
4. **Declarative**: No imperative construction logic required
5. **Extensible**: Custom elements are first-class citizens

#### 1.3 Scope

This specification covers:
- Element property mappings
- Document and window structures
- Custom element definitions
- Event handler specifications
- Style object definitions
- Attribute handling

### 2. Normative References

- [DOM Living Standard](https://dom.spec.whatwg.org/)
- [HTML Living Standard](https://html.spec.whatwg.org/)
- [Custom Elements](https://html.spec.whatwg.org/multipage/custom-elements.html)

### 3. Terminology

**Declarative Element**: A JavaScript object representing an HTML element with declarative properties.

**WritableOverrides**: Properties that override normally read-only DOM properties to enable declarative definition.

**Custom Element Definition**: An object defining the structure and behavior of a custom HTML element.

### 4. Core Types

#### 4.1 WritableOverrides

The base type that defines properties available for declarative override:

```typescript
type WritableOverrides = {
  tagName?: string;
  attributes?: Record<string, string>;
  children?: DeclarativeHTMLElement[];
  document?: Partial<DeclarativeDocument>;
  customElements?: DeclarativeCustomElement[];
};
```

#### 4.2 DeclarativeHTMLElement

Represents any HTML element:

```typescript
type DeclarativeHTMLElement = Omit<HTMLElement, keyof WritableOverrides> & 
  WritableOverrides & {
    tagName: string; // Required for elements
  };
```

**Properties:**
- `tagName` (required): The element's tag name (e.g., 'div', 'span', 'button')
- `attributes`: Key-value pairs for HTML attributes
- `children`: Array of child elements
- `style`: CSS style properties as an object
- All standard HTMLElement properties (textContent, id, className, etc.)
- Event handlers as function properties (onclick, onload, etc.)

#### 4.3 DeclarativeCustomElement

Defines a custom element:

```typescript
type DeclarativeCustomElement = WritableOverrides & {
  tagName: string; // Required - must contain a hyphen
  connectedCallback?: (element: HTMLElement) => void;
  disconnectedCallback?: (element: HTMLElement) => void;
  attributeChangedCallback?: (element: HTMLElement, name: string, oldValue: string | null, newValue: string | null) => void;
  adoptedCallback?: (element: HTMLElement) => void;
  observedAttributes?: string[];
};
```

**Lifecycle Methods:**
- `connectedCallback`: Called when element is connected to the DOM
- `disconnectedCallback`: Called when element is disconnected from the DOM
- `attributeChangedCallback`: Called when observed attributes change
- `adoptedCallback`: Called when element is adopted into a new document

#### 4.4 DeclarativeDocument

Represents a document:

```typescript
type DeclarativeDocument = Omit<Document, keyof WritableOverrides> & 
  WritableOverrides & {
    body?: Partial<DeclarativeHTMLBodyElement>;
    head?: Partial<DeclarativeHTMLHeadElement>;
  };
```

#### 4.5 DeclarativeWindow

Represents a window:

```typescript
type DeclarativeWindow = Omit<Window, keyof WritableOverrides> & WritableOverrides;
```

### 5. Property Mapping

#### 5.1 Standard Properties

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

#### 5.2 Style Properties

Styles are represented as objects with camelCase property names and support full CSS nesting syntax:

```javascript
{
  tagName: 'div',
  style: {
    backgroundColor: 'blue',
    marginTop: '10px',
    fontSize: '16px',
    display: 'flex',
    
    // Pseudo-selectors using & syntax
    ':hover': {
      backgroundColor: 'red',
      cursor: 'pointer'
    },
    
    // Nested selectors for child elements
    '.child': {
      color: 'white',
      fontWeight: 'bold',
      
      ':hover': {
        color: 'yellow'
      }
    },
    
    // Direct descendant selectors
    'span': {
      textDecoration: 'underline'
    }
  }
}
```

**Nested CSS Generation:**
The style system automatically generates structured CSS rules in a dedicated DDOM stylesheet using modern CSS nesting syntax. The above example would generate:

```css
body>div:nth-child(1) {
  background-color: blue;
  margin-top: 10px;
  font-size: 16px;
  display: flex;

  &:hover {
    background-color: red;
    cursor: pointer;
  }

  .child {
    color: white;
    font-weight: bold;

    &:hover {
      color: yellow;
    }
  }
}

body>div:nth-child(1) span {
  text-decoration: underline;
}
```

#### 5.3 Attributes

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

#### 5.4 Event Handlers

Event handlers are functions assigned to `on*` properties:

```javascript
{
  tagName: 'button',
  textContent: 'Click me',
  onclick: (event) => {
    console.log('Button clicked!');
  },
  onmouseover: (event) => {
    event.target.style.backgroundColor = 'yellow';
  }
}
```

### 6. Children and Nesting

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

### 7. Custom Elements

#### 7.1 Definition

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
        // Custom initialization logic
        const name = element.getAttribute('name') || 'Anonymous';
        const h3 = element.querySelector('h3');
        if (h3) h3.textContent = name;
      }
    }
  ]
}
```

#### 7.2 Usage

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

#### 7.3 Shadow DOM

Custom elements can use shadow DOM through standard Web Components APIs within their lifecycle callbacks. The declarative structure applies to the light DOM or shadow root depending on the implementation.

### 8. CSS Management System

#### 8.1 DDOM Stylesheet

Declarative DOM maintains a dedicated stylesheet for all nested CSS rules using modern web APIs:

- **Primary**: Uses `new CSSStyleSheet()` and `document.adoptedStyleSheets` when available
- **Fallback**: Creates a `<style>` element with ID `ddom-styles` for older browsers

#### 8.2 CSS Rule Generation

The system automatically:
1. Generates unique selectors for each rendered element based on DOM position
2. Converts camelCase CSS properties to kebab-case
3. Creates properly nested CSS rules using modern CSS nesting syntax
4. Separates pseudo-selectors (`:hover`, `::before`) from descendant selectors

#### 8.3 Style Processing

For each element with styles:
1. Direct CSS properties are applied to `element.style`
2. Nested selectors generate CSS rules in the global DDOM stylesheet
3. Pseudo-selectors use `&` syntax for proper nesting
4. Descendant selectors create separate rules

#### 8.4 Stylesheet Management

```javascript
// Clear all DDOM styles
window.DDOM.clearDDOMStyles();

// Styles are automatically managed during rendering
```

### 9. Document Structure

#### 9.1 Full Document Example

```javascript
{
  document: {
    head: {
      children: [
        {
          tagName: 'title',
          textContent: 'My App'
        },
        {
          tagName: 'meta',
          attributes: {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1'
          }
        }
      ]
    },
    body: {
      style: {
        margin: '0',
        fontFamily: 'Arial, sans-serif'
      },
      children: [
        {
          tagName: 'header',
          children: [
            {
              tagName: 'h1',
              textContent: 'Welcome'
            }
          ]
        }
      ]
    }
  }
}
```

### 10. Global Document Modifications

Custom elements can specify global document modifications that are applied when the element is registered:

```javascript
{
  customElements: [
    {
      tagName: 'chart-widget',
      document: {
        head: {
          children: [
            {
              tagName: 'script',
              attributes: {
                src: 'https://cdn.jsdelivr.net/npm/chart.js'
              }
            }
          ]
        }
      },
      // ... element definition
    }
  ]
}
```

### 11. Serialization

#### 11.1 JSON Compatibility

All Declarative DOM structures must be JSON-serializable. This means:
- No function references in serialized form
- Event handlers must be reconstructed after deserialization
- Circular references are not allowed

#### 10.2 Function Handling

When serializing structures with event handlers:
- Functions are omitted from JSON serialization
- A separate mechanism must be provided to restore function references
- Lifecycle callbacks for custom elements are similarly handled

### 12. Implementation Requirements

#### 12.1 Rendering

Implementations must:
- Create actual DOM elements from declarative descriptions
- Set properties and attributes correctly
- Establish parent-child relationships
- Register custom elements with the browser's CustomElementRegistry
- Execute lifecycle callbacks at appropriate times

#### 12.2 Type Safety

TypeScript implementations must:
- Provide accurate type definitions for all supported elements
- Enable type checking for element properties
- Support IntelliSense for available properties and methods

### 13. Security Considerations

#### 13.1 Script Injection

Implementations should be aware that:
- Event handler functions can execute arbitrary code
- innerHTML and similar properties can introduce XSS vulnerabilities
- Custom element lifecycle callbacks have full DOM access

#### 13.2 Sanitization

When accepting declarative DOM from untrusted sources:
- Function properties should be stripped or validated
- HTML content should be sanitized
- Attribute values should be validated

### 14. Examples

#### 14.1 Simple Form

```javascript
{
  tagName: 'form',
  onsubmit: (e) => {
    e.preventDefault();
    // Handle form submission
  },
  children: [
    {
      tagName: 'label',
      textContent: 'Name:',
      attributes: { for: 'name-input' }
    },
    {
      tagName: 'input',
      id: 'name-input',
      attributes: {
        type: 'text',
        required: 'true'
      }
    },
    {
      tagName: 'button',
      attributes: { type: 'submit' },
      textContent: 'Submit'
    }
  ]
}
```

#### 14.2 Interactive Component

```javascript
{
  customElements: [
    {
      tagName: 'counter-widget',
      count: 0,
      children: [
        {
          tagName: 'button',
          textContent: '-',
          onclick: function() {
            const counter = this.parentElement;
            counter.count--;
            counter.updateDisplay();
          }
        },
        {
          tagName: 'span',
          className: 'count-display',
          textContent: '0'
        },
        {
          tagName: 'button',
          textContent: '+',
          onclick: function() {
            const counter = this.parentElement;
            counter.count++;
            counter.updateDisplay();
          }
        }
      ],
      connectedCallback: function(element) {
        element.updateDisplay = function() {
          const display = this.querySelector('.count-display');
          if (display) display.textContent = this.count.toString();
        };
      }
    }
  ],
  document: {
    body: {
      children: [
        { tagName: 'counter-widget' }
      ]
    }
  }
}
```

### 15. Future Considerations

#### 15.1 Template Syntax

Future versions may consider:
- Template variable substitution
- Conditional rendering directives
- Loop constructs for dynamic content

#### 15.2 Performance

Potential optimizations:
- Incremental rendering for large structures
- Virtual DOM diffing capabilities
- Lazy loading of custom element definitions

#### 15.3 Tooling

Development of:
- Visual editors for declarative DOM structures
- Validation tools for structure correctness
- Migration utilities from other formats

### 16. Conformance

An implementation conforms to this specification if it:
- Correctly interprets all declarative DOM structures defined herein
- Produces equivalent DOM trees to imperative construction
- Supports all specified property types and mappings
- Handles custom elements according to Web Components standards
- Maintains type safety in TypeScript environments

---

**Authors**: Declarative DOM Working Group  
**Version**: 0.1.0 Draft  
**Last Modified**: 2024