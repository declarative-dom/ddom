export default {
  items: ['Apple', 'Banana', 'Cherry'],
  addItem: function() {
    const newItem = prompt('Enter a new item:');
    if (newItem) {
      this.items.push(newItem);
      this.renderList();
    }
  },
  removeItem: function(index) {
    this.items.splice(index, 1);
    this.renderList();
  },
  renderList: function() {
    const listContainer = document.getElementById('list-container');
    if (listContainer) {
      listContainer.innerHTML = '';
      
      const ul = document.createElement('ul');
      ul.style.cssText = 'list-style: none; padding: 0; margin: 1em 0;';
      
      this.items.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 0.75em; margin: 0.5em 0; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #dee2e6;';
        
        const span = document.createElement('span');
        span.textContent = item;
        span.style.flex = '1';
        
        const button = document.createElement('button');
        button.textContent = 'Remove';
        button.style.cssText = 'padding: 0.25em 0.5em; background-color: #dc3545; color: white; border: none; border-radius: 3px; cursor: pointer; font-size: 0.875em;';
        button.onclick = () => this.removeItem(index);
        
        li.appendChild(span);
        li.appendChild(button);
        ul.appendChild(li);
      });
      
      listContainer.appendChild(ul);
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
              onclick: function() { window.addItem(); }
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
  onRender: function() {
    setTimeout(() => this.renderList(), 0);
  }
}