// filepath: examples/reactive-custom-elements-new.js
// Updated to use new reactivity model without DSL syntax
export default {
  // Scoped & Reactive Properties - $ prefix makes properties reactive signals
  $todos: [
    { text: 'Learn Declarative DOM', completed: false },
    { text: 'Build awesome apps', completed: false },
    { text: 'Share with the world', completed: false }
  ],
  
  customElements: [
    {
      tagName: 'counter-widget',
      // Scoped & Reactive Properties
      $count: 0,
      $theme: 'light',
      style: {
        display: 'block',
        padding: '1em',
        border: '2px solid #ddd',
        borderRadius: '8px',
        margin: '1em 0',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        transition: 'all 0.3s ease',
        backgroundColor: '#ffffff',
        color: '#333333',
        '[data-theme="dark"]': {
          backgroundColor: '#2c2c2c',
          color: '#ffffff',
          borderColor: '#555'
        }
      },
      children: [
        {
          tagName: 'h3',
          // Template literals automatically get computed signals + effects
          textContent: 'Count: ${this.parentNode.$count.get()}',
          style: {
            margin: '0 0 1em 0',
            fontSize: '1.5em'
          }
        },
        {
          tagName: 'div',
          style: { marginBottom: '1em' },
          children: [
            {
              tagName: 'button',
              textContent: '-',
              style: {
                padding: '0.5em 1em',
                margin: '0 0.25em',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#ff4757',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.2em',
                ':hover': {
                  backgroundColor: '#ff3838'
                }
              },
              onclick: function (event) {
                const counterElement = event.target.parentNode.parentNode; // button -> div -> counter-widget
                if (counterElement && counterElement.tagName === 'COUNTER-WIDGET') {
                  console.log('[Counter] Decrementing count from:', counterElement.$count.get());
                  counterElement.$count.set(counterElement.$count.get() - 1);
                  console.log('[Counter] Count is now:', counterElement.$count.get());
                }
              }
            },
            {
              tagName: 'button',
              textContent: '+',
              style: {
                padding: '0.5em 1em',
                margin: '0 0.25em',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#2ed573',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1.2em',
                ':hover': {
                  backgroundColor: '#15a85a'
                }
              },
              onclick: function (event) {
                const counterElement = event.target.parentNode.parentNode; // button -> div -> counter-widget
                if (counterElement && counterElement.tagName === 'COUNTER-WIDGET') {
                  console.log('[Counter] Incrementing count from:', counterElement.$count.get());
                  counterElement.$count.set(counterElement.$count.get() + 1);
                  console.log('[Counter] Count is now:', counterElement.$count.get());
                }
              }
            }
          ]
        },
        {
          tagName: 'button',
          textContent: 'Toggle Theme',
          style: {
            padding: '0.5em 1em',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#5352ed',
            color: 'white',
            cursor: 'pointer',
            ':hover': {
              backgroundColor: '#3742fa'
            }
          },
          onclick: function (event) {
            const counterElement = event.target.parentNode; // button -> counter-widget
            if (counterElement && counterElement.tagName === 'COUNTER-WIDGET') {
              console.log('[Theme] Changing theme from:', counterElement.theme);
              const newTheme = counterElement.theme === 'light' ? 'dark' : 'light';
              counterElement.theme = newTheme;
              console.log('[Theme] Theme is now:', counterElement.theme);
              counterElement.setAttribute('data-theme', newTheme);
            }
          }
        },
        {
          tagName: 'p',
          textContent: 'Current theme: ${this.parentNode.theme.get()}',
          style: {
            margin: '1em 0 0 0',
            fontSize: '0.9em',
            opacity: '0.7'
          }
        }
      ],
    },
    {
      tagName: 'todo-item',
      item: {},
      index: 0,
      delete: function () {
        console.log('[TodoItem] Deleting item at index:', this.index);
        const rootElement = this.getRootNode() || document;
        const todos = rootElement.todos || window.todos;
        if (todos) {
          const currentTodos = Array.isArray(todos) ? todos : (todos.__getSignal ? todos.__getSignal().get() : []);
          const newTodos = currentTodos.toSpliced(this.index, 1);
          
          if (todos.__getSignal) {
            todos.__getSignal().set(newTodos);
          } else if (Array.isArray(window.todos)) {
            window.todos.splice(this.index, 1);
          }
        }
      },
      toggle: function (checked) {
        const index = this.index;
        console.log('[TodoItem] Toggling item at index:', index, 'to:', checked);
        
        const rootElement = this.getRootNode() || document;
        const todos = rootElement.todos || window.todos;
        if (todos) {
          const currentTodos = Array.isArray(todos) ? todos : (todos.__getSignal ? todos.__getSignal().get() : []);
          const newTodos = currentTodos.toSpliced(index, 1, {
            ...currentTodos[index],
            completed: checked
          });
          
          if (todos.__getSignal) {
            todos.__getSignal().set(newTodos);
          } else if (Array.isArray(window.todos)) {
            window.todos[index] = { ...window.todos[index], completed: checked };
          }
        }
      },
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.5em',
        margin: '0.25em 0',
        border: '1px solid #e1e1e1',
        borderRadius: '4px',
        backgroundColor: '#f9f9f9'
      },
      children: [
        {
          tagName: 'input',
          attributes: {
            type: 'checkbox',
            checked: '${this.parentNode.item.completed.get()}'
          },
          style: {
            marginRight: '0.5em'
          },
          onchange: function (event) {
            const todoItem = event.target.parentNode;
            if (todoItem && todoItem.toggle) {
              todoItem.toggle(event.target.checked);
            }
          }
        },
        {
          tagName: 'span',
          textContent: '${this.parentNode.item.text.get()}',
          style: {
            flex: '1',
            textDecoration: '${this.parentNode.item.completed.get() ? "line-through" : "none"}',
            color: '${this.parentNode.item.completed.get() ? "#888" : "#333"}'
          }
        },
        {
          tagName: 'button',
          textContent: '×',
          style: {
            marginLeft: '0.5em',
            padding: '0.25em 0.5em',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#ff4757',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.9em',
            ':hover': {
              backgroundColor: '#ff3838'
            }
          },
          onclick: function (event) {
            const todoItem = event.target.parentNode;
            if (todoItem && todoItem.delete) {
              todoItem.delete();
            }
          }
        }
      ]
    }
  ],

  document: {
    head: {
      children: [
        {
          tagName: 'title',
          textContent: 'Reactive Custom Elements - New Reactivity Model'
        }
      ]
    },
    body: {
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: '1.6',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '2em',
        backgroundColor: '#f8f9fa'
      },
      children: [
        {
          tagName: 'header',
          style: {
            textAlign: 'center',
            marginBottom: '2em'
          },
          children: [
            {
              tagName: 'h1',
              textContent: 'Reactive Custom Elements',
              style: {
                color: '#2c3e50',
                marginBottom: '0.5em'
              }
            },
            {
              tagName: 'p',
              textContent: 'Demonstrating the new reactivity model with transparent signal proxies',
              style: {
                color: '#7f8c8d',
                fontSize: '1.1em'
              }
            }
          ]
        },
        
        {
          tagName: 'section',
          style: {
            marginBottom: '2em'
          },
          children: [
            {
              tagName: 'h2',
              textContent: 'Interactive Counter Widget',
              style: {
                color: '#34495e',
                borderBottom: '2px solid #3498db',
                paddingBottom: '0.5em'
              }
            },
            {
              tagName: 'counter-widget'
            }
          ]
        },

        {
          tagName: 'section',
          children: [
            {
              tagName: 'h2',
              textContent: 'Dynamic Todo List',
              style: {
                color: '#34495e',
                borderBottom: '2px solid #3498db',
                paddingBottom: '0.5em'
              }
            },
            {
              tagName: 'div',
              style: {
                backgroundColor: 'white',
                padding: '1.5em',
                borderRadius: '8px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              },
              children: [
                {
                  tagName: 'div',
                  style: {
                    marginBottom: '1em'
                  },
                  children: [
                    {
                      tagName: 'input',
                      attributes: {
                        type: 'text',
                        placeholder: 'Add a new todo...',
                        id: 'new-todo-input'
                      },
                      style: {
                        padding: '0.5em',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        marginRight: '0.5em',
                        flex: '1'
                      }
                    },
                    {
                      tagName: 'button',
                      textContent: 'Add Todo',
                      style: {
                        padding: '0.5em 1em',
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        cursor: 'pointer',
                        ':hover': {
                          backgroundColor: '#2980b9'
                        }
                      },
                      onclick: function () {
                        const input = document.getElementById('new-todo-input');
                        const text = input.value.trim();
                        if (text) {
                          const rootElement = document.body;
                          const todos = rootElement.todos || window.todos;
                          if (todos) {
                            const currentTodos = Array.isArray(todos) ? todos : (todos.__getSignal ? todos.__getSignal().get() : []);
                            const newTodos = [...currentTodos, { text, completed: false }];
                            
                            if (todos.__getSignal) {
                              todos.__getSignal().set(newTodos);
                            } else if (Array.isArray(window.todos)) {
                              window.todos.push({ text, completed: false });
                            }
                          }
                          input.value = '';
                        }
                      }
                    }
                  ]
                },
                {
                  tagName: 'div',
                  id: 'todo-list',
                  // Using string address for array binding
                  items: 'this.parentNode.parentNode.todos',
                  children: {
                    tagName: 'todo-item',
                    item: (item) => item,
                    index: (item, index) => index
                  }
                }
              ]
            }
          ]
        },

        {
          tagName: 'footer',
          style: {
            textAlign: 'center',
            marginTop: '3em',
            padding: '2em 0',
            borderTop: '1px solid #e1e1e1',
            color: '#7f8c8d'
          },
          children: [
            {
              tagName: 'p',
              textContent: 'This example demonstrates the new reactivity model:'
            },
            {
              tagName: 'ul',
              style: {
                textAlign: 'left',
                display: 'inline-block',
                marginTop: '1em'
              },
              children: [
                {
                  tagName: 'li',
                  textContent: 'No more $-prefixed reactive properties'
                },
                {
                  tagName: 'li', 
                  textContent: 'Transparent signal proxies for seamless get/set syntax'
                },
                {
                  tagName: 'li',
                  textContent: 'Template literals automatically get computed signals + effects'
                },
                {
                  tagName: 'li',
                  textContent: 'String addresses for array binding ("this.parentNode.todos")'
                },
                {
                  tagName: 'li',
                  textContent: 'Property-level reactivity instead of component-level'
                }
              ]
            }
          ]
        }
      ]
    }
  }
};
