// New Reactivity Model - Dynamic List Example
// No more $-prefixed properties! Uses transparent signal proxies and template literals.

export default {

  // No more $ prefix! This is a transparent signal proxy
  items: ['Apple', 'Banana', 'Cherry'],

  addItem: function () {
    console.log('addItem called - this:', this);
    
    const newItem = prompt('Enter a new item:');
    if (newItem) {
      this.items.set([...this.items.get(), newItem]);
    }
  },

  removeItem: function (index) {
    // Transparent signal proxy allows normal array operations
    const items = this.items.get();
    if (index < 0 || index >= items.length) {
      console.error('Index out of bounds:', index);
      return;
    }
    console.log('removeItem called - index:', index, 'items:', items);
    const updatedItems = [...items].filter((_, i) => i !== index);
    console.log('Updated items after removal:', updatedItems);
    this.items.set(updatedItems);
  },

  updateItem: function (index, newText) {
    if (newText && newText.trim()) {
      const updatedItems = [...this.items.get()];
      updatedItems[index] = newText.trim();
      this.items.set(updatedItems);
    }
  },

  document: {
    body: {
      style: {
        fontFamily: 'Arial, sans-serif',
        padding: '2em',
        backgroundColor: '#f5f5f5',
        margin: '0'
      },
      children: [
        {
          tagName: 'h1',
          textContent: 'Dynamic List - New Reactivity Model',
          style: {
            color: '#333',
            textAlign: 'center',
            marginBottom: '0.5em'
          }
        },
        {
          tagName: 'p',
          textContent: 'No more $-prefixed properties! Template literals with \\${...} get automatic reactivity.',
          style: {
            textAlign: 'center',
            color: '#666',
            marginBottom: '2em',
            fontStyle: 'italic'
          }
        },
        {
          tagName: 'div',
          style: {
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '2em',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          children: [
            {
              tagName: 'button',
              textContent: 'Add Item',
              style: {
                padding: '0.75em 1.5em',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1em',
                marginBottom: '1em'
              },
              onclick: function () {
                window.addItem();
              }
            },
            {
              tagName: 'dynamic-list-items'
            }
          ]
        }
      ]
    }
  },

  customElements: [
    {
      tagName: 'dynamic-list-items',

      children: {
        // Use string address for signal resolution - much cleaner!
        items: 'items', // String address instead of function
        map: {
          tagName: 'dynamic-list-item',
          // These are also transparent signal proxies now
          item: (item, _index) => item,
          index: (item, index) => index,
        }
      },
      style: {
        display: 'block',
        padding: '0',
        margin: '1em 0'
      }
    },

    {
      tagName: 'dynamic-list-item',
      // item: '',
      // index: 0,

      children: [
        {
          tagName: 'li',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75em',
            margin: '0.5em 0',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6',
            listStyle: 'none'
          },
          children: [
            {
              tagName: 'span',
              // Template literal automatically gets computed signal + effect!
              textContent: '${this.parentNode.parentNode.item.get()}',
              contentEditable: true,
              style: {
                flex: '1',
                padding: '0.25em',
                borderRadius: '2px',
                outline: 'none',
                ':focus': {
                  outline: '2px solid #007bff',
                  backgroundColor: '#fff'
                }
              },
              onblur: function (_event) {
                const newText = this.textContent.trim();
                const listItem = this.parentNode.parentNode;
                const index = listItem.index.get();
                const originalItem = listItem.item.get();

                if (newText && newText !== originalItem) {
                  window.updateItem(index, newText);
                }
              },
              onkeydown: function (event) {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  this.blur(); // Trigger onblur to save
                }
                if (event.key === 'Escape') {
                  // Reset to original value
                  const listItem = this.parentNode.parentNode;
                  this.textContent = listItem.item.get();
                  this.blur();
                }
              }
            },
            {
              tagName: 'button',
              textContent: 'Remove',
              style: {
                padding: '0.25em 0.5em',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '0.875em'
              },
              onclick: function (_event) {
                const listItem = this.parentNode.parentNode;
                const index = listItem.index.get();
                if (confirm(`Are you sure you want to remove "${listItem.item.get()}"?`)) {
                  window.removeItem(index);
                }
              }
            }
          ]
        }
      ]
    }
  ],
}
