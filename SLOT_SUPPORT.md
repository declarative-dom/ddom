# Slot Support in Custom Elements

This document describes the slot functionality implemented for DDOM custom elements, allowing for flexible content composition.

## Overview

Slots enable custom elements to accept arbitrary content that gets placed in designated locations within the element's template. This implements the web standard `<slot>` element behavior for DDOM custom elements.

## Features

### 1. Default Slots

A default slot accepts any content that doesn't have a specific slot assignment:

```javascript
// Custom element definition with default slot
{
  tagName: 'my-card',
  children: [
    {
      tagName: 'h3',
      textContent: 'Card Title'
    },
    {
      tagName: 'slot' // Default slot
    },
    {
      tagName: 'p',
      textContent: 'Card Footer'
    }
  ]
}

// Usage with slotted content
{
  tagName: 'my-card',
  children: [
    {
      tagName: 'p',
      textContent: 'This content goes in the slot!'
    },
    {
      tagName: 'span',
      textContent: 'So does this!'
    }
  ]
}
```

### 2. Named Slots

Named slots allow you to specify exactly where different pieces of content should go:

```javascript
// Custom element with named slots
{
  tagName: 'my-layout',
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
}

// Usage with named slot content
{
  tagName: 'my-layout',
  children: [
    {
      tagName: 'h1',
      textContent: 'Page Title',
      attributes: { slot: 'header' }
    },
    {
      tagName: 'p',
      textContent: 'Main content goes here'
    },
    {
      tagName: 'small',
      textContent: 'Copyright notice',
      attributes: { slot: 'footer' }
    }
  ]
}
```

### 3. Mixed Default and Named Slots

You can combine default and named slots in the same component:

```javascript
{
  tagName: 'article-card',
  children: [
    {
      tagName: 'header',
      children: [
        {
          tagName: 'slot',
          attributes: { name: 'title' }
        }
      ]
    },
    {
      tagName: 'main',
      children: [
        {
          tagName: 'slot' // Default slot for main content
        }
      ]
    },
    {
      tagName: 'aside',
      children: [
        {
          tagName: 'slot',
          attributes: { name: 'sidebar' }
        }
      ]
    }
  ]
}
```

### 4. Nested Slots

Slots can be nested within any level of the component template hierarchy:

```javascript
{
  tagName: 'complex-widget',
  children: [
    {
      tagName: 'div',
      className: 'wrapper',
      children: [
        {
          tagName: 'div',
          className: 'inner',
          children: [
            {
              tagName: 'slot',
              attributes: { name: 'content' }
            }
          ]
        }
      ]
    }
  ]
}
```

## Slotless Components

Components without any `<slot>` elements are considered "slotless" and will ignore any instance children:

```javascript
// This component has no slots
{
  tagName: 'simple-badge',
  children: [
    {
      tagName: 'span',
      textContent: 'Badge Text'
    }
  ]
}

// These children will be ignored
{
  tagName: 'simple-badge',
  children: [
    {
      tagName: 'p',
      textContent: 'This will NOT appear'
    }
  ]
}
```

## Implementation Details

### Slot Processing

1. **Detection**: When a custom element instance is created, the system checks if the element template contains any `<slot>` elements
2. **Collection**: Instance children are collected before the template is processed
3. **Replacement**: Slot elements in the template are replaced with the appropriate instance children:
   - Default slots get children without a `slot` attribute
   - Named slots get children with a matching `slot` attribute
4. **Rendering**: The processed template is then rendered with the slotted content

### Backward Compatibility

- Existing custom elements without slots continue to work unchanged
- The slot feature is completely opt-in via the presence of `<slot>` elements
- No breaking changes to existing DDOM functionality

## Examples

See the test files for complete working examples:

- `examples/simple-slot-test.html` - Basic slot usage
- `examples/comprehensive-slot-test.html` - All slot scenarios
- `examples/regression-test.html` - Backward compatibility verification

## Browser Compatibility

This implementation works in all browsers that support:
- Custom Elements (Web Components)
- ES6 classes and modules
- The DDOM library requirements

The slot functionality is implemented at the DDOM level and does not rely on native Shadow DOM slots.