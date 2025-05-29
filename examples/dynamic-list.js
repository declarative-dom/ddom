export default {
  items: ['Apple', 'Banana', 'Cherry'],
  addItem: function () {
    const newItem = prompt('Enter a new item:');
    if (newItem) {
      this.items.push(newItem);
      this.renderList();
    }
  },
  removeItem: function (index) {
    this.items.splice(index, 1);
    this.renderList();
  },
  renderList: function () {
    const listContainer = document.getElementById('list-container');
    if (listContainer) {
      listContainer.innerHTML = '';

      const listDescriptor = {
        tagName: 'ul',
        style: {
          listStyle: 'none',
          padding: '0',
          margin: '1em 0'
        },
        children: this.items.map((item, index) => ({
          tagName: 'li',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75em',
            margin: '0.5em 0',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          },
          children: [
            {
              tagName: 'span',
              textContent: item,
              contentEditable: true,
              style: {
                flex: '1',
                padding: '0.25em',
                borderRadius: '2px',
                ':focus': {
                  outline: '2px solid #007bff',
                  backgroundColor: '#fff'
                }
              },
              onblur: (event) => {
                const newText = event.target.textContent.trim();
                if (newText && newText !== item) {
                  this.items[index] = newText;
                } else if (!newText) {
                  event.target.textContent = item; // Restore original if empty
                }
              }
            },
            {
              tagName: 'button',
              id: `remove-button-${index}`,
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
              onclick: () => this.removeItem(index)
            }
          ]
        }))
      };

      DDOM.render(listDescriptor, listContainer);
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
                const newItem = prompt('Enter a new item:');
                if (newItem) {
                  // Find the example config object and call its addItem method
                  const exampleContainer = document.getElementById('example-container');
                  if (exampleContainer && exampleContainer.exampleConfig) {
                    exampleContainer.exampleConfig.items.push(newItem);
                    exampleContainer.exampleConfig.renderList();
                  }
                }
              }
            },
            {
              tagName: 'div',
              id: 'list-container'
            }
          ]
        }
      ]
    }
  },
  onRender: function () {
    // Store reference to this config on the container for access by event handlers
    const exampleContainer = document.getElementById('example-container');
    if (exampleContainer) {
      exampleContainer.exampleConfig = this;
    }
    setTimeout(() => this.renderList(), 0);
  }
}