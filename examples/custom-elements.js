export default {
  customElements: {
    'user-card': {
      tagName: 'div',
      style: {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1em',
        margin: '1em 0',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      },
      children: [
        {
          tagName: 'h3',
          textContent: 'User Name',
          style: { margin: '0 0 0.5em 0', color: '#333' }
        },
        {
          tagName: 'p',
          textContent: 'user@example.com',
          style: { margin: '0', color: '#666' }
        }
      ]
    },
    'todo-item': {
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
          style: { marginRight: '0.5em' }
        },
        {
          tagName: 'span',
          textContent: 'Sample todo item',
          style: { flex: '1' }
        }
      ]
    }
  },
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
          textContent: 'Custom Elements Example',
          style: { color: '#333', marginBottom: '1em' }
        },
        { tagName: 'user-card' },
        {
          tagName: 'div',
          style: {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '1em',
            marginTop: '2em'
          },
          children: [
            {
              tagName: 'h2',
              textContent: 'Todo List',
              style: { margin: '0 0 1em 0' }
            },
            { tagName: 'todo-item' },
            { tagName: 'todo-item' },
            { tagName: 'todo-item' }
          ]
        }
      ]
    }
  }
}