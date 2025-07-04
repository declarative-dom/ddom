# Declarative DOM Technical Specification
## Version 0.4.0

### Abstract

Declarative DOM (DDOM) is a universal syntax for expressing DOM structures using JavaScript object literals with fine-grained reactivity. It provides a standardized representation of HTML elements, custom elements, documents, and windows, enabling declarative construction of reactive web interfaces. DDOM integrates the TC39 JavaScript Signals proposal to provide component-scoped reactivity through dollar-prefixed properties, template literal expressions, and property accessor resolution. 

The DDOM types serve as the universal source of truth for syntax definitions, while the bundled library provides the reference implementation. Other renderers and compilers may advertise DDOM conformance, provided they adhere to the syntax defined herein.

### 1. Introduction

#### 1.1 Purpose

This specification defines Declarative DOM, a syntax for representing DOM structures as JavaScript objects with integrated reactivity. The syntax is designed to:

- Enable programmatic construction of DOM trees without imperative APIs
- Provide type-safe representations of HTML elements and their properties
- Support reactive user interface development through TC39 Signals
- Provide component-scoped reactivity with dollar-prefixed properties
- Allow flexibility for alternative implementations

#### 1.2 Design Principles

1. **Rule of Least Power**: Following Tim Berners-Lee's principle, DDOM chooses the least powerful solution capable of solving each problem—favoring declarative templates over functions, configuration over code
2. **Syntax Alignment**: Object properties closely mirror native DOM element properties
3. **Type Safety**: Full TypeScript support with accurate type definitions
4. **Declarative**: No imperative construction logic required; purely declarative templates
5. **Extensible**: Custom elements are first-class citizens
6. **Reactive**: Support for reactive properties and template literals
7. **Implementation-Agnostic**: Syntax is tightly defined, allowing multiple implementations

#### 1.3 Scope

This specification covers:
- Element property mappings
- Document and window structures
- Custom element definitions
- Event handler specifications
- Style object definitions
- Attribute handling
- Property accessor resolution
- Dollar-prefixed reactive properties and signal generation
- Template literal processing and reactive binding
- Prototype-based namespace system for Web APIs and Array types
- Declarative array mapping, filtering, and sorting (Rule of Least Power compliance)

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
  (sequence<ElementSpec> or ArrayNamespaceConfig) children;
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

#### 2.4 Reactive and Dynamic Array Types

```webidl
// Prototype-based namespace configuration for arrays and Web APIs
dictionary NamespaceConfig {
  // Required: identifies the prototype/namespace type
  ("Array" or "Set" or "Map" or "Int8Array" or "Uint8Array" or "Int16Array" or "Uint16Array" or 
   "Int32Array" or "Uint32Array" or "Float32Array" or "Float64Array" or 
   "Request" or "FormData" or "URLSearchParams" or "Blob" or "ArrayBuffer" or 
   "ReadableStream" or "IndexedDB") prototype;
};

// Array namespace configuration (follows Rule of Least Power)
dictionary ArrayNamespaceConfig : NamespaceConfig {
  required DOMString prototype; // Must be an Array-like type
  
  // Source array - can be static array, Signal, or property accessor  
  (sequence<any> or DOMString) items;
  
  // Optional filtering expressions (declarative only)
  sequence<FilterCriteria> filter;
  
  // Optional sorting expressions (declarative only)
  sequence<SortCriteria> sort;
  
  // Mapping transformation - object template or string template only (no functions)
  (DOMString or ElementSpec) map;
  
  // Optional items to prepend/append to the mapped array
  sequence<ElementSpec> prepend;
  sequence<ElementSpec> append;
  
  // Optional debounce delay
  long debounce;
};

// Filter expression for array filtering (declarative only - follows Rule of Least Power)
dictionary FilterCriteria {
  // Left operand - property name or static value (no functions)
  (DOMString or any) leftOperand;
  
  // Comparison operator
  (">" or "<" or ">=" or "<=" or "==" or "!=" or "===" or "!==" or "&&" or "||" or "!" or "?" or "includes" or "startsWith" or "endsWith") operator;
  
  // Right operand - static value only (no functions)
  any rightOperand;
};

// Sort expression for array sorting (declarative only - follows Rule of Least Power)
dictionary SortCriteria {
  // Property name for sorting (no functions)
  DOMString sortBy;
  
  // Sort direction
  ("asc" or "desc") direction;
};
```

#### 2.5 Type Unions

```webidl
typedef (HTMLElementSpec or HTMLBodyElementSpec or HTMLHeadElementSpec or CustomElementSpec) ElementSpec;
typedef (HTMLElementSpec or HTMLBodyElementSpec or HTMLHeadElementSpec or CustomElementSpec or DocumentSpec or WindowSpec) DOMSpec;
```

#### 2.6 Web API Namespace Types

```webidl
// Request namespace for fetch API integration
dictionary RequestConfig {
  // Standard Request constructor properties
  required DOMString url;
  DOMString method;
  record<DOMString, DOMString> headers;
  any body;
  RequestMode mode;
  RequestCredentials credentials;
  RequestCache cache;
  RequestRedirect redirect;
  DOMString referrer;
  ReferrerPolicy referrerPolicy;
  DOMString integrity;
  boolean keepalive;
  any signal;
  
  // DDOM extensions
  boolean manual;
  long debounce;
  ("arrayBuffer" or "blob" or "formData" or "json" or "text") responseType;
};

// FormData namespace for form data construction
dictionary FormDataConfig {
  // Dynamic field mapping - any property name to any value
  // Supports File objects, Blob objects, and string values
};

// URLSearchParams namespace for URL parameter handling
dictionary URLSearchParamsConfig {
  // Dynamic parameter mapping - property names become parameter names
  // Values can be strings, numbers, or arrays for multi-value parameters
};

// Blob namespace for binary data creation
dictionary BlobConfig {
  required (DOMString or sequence<any>) content;
  DOMString type;
  ("transparent" or "native") endings;
};

// ArrayBuffer namespace for buffer management
dictionary ArrayBufferConfig {
  required (DOMString or sequence<octet> or Uint8Array or ArrayBuffer) data;
  DOMString encoding;
};

// ReadableStream namespace for stream creation
dictionary ReadableStreamConfig {
  ReadableStreamDefaultSource source;
  QueuingStrategy strategy;
  (DOMString or sequence<any>) data;
};

// Cookie namespace for browser cookie management
dictionary CookieConfig {
  required DOMString name;
  DOMString value;             // Initial value if cookie doesn't exist
  DOMString domain;
  DOMString path;
  (Date or DOMString) expires;
  long maxAge;
  boolean secure;
  ("strict" or "lax" or "none") sameSite;
};

// SessionStorage namespace for session storage management
dictionary SessionStorageConfig {
  required DOMString key;
  any value;                   // Initial value if key doesn't exist
};

// LocalStorage namespace for local storage management
dictionary LocalStorageConfig {
  required DOMString key;
  any value;                   // Initial value if key doesn't exist
};

// IndexedDB namespace for database operations
dictionary IndexedDBConfig {
  required DOMString database;
  required DOMString store;
  any key;
  any value;                   // Initial value if record doesn't exist
  long version;
};

// Namespace wrapper for Web API integrations
dictionary NamespaceWrapper {
  RequestConfig Request;
  FormDataConfig FormData;
  URLSearchParamsConfig URLSearchParams;
  BlobConfig Blob;
  ArrayBufferConfig ArrayBuffer;
  ReadableStreamConfig ReadableStream;
  CookieConfig Cookie;
  SessionStorageConfig SessionStorage;
  LocalStorageConfig LocalStorage;
  IndexedDBConfig IndexedDB;
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

#### 3.7 Dollar-Prefixed Reactive Properties

Dollar-prefixed properties are automatically converted to reactive signals and shared across component scope:

```javascript
{
  tagName: 'my-app',
  
  // Data values become State signals
  $count: 0,
  $message: 'Hello World',
  $isVisible: true,
  
  // Template literals become Computed signals
  $displayText: 'Count is ${this.$count.get()}',
  $status: '${this.$isVisible.get() ? "Visible" : "Hidden"}',
  
  // Functions are shared in scope but not wrapped in signals
  $increment: function() {
    this.$count.set(this.$count.get() + 1);
  },
  
  children: [{
    tagName: 'p',
    textContent: '${this.$displayText.get()}' // ← Signals available in child scope
  }, {
    tagName: 'button',
    textContent: 'Increment',
    onclick: function() {
      this.$increment(); // ← Shared function available here
    }
  }]
}
```

Signal access uses explicit `.get()` and `.set()` methods:
- `signal.get()` - Gets the current value
- `signal.set(value)` - Sets a new value (State signals only)
- Direct property access returns the signal object itself

#### 3.8 Template Literal Reactivity

Strings containing `${...}` expressions are automatically converted to reactive templates:

```javascript
{
  tagName: 'div',
  
  // Regular properties with templates create reactive DOM bindings
  textContent: 'Count is ${this.$count.get()}',
  className: 'status ${this.$count.get() > 10 ? "high" : "low"}',
  
  // Dollar-prefixed properties with templates become Computed signals
  $computedMessage: 'Hello ${this.$name.get()}!',
  
  attributes: {
    title: 'Current value: ${this.$count.get()}', // Reactive attribute
    'data-status': '${this.$isActive.get() ? "active" : "inactive"}'
  }
}
```

#### 3.9 Component Scoping

DDOM implements scope partitioning at custom element definition boundaries. Dollar-prefixed properties defined within custom element specifications create isolated component scopes:

```javascript
DDOM({
  $windowLevel: 'Global',  // Window-level scope

  // Define the todo-item custom element
  customElements: [{
    tagName: 'parent-component',
    $parentCount: 10,    // Scoped to parent-component
    $parentName: 'Parent',
    
    children: [{
      tagName: 'div',
      // Child elements inherit the component's scoped properties
      textContent: '${this.$parentName.get()}: ${this.$parentCount.get()}'
    }],
    
    // Nested custom element definitions create NEW isolated scopes
    customElements: [{
      tagName: 'nested-component', 
      $nestedCount: 100,   // Scoped ONLY to nested-component
      $nestedName: 'Nested',
      
      children: [{
        tagName: 'p',
        // Only has access to nested-component scope + window-level properties
        textContent: 'Nested: ${this.$nestedName.get()}: ${this.$nestedCount.get()}',
        // textContent: '${this.$parentCount.get()}' // ← This would FAIL - no access to parent scope
      }]
    }]
  }],
  
  document: {
    body: {
      children: [{
        tagName: 'parent-component',
        // Custom element instances can override default values
        $parentCount: 25,  // Overrides the default 10 for this instance
        
        children: [{
          tagName: 'nested-component',
          $nestedCount: 200  // Overrides the default 100 for this instance
        }]
      }]
    }
  }
});
```

**Scope Partitioning Rules:**

1. **Custom Element Definition Scope**: Each object within a `customElements` array creates an isolated scope containing only its own dollar-prefixed properties

2. **No Inheritance from Parent Contexts**: Custom element definitions do NOT inherit dollar-prefixed properties from the context where they are defined

3. **Child Element Inheritance**: Non-custom child elements within a component automatically inherit all dollar-prefixed properties from their parent component scope

4. **Window-Level Access**: All scopes can access window-level properties using explicit `window.$property` syntax

5. **Nested Component Isolation**: Custom elements defined within another custom element's `customElements` array are isolated from their parent's scope

6. **Instance Property Override**: When using custom elements, dollar-prefixed properties can be specified to override the component's default values

#### 3.10 Protected Properties

Certain DOM properties are protected from reactivity to maintain element identity:

```javascript
{
  tagName: 'div',     // ← Protected: Set once, never reactive
  id: 'unique-id',    // ← Protected: Maintains element identity
  $count: 0           // ← Reactive: Becomes a signal
}
```

Protected properties: `id`, `tagName`

#### 3.11 Dynamic Array Namespaces

Children can be defined using prototype-based array namespaces for dynamic list rendering, following the Rule of Least Power with declarative templates only:

```javascript
{
  tagName: 'todo-list',
  $todos: [
    { id: 1, text: 'Learn DDOM', completed: false },
    { id: 2, text: 'Build an app', completed: true }
  ],
  
  children: {
    prototype: 'Array',
    items: 'this.$todos',
    filter: [{ leftOperand: 'completed', operator: '===', rightOperand: false }],
    sort: [{ sortBy: 'text', direction: 'asc' }],
    map: {
      tagName: 'todo-item',
      $todoData: '${item}',       // Declarative template (no functions)
      $todoIndex: '${index}',     // Declarative template (no functions)
      textContent: '${this.$todoData.get().text}'
    }
  }
}
```

#### 3.12 Web API Namespaces

DDOM provides declarative access to Web APIs through prototype-based namespace properties. Each namespace creates reactive signals that wrap standard Web API constructors:

```javascript
{
  // Request namespace - reactive HTTP requests
  $apiData: {
    prototype: 'Request',
    url: '/api/users/${this.$userId.get()}',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ${this.$token.get()}'
      },
      debounce: 300 // Debounce rapid requests
    }
  },
  
  // FormData namespace - reactive form construction
  $uploadData: {
    prototype: 'FormData',
    file: '${this.$selectedFile.get()}',
    description: '${this.$description.get()}',
    timestamp: '${Date.now()}'
  },
  
  // URLSearchParams namespace - reactive URL parameters
  $queryParams: {
    prototype: 'URLSearchParams',
    q: '${this.$searchQuery.get()}',
    page: '${this.$currentPage.get()}',
    limit: 20
  },
  
  // Blob namespace - reactive binary data
  $csvFile: {
    prototype: 'Blob',
    content: '${this.$csvData.get()}',
    type: 'text/csv'
  },
  
  // ArrayBuffer namespace - reactive buffers
  $binaryData: {
    prototype: 'ArrayBuffer',
    data: '${this.$textInput.get()}' // UTF-8 encoded
  },
  
  // ReadableStream namespace - reactive streams
  $dataStream: {
    prototype: 'ReadableStream',
    data: '${this.$streamContent.get()}'
  },
  
  // Cookie namespace - reactive cookie management
  $userPrefs: {
    prototype: 'Cookie',
    name: 'userPreferences',
    value: '{"theme":"light","lang":"en"}',
    path: '/',
    maxAge: 86400
  },
  
  // SessionStorage namespace - reactive session data
  $sessionData: {
    prototype: 'SessionStorage',
    key: 'currentSession',
    value: { startTime: Date.now(), userId: null }
  },
  
  // LocalStorage namespace - reactive persistent settings
  $appSettings: {
    prototype: 'LocalStorage',
    key: 'appConfig',
    value: { 
      theme: 'light', 
      notifications: true 
    }
  },
  
  // IndexedDB namespace - reactive database operations
  $userData: {
    prototype: 'IndexedDB',
    database: 'UserDB',
    store: 'profiles',
    key: '${this.$userId.get()}',
    value: { 
      name: '', 
      email: '', 
      preferences: {} 
    }
  }
}
```

**Supported Namespaces:**
- `Request` - Fetch API integration with automatic reactivity
- `FormData` - Form data construction with File/Blob support
- `URLSearchParams` - URL parameter building with multi-value support
- `Blob` - Binary data creation with MIME type handling
- `ArrayBuffer` - Buffer management with automatic encoding
- `ReadableStream` - Stream creation with data sources
- `Cookie` - Browser cookie management with reactive updates (string values only)
- `SessionStorage` - Session storage key-value management with automatic serialization
- `LocalStorage` - Local storage key-value management with automatic serialization
- `IndexedDB` - IndexedDB database operations with async support

All namespaces support template literals and property accessors for reactive configuration, and automatically create computed signals that update when dependencies change.

#### 3.6.1 Storage API Automatic Serialization

The DDOM runtime provides automatic serialization for storage APIs that only support string values (`SessionStorage` and `LocalStorage`). This eliminates the need for manual JSON stringification and parsing in application code.

**Automatic Serialization Behavior:**

1. **Objects and Arrays**: Automatically serialized to JSON strings when stored
2. **Strings**: Stored as-is without additional processing
3. **Primitives** (numbers, booleans): Converted to JSON representation for consistency
4. **Retrieval**: Attempts JSON parsing first, returns as string if parsing fails

**Storage Priority:**
- Existing storage values take precedence over the `value` property
- The `value` property serves as the initial/default value when no storage exists

**Example with Automatic Serialization:**
```javascript
{
  // Object is automatically serialized to JSON
  $userSettings: {
    LocalStorage: {
      key: 'appSettings',
      value: { theme: 'dark', notifications: true }  // Auto-serialized
    }
  },
  
  // String values stored as-is
  $userToken: {
    SessionStorage: {
      key: 'authToken', 
      value: 'abc123'  // Stored as string
    }
  },
  
  onclick: () => {
    // Get returns deserialized object
    const settings = element.$userSettings.get();  // { theme: 'dark', notifications: true }
    
    // Set automatically serializes
    element.$userSettings.set({ ...settings, theme: 'light' });  // Auto-serialized to JSON
  }
}
```

**Cookie Storage Note:**
Cookies only support string values and do not use automatic serialization. Applications must manually handle JSON serialization for object storage in cookies:

```javascript
{
  $cookieData: {
    Cookie: {
      name: 'userPrefs',
      value: JSON.stringify({ theme: 'light' })  // Manual serialization required
    }
  }
}
```

### 4. Custom Elements

#### 4.1 Definition with Reactivity

Custom elements are defined in the `customElements` array and support full reactivity:

```javascript
{
  customElements: [
    {
      tagName: 'user-card',
      $userData: { name: 'Anonymous', avatar: '/default-avatar.png' },
      $isActive: false,
      
      style: {
        display: 'block',
        border: '1px solid #ccc',
        padding: '1rem',
        ':hover': {
          backgroundColor: '#f0f0f0'
        }
      },
      children: [
        {
          tagName: 'img',
          attributes: { 
            src: '${this.$userData.get().avatar}', 
            alt: 'User avatar' 
          }
        },
        {
          tagName: 'h3',
          textContent: '${this.$userData.get().name}',
          className: '${this.$isActive.get() ? "active" : "inactive"}'
        }
      ],
      connectedCallback: function() {
        // Access signals within lifecycle callbacks
        const name = this.getAttribute('name') || 'Anonymous';
        this.$userData.set({ ...this.$userData.get(), name });
      }
    }
  ]
}
```

#### 4.2 Usage with Signal Interaction

Once defined, custom elements can be used and their signals can be accessed:

```javascript
{
  tagName: 'div',
  children: [
    {
      tagName: 'user-card',
      attributes: { name: 'John Doe' },
      $userData: { name: 'John Doe', avatar: '/john-avatar.png' },
      $isActive: true
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
- Implements dollar-prefixed property reactivity with TC39 Signals
- Supports template literal processing for reactive binding
- Provides component-scoped signal isolation
- Handles prototype-based namespaces for dynamic list rendering and Web API integration