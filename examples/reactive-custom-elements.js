// filepath: /home/batonac/Development/declarative-dom/examples/reactive-custom-elements.js
export default {
  customElements: [
    {
      tagName: 'counter-widget',
      // Reactive field - prefixed with $ to make it reactive
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
        transition: 'all 0.3s ease'
      },
      children: [
        {
          tagName: 'h3',
          // This will be dynamic based on the reactive $count field
          get textContent() {
            return `Count: ${this.$count || 0}`;
          },
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
              onclick: function(event) {
                const button = event.target;
                const counterElement = button.closest('counter-widget');
                if (counterElement) {
                  counterElement.count--;
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
              onclick: function(event) {
                const counterElement = event.target.closest('counter-widget');
                if (counterElement) {
                  counterElement.count++;
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
          onclick: function(event) {
            const counterElement = event.target.closest('counter-widget');
            if (counterElement) {
              counterElement.theme = counterElement.theme === 'light' ? 'dark' : 'light';
            }
          }
        },
        {
          tagName: 'p',
          get textContent() {
            return `Current theme: ${this.$theme || 'light'}`;
          },
          style: {
            margin: '1em 0 0 0',
            fontSize: '0.9em',
            opacity: '0.7'
          }
        }
      ],
      // Connected callback to apply initial reactive styling
      connectedCallback: function(element) {
        this.updateTheme();
      },
      // Custom method to update theme-based styling
      updateTheme: function() {
        const isDark = this.theme === 'dark';
        this.style.backgroundColor = isDark ? '#2c2c2c' : '#ffffff';
        this.style.color = isDark ? '#ffffff' : '#333333';
        this.style.borderColor = isDark ? '#555' : '#ddd';
      }
    },
    {
      tagName: 'todo-list',
      // Reactive array for todo items
      $items: [
        { id: 1, text: 'Learn Declarative DOM', completed: false },
        { id: 2, text: 'Build awesome apps', completed: false },
        { id: 3, text: 'Share with the world', completed: false }
      ],
      $nextId: 4,
      style: {
        display: 'block',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1em',
        margin: '1em 0',
        backgroundColor: 'white'
      },
      children: [
        {
          tagName: 'h3',
          textContent: 'Reactive Todo List',
          style: { 
            margin: '0 0 1em 0',
            color: '#333'
          }
        },
        {
          tagName: 'div',
          style: { marginBottom: '1em' },
          children: [
            {
              tagName: 'input',
              type: 'text',
              placeholder: 'Add new todo...',
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
              textContent: 'Add',
              style: {
                padding: '0.5em 1em',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#007acc',
                color: 'white',
                cursor: 'pointer'
              },
              onclick: function(event) {
                const todoList = event.target.closest('todo-list');
                const input = event.target.previousElementSibling;
                if (todoList && input && input.value.trim()) {
                  const newItems = [...todoList.items];
                  newItems.push({
                    id: todoList.nextId,
                    text: input.value.trim(),
                    completed: false
                  });
                  todoList.items = newItems;
                  todoList.nextId = todoList.nextId + 1;
                  input.value = '';
                }
              }
            }
          ]
        },
        {
          tagName: 'div',
          // This will dynamically render todo items based on reactive $items
          get children() {
            const todoList = this.closest('todo-list');
            if (!todoList || !todoList.items) return [];
            
            return todoList.items.map(item => ({
              tagName: 'div',
              style: {
                display: 'flex',
                alignItems: 'center',
                padding: '0.5em',
                borderBottom: '1px solid #eee'
              },
              children: [
                {
                  tagName: 'input',
                  type: 'checkbox',
                  checked: item.completed,
                  style: { marginRight: '0.5em' },
                  onchange: function(event) {
                    const todoList = event.target.closest('todo-list');
                    if (todoList) {
                      const newItems = todoList.items.map(todo => 
                        todo.id === item.id 
                          ? { ...todo, completed: event.target.checked }
                          : todo
                      );
                      todoList.items = newItems;
                    }
                  }
                },
                {
                  tagName: 'span',
                  textContent: item.text,
                  style: {
                    flex: '1',
                    textDecoration: item.completed ? 'line-through' : 'none',
                    opacity: item.completed ? '0.6' : '1'
                  }
                },
                {
                  tagName: 'button',
                  textContent: '×',
                  style: {
                    border: 'none',
                    background: 'none',
                    color: '#ff4757',
                    cursor: 'pointer',
                    fontSize: '1.2em'
                  },
                  onclick: function(event) {
                    const todoList = event.target.closest('todo-list');
                    if (todoList) {
                      const newItems = todoList.items.filter(todo => todo.id !== item.id);
                      todoList.items = newItems;
                    }
                  }
                }
              ]
            }));
          }
        }
      ]
    }
  ],
  document: {
    body: {
      style: {
        fontFamily: 'system-ui, sans-serif',
        padding: '2em',
        backgroundColor: '#f8f9fa',
        margin: '0',
        lineHeight: '1.6'
      },
      children: [
        {
          tagName: 'h1',
          textContent: 'Reactive Custom Elements Example',
          style: { 
            color: '#333', 
            marginBottom: '1em',
            textAlign: 'center'
          }
        },
        {
          tagName: 'p',
          textContent: 'This example demonstrates reactive custom elements using the $ prefix for reactive properties. Changes to these properties automatically trigger re-renders.',
          style: {
            maxWidth: '600px',
            margin: '0 auto 2em',
            textAlign: 'center',
            color: '#666'
          }
        },
        { tagName: 'counter-widget' },
        { tagName: 'todo-list' },
        {
          tagName: 'div',
          style: {
            marginTop: '2em',
            padding: '1em',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #ddd'
          },
          children: [
            {
              tagName: 'h3',
              textContent: 'How It Works',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'ul',
              style: { color: '#666', lineHeight: '1.8' },
              children: [
                {
                  tagName: 'li',
                  textContent: 'Properties prefixed with $ become reactive signals'
                },
                {
                  tagName: 'li',
                  textContent: 'Changes to reactive properties trigger automatic re-renders'
                },
                {
                  tagName: 'li',
                  textContent: 'Getters can reference reactive properties for dynamic content'
                },
                {
                  tagName: 'li',
                  textContent: 'Event handlers can modify reactive state to update the UI'
                }
              ]
            }
          ]
        }
      ]
    }
  }
}