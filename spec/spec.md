# Declarative DOM Technical Specification
## Version 0.3.0

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

#### 1.3 Reactive

This specification covers:
- Element property mappings
- Document and window structures
- Custom element definitions
- Event handler specifications
- Style object definitions
- Attribute handling
- Property accessor resolution

### 2. Core Syntax

The following Web IDL grammar defines the complete syntax for Declarative DOM specifications.

#### 2.1 Callback Types

```webidl
callback ElementConstructor = undefined (HTMLElement element);
callback ElementLifecycleCallback = undefined (HTMLElement element);
callback AttributeChangedCallback = undefined (HTMLElement element, DOMString name, DOMString? oldValue, DOMString? newValue);
callback EventHandlerNonNull = any (Event event);
typedef EventHandlerNonNull? EventHandler;
```

#### 2.2 Configuration Dictionaries

```webidl
dictionary WritableOverrides {
  DOMString tagName;
  record<DOMString, DOMString> attributes;
  sequence<ElementSpec> children;
  DocumentSpec document;
  sequence<CustomElementSpec> customElements;
  StyleExpr style;
};

dictionary HTMLElementSpec : WritableOverrides {
  // Standard HTMLElement properties
  required DOMString tagName;
  DOMString id;
  DOMString className;
  DOMString textContent;
  DOMString innerHTML;
  DOMString innerText;
  boolean hidden;
  long tabIndex;
  DOMString title;
  DOMString lang;
  DOMString dir;
  boolean contentEditable;
  boolean spellcheck;
  boolean draggable;
  
  // Declarative extensions
  record<DOMString, DOMString> attributes;
  sequence<ElementSpec> children;
  StyleExpr style;
  ElementSpec? parentNode;
  
  // Event handlers
  EventHandler onclick;
  EventHandler onchange;
  EventHandler oninput;
  EventHandler onsubmit;
  EventHandler onload;
  EventHandler onerror;
  EventHandler onmouseover;
  EventHandler onmouseout;
  EventHandler onmousedown;
  EventHandler onmouseup;
  EventHandler onkeydown;
  EventHandler onkeyup;
  EventHandler onkeypress;
  EventHandler onfocus;
  EventHandler onblur;
};

dictionary HTMLBodyElementSpec : HTMLElementSpec {
  // Inherits all HTMLElementSpec properties
  // Body-specific properties can be added here
};

dictionary HTMLHeadElementSpec : HTMLElementSpec {
  // Inherits all HTMLElementSpec properties  
  // Head-specific properties can be added here
};

dictionary CustomElementSpec : HTMLElementSpec {
  required DOMString tagName; // Required, must contain hyphen
  ElementConstructor? constructor;
  ElementLifecycleCallback? adoptedCallback;  
  AttributeChangedCallback? attributeChangedCallback;
  ElementLifecycleCallback? connectedCallback;
  ElementLifecycleCallback? disconnectedCallback;
  sequence<DOMString> observedAttributes;
};

dictionary DocumentSpec {
  // Standard Document properties
  DOMString title;
  DOMString URL;
  DOMString documentURI;
  DOMString domain;
  DOMString referrer;
  DOMString cookie;
  DOMString lastModified;
  DOMString readyState;
  DOMString characterSet;
  DOMString charset;
  
  // Declarative extensions
  HTMLBodyElementSpec? body;
  HTMLHeadElementSpec? head;
  sequence<CustomElementSpec> customElements;
};

dictionary WindowSpec {
  // Standard Window properties
  DOMString name;
  long innerWidth;
  long innerHeight;
  long outerWidth;
  long outerHeight;
  long screenX;
  long screenY;
  boolean closed;
  
  // Declarative extensions
  DocumentSpec? document;
  sequence<CustomElementSpec> customElements;
};
```

#### 2.3 Style Expression Dictionary

```webidl
dictionary StyleExpr {
  // CSS Properties (representative subset)
  DOMString backgroundColor;
  DOMString color;
  DOMString fontSize;
  DOMString fontFamily;
  DOMString fontWeight;
  DOMString display;
  DOMString position;
  DOMString top;
  DOMString left;
  DOMString right;
  DOMString bottom;
  DOMString width;
  DOMString height;
  DOMString margin;
  DOMString marginTop;
  DOMString marginRight;
  DOMString marginBottom;
  DOMString marginLeft;
  DOMString padding;
  DOMString paddingTop;
  DOMString paddingRight;
  DOMString paddingBottom;
  DOMString paddingLeft;
  DOMString border;
  DOMString borderRadius;
  DOMString boxShadow;
  DOMString textAlign;
  DOMString lineHeight;
  DOMString zIndex;
  DOMString opacity;
  DOMString transform;
  DOMString transition;
  DOMString cursor;
  DOMString overflow;
  DOMString overflowX;
  DOMString overflowY;
  
  // Nested selectors and pseudo-selectors
  // Note: These are represented as additional dictionary members with 
  // selector strings as keys and StyleExpr values
  // Examples: ":hover", ".child", "@media (max-width: 768px)"
  // This extends the dictionary dynamically: { ":hover": StyleExpr }
};

// Note: StyleExpr supports dynamic extension for nested selectors
// record<DOMString, StyleExpr> for selector nesting is implied
```

#### 2.4 Type Unions

```webidl
typedef (HTMLElementSpec or HTMLBodyElementSpec or HTMLHeadElementSpec or CustomElementSpec) ElementSpec;
typedef (HTMLElementSpec or HTMLBodyElementSpec or HTMLHeadElementSpec or CustomElementSpec or DocumentSpec or WindowSpec) DOMSpec;
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

#### 3.6 Property Accessors

Property accessor strings are automatically resolved to their target values:

```javascript
{
  tagName: 'div',
  userData: 'window.currentUser',      // ← Resolves to window.currentUser
  parentData: 'this.parentNode.items', // ← Resolves to parent element's items
  settings: 'document.appConfig'       // ← Resolves to document.appConfig
}
```

Property accessors must start with:
- `window.` - References global window properties
- `document.` - References document properties  
- `this.` - References properties relative to the current element

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