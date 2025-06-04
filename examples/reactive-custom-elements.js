// filepath: examples/reactive-custom-elements.js
export default {
  // Reactive properties prefixed with $ for automatic reactivity
  $todos: [
    { text: 'Learn Declarative DOM', completed: false },
    { text: 'Build awesome apps', completed: false },
    { text: 'Share with the world', completed: false }
  ],
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
          // Using Attribute Value Templates for dynamic content
          textContent: 'Count: {parentNode.$count}',
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
              console.log('[Theme] Changing theme from:', counterElement.$theme.get());
              const newTheme = counterElement.$theme.get() === 'light' ? 'dark' : 'light';
              counterElement.$theme.set(newTheme);
              console.log('[Theme] Theme is now:', counterElement.$theme.get());
              counterElement.setAttribute('data-theme', newTheme);
            }
          }
        },
        {
          tagName: 'p',
          textContent: 'Current theme: {parentNode.$theme}',
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
      $item: {},
      $index: 0,
      delete: function () {
        // Get current todos array, modify it, then set it back to trigger reactivity
        const currentTodos = window.$todos.get();
        currentTodos.splice(this.$index.get(), 1);
        window.$todos.set(currentTodos); // This triggers the signal update
      },
      toggle: function (checked) {
        // Get current todos array, modify the specific item, then set it back
        const currentTodos = window.$todos.get();
        currentTodos[this.$index.get()] = { ...currentTodos[this.$index.get()], completed: checked };
        window.$todos.set(currentTodos); // This triggers the signal update
      },
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
          checked: '{parentNode.$item.completed}',
          style: { marginRight: '0.5em' },
          onchange: function (event) {
            const todoItem = event.target.parentNode;
            if (todoItem && todoItem.toggle) {
              todoItem.toggle(event.target.checked);
            }
          }
        },
        {
          tagName: 'span',
          textContent: '{parentNode.$item.text}',
          style: {
            flex: '1',
            textDecoration: '{parentNode.$item.completed ? "line-through" : "none"}',
            opacity: '{parentNode.$item.completed ? "0.6" : "1"}'
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
          onclick: function (event) {
            const todoItem = event.target.parentNode;
            // debug
            console.log('Todo item:', todoItem);
            console.log('Deleting todo item:', todoItem.$item.get());
            console.log('Todo item index:', todoItem.$index.get());
            console.log('Todo item delete function:', todoItem.delete);
            if (todoItem && todoItem.delete) {
              // debug
              console.log('Calling delete on todo item:', todoItem.$item.get());
              todoItem.delete();
            }
          }
        }
      ]
    },
    {
      tagName: 'todo-list',
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
          id: 'todo-input-container',
          tagName: 'div',
          style: { marginBottom: '1em' },
          children: [
            {
              id: 'todo-input',
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
              onclick: function (event) {
                const todoList = event.target.parentNode.parentNode; // button -> div -> todo-list
                const input = event.target.previousElementSibling;
                if (todoList && todoList.tagName === 'TODO-LIST' && input && input.value.trim()) {
                  // Get current todos array, modify it, then set it back to trigger reactivity
                  const currentTodos = window.$todos.get();
                  currentTodos.push({
                    text: input.value.trim(),
                    completed: false
                  });
                  window.$todos.set(currentTodos); // This triggers the signal update
                  input.value = '';
                }
              }
            }
          ]
        },
        {
          id: 'todo-items',
          tagName: 'div',
          children: {
            items: () => window.$todos,
            map: {
              tagName: 'todo-item',
              $item: (item, index) => item,
              $index: (item, index) => index,
            }
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
          textContent: 'This example demonstrates reactive custom elements using the $ prefix for reactive properties and Attribute Value Templates for dynamic content. Changes to reactive properties automatically trigger re-renders.',
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
                  textContent: 'Attribute Value Templates ({property}) enable dynamic content'
                },
                {
                  tagName: 'li',
                  textContent: 'ArrayExprs provide data-driven list rendering'
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