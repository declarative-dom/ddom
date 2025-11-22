/**
 * Slot Support Example
 * 
 * This example demonstrates how to use slots in DDOM custom elements
 * to create flexible, composable components.
 */

export default {
  customElements: [
    // Card component with default slot
    {
      tagName: 'example-card',
      style: {
        display: 'block',
        border: '2px solid #3b82f6',
        borderRadius: '12px',
        padding: '1.5em',
        margin: '1em 0',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      },
      children: [
        {
          tagName: 'div',
          style: {
            borderBottom: '1px solid #e5e7eb',
            marginBottom: '1em',
            paddingBottom: '0.5em'
          },
          children: [
            {
              tagName: 'h2',
              textContent: 'Card Title',
              style: {
                margin: '0',
                fontSize: '1.5em',
                color: '#1f2937'
              }
            }
          ]
        },
        {
          tagName: 'div',
          style: {
            color: '#4b5563',
            lineHeight: '1.6'
          },
          children: [
            {
              tagName: 'slot' // Default slot for card content
            }
          ]
        }
      ]
    },

    // Panel component with multiple named slots
    {
      tagName: 'example-panel',
      style: {
        display: 'block',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        overflow: 'hidden',
        margin: '1em 0',
        backgroundColor: 'white'
      },
      children: [
        {
          tagName: 'header',
          style: {
            backgroundColor: '#f3f4f6',
            padding: '1em',
            borderBottom: '1px solid #d1d5db'
          },
          children: [
            {
              tagName: 'slot',
              attributes: { name: 'header' },
              children: [
                {
                  tagName: 'h3',
                  textContent: 'Default Header',
                  style: { margin: '0' }
                }
              ]
            }
          ]
        },
        {
          tagName: 'main',
          style: {
            padding: '1em'
          },
          children: [
            {
              tagName: 'slot', // Default slot
              children: [
                {
                  tagName: 'p',
                  textContent: 'Default content goes here'
                }
              ]
            }
          ]
        },
        {
          tagName: 'footer',
          style: {
            backgroundColor: '#f9fafb',
            padding: '0.75em 1em',
            borderTop: '1px solid #d1d5db',
            fontSize: '0.875em',
            color: '#6b7280'
          },
          children: [
            {
              tagName: 'slot',
              attributes: { name: 'footer' },
              children: [
                {
                  tagName: 'span',
                  textContent: 'Default footer'
                }
              ]
            }
          ]
        }
      ]
    },

    // Button component with icon slot
    {
      tagName: 'example-button',
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5em',
        padding: '0.75em 1.5em',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1em',
        fontWeight: '500',
        ':hover': {
          backgroundColor: '#2563eb'
        }
      },
      children: [
        {
          tagName: 'button',
          style: {
            background: 'none',
            border: 'none',
            color: 'inherit',
            font: 'inherit',
            cursor: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5em'
          },
          children: [
            {
              tagName: 'slot',
              attributes: { name: 'icon' }
            },
            {
              tagName: 'slot',
              children: [
                {
                  tagName: 'span',
                  textContent: 'Click me'
                }
              ]
            }
          ]
        }
      ]
    }
  ],

  document: {
    body: {
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2em',
        backgroundColor: '#f9fafb',
        margin: '0'
      },
      children: [
        {
          tagName: 'h1',
          textContent: 'Slot Support Examples',
          style: {
            color: '#111827',
            marginBottom: '1.5em'
          }
        },

        // Example 1: Card with default slot
        {
          tagName: 'h2',
          textContent: '1. Card with Default Slot',
          style: { color: '#374151', marginTop: '2em' }
        },
        {
          tagName: 'example-card',
          children: [
            {
              tagName: 'p',
              textContent: 'This content is inserted into the default slot of the card component.'
            },
            {
              tagName: 'p',
              textContent: 'You can add multiple elements, and they will all be projected into the slot.'
            }
          ]
        },

        // Example 2: Card with no content (fallback)
        {
          tagName: 'h2',
          textContent: '2. Card with No Content (shows template)',
          style: { color: '#374151', marginTop: '2em' }
        },
        {
          tagName: 'example-card'
          // No children - template remains as-is
        },

        // Example 3: Panel with named slots
        {
          tagName: 'h2',
          textContent: '3. Panel with Named Slots',
          style: { color: '#374151', marginTop: '2em' }
        },
        {
          tagName: 'example-panel',
          children: [
            {
              tagName: 'h3',
              attributes: { slot: 'header' },
              textContent: 'Custom Header',
              style: { margin: '0', color: '#3b82f6' }
            },
            {
              tagName: 'p',
              textContent: 'This is the main content in the default slot.'
            },
            {
              tagName: 'ul',
              children: [
                {
                  tagName: 'li',
                  textContent: 'List item 1'
                },
                {
                  tagName: 'li',
                  textContent: 'List item 2'
                }
              ]
            },
            {
              tagName: 'div',
              attributes: { slot: 'footer' },
              children: [
                {
                  tagName: 'strong',
                  textContent: 'Custom footer:'
                },
                {
                  tagName: 'span',
                  textContent: ' Updated on 2024-01-15'
                }
              ]
            }
          ]
        },

        // Example 4: Panel with fallback content
        {
          tagName: 'h2',
          textContent: '4. Panel with Fallback Content',
          style: { color: '#374151', marginTop: '2em' }
        },
        {
          tagName: 'example-panel'
          // No children - fallback content will be shown
        },

        // Example 5: Button with icon slot
        {
          tagName: 'h2',
          textContent: '5. Button with Icon Slot',
          style: { color: '#374151', marginTop: '2em' }
        },
        {
          tagName: 'div',
          style: {
            display: 'flex',
            gap: '1em',
            flexWrap: 'wrap'
          },
          children: [
            {
              tagName: 'example-button',
              children: [
                {
                  tagName: 'span',
                  attributes: { slot: 'icon' },
                  textContent: '✓'
                },
                {
                  tagName: 'span',
                  textContent: 'Save'
                }
              ]
            },
            {
              tagName: 'example-button',
              children: [
                {
                  tagName: 'span',
                  attributes: { slot: 'icon' },
                  textContent: '✕'
                },
                {
                  tagName: 'span',
                  textContent: 'Cancel'
                }
              ]
            },
            {
              tagName: 'example-button'
              // No children - shows fallback "Click me"
            }
          ]
        }
      ]
    }
  }
}
