export default {
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
          textContent: 'Dynamic List Example',
          style: {
            color: '#333',
            textAlign: 'center',
            marginBottom: '1em'
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
                this.nextElementSibling.addItem();
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

      // Reactive array using $ prefix
      $items: ['Apple', 'Banana', 'Cherry'],

      addItem: function () {
        // debug. what is this in this context?
        console.log('addItem called - this:', this);

        const newItem = prompt('Enter a new item:');
        if (newItem && this.$items?.get) {
          // Update the reactive array - this will automatically trigger re-render
          this.$items.set([...this.$items.get(), newItem]);
        }
      },

      removeItem: function (index) {
        if (this.$items?.get) {
          // Update the reactive array - this will automatically trigger re-render
          const currentItems = this.$items.get();
          this.$items.set(currentItems.filter((_, i) => i !== index));
        }
      },

      updateItem: function (index, newText) {
        if (newText && newText.trim() && this.$items?.get) {
          const currentItems = this.$items.get();
          const updatedItems = [...currentItems];
          updatedItems[index] = newText.trim();
          this.$items.set(updatedItems);
        }
      },

      children: {
        // Use DeclarativeArray syntax for reactive list rendering  
        items: (el) => el.$items,
        map: {
          tagName: 'dynamic-list-item',
          $item: (item, index) => item,
          $index: (item, index) => index,
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
      $item: {},
      $index: 0,

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
              textContent: '${this.parentNode.parentNode.$item}',
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
              onblur: function (event) {
                const newText = this.textContent.trim();
                const listItem = this.parentNode.parentNode;
                const index = listItem.$index.get();
                const originalItem = listItem.$item.get();

                if (newText && newText !== originalItem) {
                  listItem.parentNode.updateItem(index, newText);
                } else if (!newText) {
                  // Restore original if empty
                  this.textContent = originalItem;
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
                  this.textContent = listItem.$item.get();
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
              onclick: function (event) {
                const listItem = this.parentNode.parentNode;
                const index = listItem.$index.get();
                if (confirm(`Are you sure you want to remove "${listItem.$item.get()}"?`)) {
                  listItem.parentNode.removeItem(index);
                }
              }
            }
          ]
        }
      ]
    }
  ],
}