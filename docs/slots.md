# Slot Support in Custom Elements

DDOM supports the standard HTML `<slot>` element for custom element composition, allowing you to create reusable components with customizable content areas.

## Overview

Slots enable you to define placeholders in your custom element's template where users can insert their own content. This follows the [Web Components slot specification](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/slot) and supports both default and named slots.

## Basic Usage

### Default Slot

The simplest use case is a default (unnamed) slot that accepts any child content:

```javascript
import DDOM from '@declarative-dom/lib';

// Define a custom element with a default slot
DDOM({
  customElements: [{
    tagName: 'card-component',
    children: [
      {
        tagName: 'div',
        className: 'card-header',
        children: [
          {
            tagName: 'h2',
            textContent: 'Card Title'
          }
        ]
      },
      {
        tagName: 'div',
        className: 'card-body',
        children: [
          {
            tagName: 'slot' // Default slot
          }
        ]
      }
    ]
  }]
});

// Use the custom element with slotted content
DDOM({
  document: {
    body: {
      children: [
        {
          tagName: 'card-component',
          children: [
            {
              tagName: 'p',
              textContent: 'This content will be inserted into the slot!'
            }
          ]
        }
      ]
    }
  }
});
```

**Result:**
```html
<card-component>
  <div class="card-header">
    <h2>Card Title</h2>
  </div>
  <div class="card-body">
    <slot>
      <p>This content will be inserted into the slot!</p>
    </slot>
  </div>
</card-component>
```

## Named Slots

Named slots allow you to define multiple insertion points in your component template:

```javascript
DDOM({
  customElements: [{
    tagName: 'panel-component',
    children: [
      {
        tagName: 'header',
        children: [
          {
            tagName: 'slot',
            attributes: { name: 'header' }
          }
        ]
      },
      {
        tagName: 'main',
        children: [
          {
            tagName: 'slot' // Default slot
          }
        ]
      },
      {
        tagName: 'footer',
        children: [
          {
            tagName: 'slot',
            attributes: { name: 'footer' }
          }
        ]
      }
    ]
  }]
});

// Use the component with named slotted content
DDOM({
  document: {
    body: {
      children: [
        {
          tagName: 'panel-component',
          children: [
            {
              tagName: 'h1',
              attributes: { slot: 'header' }, // Goes to header slot
              textContent: 'Panel Header'
            },
            {
              tagName: 'p',
              textContent: 'Main content' // Goes to default slot (no slot attribute)
            },
            {
              tagName: 'small',
              attributes: { slot: 'footer' }, // Goes to footer slot
              textContent: 'Panel Footer'
            }
          ]
        }
      ]
    }
  }
});
```

**Result:**
```html
<panel-component>
  <header>
    <slot name="header">
      <h1 slot="header">Panel Header</h1>
    </slot>
  </header>
  <main>
    <slot>
      <p>Main content</p>
    </slot>
  </main>
  <footer>
    <slot name="footer">
      <small slot="footer">Panel Footer</small>
    </slot>
  </footer>
</panel-component>
```

## Fallback Content

Slots can contain fallback content that is displayed when no content is provided for that slot:

```javascript
DDOM({
  customElements: [{
    tagName: 'button-component',
    children: [
      {
        tagName: 'button',
        children: [
          {
            tagName: 'slot',
            children: [
              {
                tagName: 'span',
                textContent: 'Default Button Text' // Fallback content
              }
            ]
          }
        ]
      }
    ]
  }]
});

// Use without providing content - fallback will be shown
DDOM({
  document: {
    body: {
      children: [
        {
          tagName: 'button-component'
          // No children provided
        }
      ]
    }
  }
});

// Use with content - fallback will be replaced
DDOM({
  document: {
    body: {
      children: [
        {
          tagName: 'button-component',
          children: [
            {
              tagName: 'strong',
              textContent: 'Custom Button Text' // Replaces fallback
            }
          ]
        }
      ]
    }
  }
});
```

## Styling Slotted Content

You can style the slot container and the content within it:

```javascript
DDOM({
  customElements: [{
    tagName: 'styled-card',
    style: {
      ':host': {
        display: 'block',
        padding: '1em',
        border: '1px solid #ccc',
        borderRadius: '8px'
      },
      'slot': {
        display: 'block',
        padding: '1em',
        backgroundColor: '#f9f9f9'
      }
    },
    children: [
      {
        tagName: 'slot'
      }
    ]
  }]
});
```

## Best Practices

### 1. Use Descriptive Slot Names

```javascript
// Good
{ tagName: 'slot', attributes: { name: 'header' } }
{ tagName: 'slot', attributes: { name: 'footer' } }

// Less clear
{ tagName: 'slot', attributes: { name: 'slot1' } }
{ tagName: 'slot', attributes: { name: 'slot2' } }
```

### 2. Provide Meaningful Fallback Content

```javascript
// Good - helpful fallback
{
  tagName: 'slot',
  attributes: { name: 'avatar' },
  children: [
    {
      tagName: 'img',
      attributes: {
        src: '/default-avatar.png',
        alt: 'Default avatar'
      }
    }
  ]
}

// Less helpful
{
  tagName: 'slot',
  attributes: { name: 'avatar' }
  // No fallback
}
```

### 3. Document Your Slots

When creating reusable components, document what slots are available:

```javascript
/**
 * User Card Component
 * 
 * Slots:
 * - header: User's name and title
 * - avatar: User's profile picture
 * - (default): User's bio or description
 * - actions: Action buttons (edit, delete, etc.)
 */
DDOM({
  customElements: [{
    tagName: 'user-card',
    children: [
      { tagName: 'slot', attributes: { name: 'avatar' } },
      { tagName: 'slot', attributes: { name: 'header' } },
      { tagName: 'slot' }, // default
      { tagName: 'slot', attributes: { name: 'actions' } }
    ]
  }]
});
```

## Common Patterns

### Modal Dialog with Slots

```javascript
DDOM({
  customElements: [{
    tagName: 'modal-dialog',
    style: {
      ':host': {
        display: 'none',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '2em',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      },
      ':host([open])': {
        display: 'block'
      }
    },
    children: [
      {
        tagName: 'header',
        children: [
          { tagName: 'slot', attributes: { name: 'header' } }
        ]
      },
      {
        tagName: 'main',
        children: [
          { tagName: 'slot' }
        ]
      },
      {
        tagName: 'footer',
        children: [
          { tagName: 'slot', attributes: { name: 'actions' } }
        ]
      }
    ]
  }]
});
```

### List Item with Icon Slot

```javascript
DDOM({
  customElements: [{
    tagName: 'list-item',
    style: {
      ':host': {
        display: 'flex',
        alignItems: 'center',
        padding: '0.5em',
        gap: '0.5em'
      }
    },
    children: [
      {
        tagName: 'slot',
        attributes: { name: 'icon' }
      },
      {
        tagName: 'slot'
      }
    ]
  }]
});
```

## Limitations

Currently, DDOM's slot implementation:
- ✅ Supports default (unnamed) slots
- ✅ Supports named slots
- ✅ Supports fallback content
- ✅ Preserves DOM structure and event handlers
- ⚠️ Does not implement the Shadow DOM API (slotchange events, assignedNodes(), etc.)
- ⚠️ Works with light DOM (not shadow DOM) by default

For full Shadow DOM support with slots, consider using the browser's native custom elements API with DDOM for the declarative structure.

## See Also

- [Custom Elements Documentation](../README.md#custom-elements)
- [MDN: Using templates and slots](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots)
- [HTML Specification: The slot element](https://html.spec.whatwg.org/multipage/scripting.html#the-slot-element)
