export default {
  customElements: [
    {
      tagName: 'card-with-slots',
      style: {
        display: 'block',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1.5em',
        margin: '1em 0',
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      },
      children: [
        {
          tagName: 'header',
          style: {
            borderBottom: '1px solid #eee',
            paddingBottom: '1em',
            marginBottom: '1em'
          },
          children: [
            {
              tagName: 'slot',
              attributes: { name: 'header' }
            }
          ]
        },
        {
          tagName: 'main',
          style: {
            marginBottom: '1em'
          },
          children: [
            {
              tagName: 'slot' // Default slot for main content
            }
          ]
        },
        {
          tagName: 'footer',
          style: {
            borderTop: '1px solid #eee',
            paddingTop: '1em',
            fontSize: '0.9em',
            color: '#666'
          },
          children: [
            {
              tagName: 'slot',
              attributes: { name: 'footer' }
            }
          ]
        }
      ]
    },
    {
      tagName: 'dialog-with-slots',
      style: {
        display: 'block',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        border: '2px solid #007bff',
        borderRadius: '8px',
        padding: '2em',
        minWidth: '300px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        zIndex: '1000'
      },
      children: [
        {
          tagName: 'div',
          className: 'dialog-header',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1em'
          },
          children: [
            {
              tagName: 'slot',
              attributes: { name: 'title' }
            },
            {
              tagName: 'button',
              textContent: '×',
              style: {
                background: 'none',
                border: 'none',
                fontSize: '1.5em',
                cursor: 'pointer',
                color: '#999'
              },
              onclick: function() {
                this.closest('dialog-with-slots').style.display = 'none';
              }
            }
          ]
        },
        {
          tagName: 'div',
          className: 'dialog-content',
          style: {
            marginBottom: '1em'
          },
          children: [
            {
              tagName: 'slot' // Default slot for dialog content
            }
          ]
        },
        {
          tagName: 'div',
          className: 'dialog-actions',
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5em'
          },
          children: [
            {
              tagName: 'slot',
              attributes: { name: 'actions' }
            }
          ]
        }
      ]
    },
    {
      tagName: 'navigation-menu',
      style: {
        display: 'block',
        background: '#2c3e50',
        padding: '1em',
        borderRadius: '4px'
      },
      children: [
        {
          tagName: 'div',
          className: 'menu-brand',
          style: {
            marginBottom: '1em',
            paddingBottom: '1em',
            borderBottom: '1px solid #34495e'
          },
          children: [
            {
              tagName: 'slot',
              attributes: { name: 'brand' }
            }
          ]
        },
        {
          tagName: 'nav',
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5em'
          },
          children: [
            {
              tagName: 'slot' // Default slot for navigation items
            }
          ]
        }
      ]
    }
  ],
  document: {
    body: {
      style: {
        fontFamily: 'Arial, sans-serif',
        padding: '2em',
        backgroundColor: '#f8f9fa',
        margin: '0'
      },
      children: [
        {
          tagName: 'h1',
          textContent: 'Slot Support Examples',
          style: { color: '#333', marginBottom: '2em' }
        },
        
        // Example 1: Card with slots
        {
          tagName: 'section',
          style: { marginBottom: '3em' },
          children: [
            {
              tagName: 'h2',
              textContent: 'Card with Header, Content, and Footer Slots',
              style: { marginBottom: '1em' }
            },
            {
              tagName: 'card-with-slots',
              children: [
                {
                  tagName: 'h3',
                  textContent: 'Product Review',
                  attributes: { slot: 'header' },
                  style: { margin: '0', color: '#007bff' }
                },
                {
                  tagName: 'p',
                  textContent: 'This product exceeded my expectations! The build quality is excellent and it works exactly as advertised.',
                  style: { lineHeight: '1.6' }
                },
                {
                  tagName: 'div',
                  children: [
                    {
                      tagName: 'span',
                      textContent: '⭐⭐⭐⭐⭐',
                      style: { marginRight: '0.5em' }
                    },
                    {
                      tagName: 'span',
                      textContent: '5/5 stars'
                    }
                  ]
                },
                {
                  tagName: 'small',
                  textContent: 'Reviewed by Jane Doe on March 15, 2024',
                  attributes: { slot: 'footer' }
                }
              ]
            }
          ]
        },
        
        // Example 2: Dialog with slots
        {
          tagName: 'section',
          style: { marginBottom: '3em' },
          children: [
            {
              tagName: 'h2',
              textContent: 'Dialog with Title, Content, and Action Slots',
              style: { marginBottom: '1em' }
            },
            {
              tagName: 'button',
              textContent: 'Show Dialog',
              style: {
                padding: '0.75em 1.5em',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              },
              onclick: function() {
                document.querySelector('dialog-with-slots').style.display = 'block';
              }
            },
            {
              tagName: 'dialog-with-slots',
              style: { display: 'none' },
              children: [
                {
                  tagName: 'h3',
                  textContent: 'Confirm Action',
                  attributes: { slot: 'title' },
                  style: { margin: '0', color: '#dc3545' }
                },
                {
                  tagName: 'p',
                  textContent: 'Are you sure you want to delete this item? This action cannot be undone.',
                  style: { margin: '0', lineHeight: '1.5' }
                },
                {
                  tagName: 'button',
                  textContent: 'Cancel',
                  attributes: { slot: 'actions' },
                  style: {
                    padding: '0.5em 1em',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginRight: '0.5em'
                  },
                  onclick: function() {
                    this.closest('dialog-with-slots').style.display = 'none';
                  }
                },
                {
                  tagName: 'button',
                  textContent: 'Delete',
                  attributes: { slot: 'actions' },
                  style: {
                    padding: '0.5em 1em',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  },
                  onclick: function() {
                    alert('Item deleted!');
                    this.closest('dialog-with-slots').style.display = 'none';
                  }
                }
              ]
            }
          ]
        },
        
        // Example 3: Navigation with brand and menu items
        {
          tagName: 'section',
          children: [
            {
              tagName: 'h2',
              textContent: 'Navigation with Brand and Menu Slots',
              style: { marginBottom: '1em' }
            },
            {
              tagName: 'navigation-menu',
              children: [
                {
                  tagName: 'h3',
                  textContent: 'My App',
                  attributes: { slot: 'brand' },
                  style: { 
                    margin: '0', 
                    color: '#ecf0f1',
                    fontSize: '1.5em'
                  }
                },
                {
                  tagName: 'a',
                  textContent: 'Dashboard',
                  attributes: { href: '#' },
                  style: {
                    color: '#bdc3c7',
                    textDecoration: 'none',
                    padding: '0.5em',
                    borderRadius: '4px',
                    ':hover': {
                      backgroundColor: '#34495e',
                      color: '#white'
                    }
                  }
                },
                {
                  tagName: 'a',
                  textContent: 'Products',
                  attributes: { href: '#' },
                  style: {
                    color: '#bdc3c7',
                    textDecoration: 'none',
                    padding: '0.5em',
                    borderRadius: '4px'
                  }
                },
                {
                  tagName: 'a',
                  textContent: 'Settings',
                  attributes: { href: '#' },
                  style: {
                    color: '#bdc3c7',
                    textDecoration: 'none',
                    padding: '0.5em',
                    borderRadius: '4px'
                  }
                },
                {
                  tagName: 'a',
                  textContent: 'Logout',
                  attributes: { href: '#' },
                  style: {
                    color: '#e74c3c',
                    textDecoration: 'none',
                    padding: '0.5em',
                    borderRadius: '4px'
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  }
}