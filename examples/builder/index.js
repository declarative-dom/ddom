export default {
  // The declarative window object being built
  currentStructure: {
    document: {
      body: {
        style: {
          margin: '0',
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          backgroundColor: '#f5f5f5'
        },
        children: []
      }
    }
  },

  selectedElement: null,
  selectedPath: null,

  // Available element types
  elementTypes: [
    { name: 'Heading 1', tagName: 'h1', icon: 'H1' },
    { name: 'Heading 2', tagName: 'h2', icon: 'H2' },
    { name: 'Paragraph', tagName: 'p', icon: 'P' },
    { name: 'Button', tagName: 'button', icon: 'BTN' },
    { name: 'Div Container', tagName: 'div', icon: 'DIV' },
    { name: 'Input', tagName: 'input', icon: 'IN' },
    { name: 'Image', tagName: 'img', icon: 'IMG' },
    { name: 'Link', tagName: 'a', icon: 'A' }
  ],

  // Add element to the structure
  addElement: function(elementType) {
    const newElement = this.createDefaultElement(elementType);
    this.currentStructure.document.body.children.push(newElement);
    this.renderCanvas();
    this.updateElementList();
  },

  createDefaultElement: function(elementType) {
    const defaults = {
      h1: { textContent: 'Heading 1', style: { color: '#333', fontSize: '2em', margin: '0.5em 0' } },
      h2: { textContent: 'Heading 2', style: { color: '#555', fontSize: '1.5em', margin: '0.5em 0' } },
      p: { textContent: 'This is a paragraph.', style: { margin: '1em 0', lineHeight: '1.5' } },
      button: { textContent: 'Click Me', style: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' } },
      div: { style: { padding: '20px', border: '2px dashed #ccc', margin: '10px 0', minHeight: '50px' }, children: [] },
      input: { attributes: { type: 'text', placeholder: 'Enter text...' }, style: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } },
      img: { attributes: { src: 'https://via.placeholder.com/150x100', alt: 'Placeholder' }, style: { maxWidth: '100%', height: 'auto' } },
      a: { textContent: 'Link Text', attributes: { href: '#' }, style: { color: '#007bff', textDecoration: 'underline' } }
    };

    return {
      tagName: elementType.tagName,
      id: 'element-' + Date.now(),
      ...defaults[elementType.tagName],
      onclick: elementType.tagName !== 'div' ? this.selectElementHandler.bind(this) : undefined
    };
  },

  selectElementHandler: function(event) {
    event.preventDefault();
    event.stopPropagation();
    const elementId = event.target.id;
    this.selectElement(elementId);
  },

  selectElement: function(elementId) {
    const element = this.findElementById(elementId);
    if (element) {
      this.selectedElement = element;
      this.selectedPath = this.findElementPath(elementId);
      this.updatePropertiesPanel();
      this.highlightSelectedElement(elementId);
    }
  },

  findElementById: function(id, elements = this.currentStructure.document.body.children, path = []) {
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.id === id) {
        return element;
      }
      if (element.children && element.children.length > 0) {
        const found = this.findElementById(id, element.children, [...path, i]);
        if (found) return found;
      }
    }
    return null;
  },

  findElementPath: function(id, elements = this.currentStructure.document.body.children, path = []) {
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      if (element.id === id) {
        return [...path, i];
      }
      if (element.children && element.children.length > 0) {
        const found = this.findElementPath(id, element.children, [...path, i, 'children']);
        if (found) return found;
      }
    }
    return null;
  },

  updateProperty: function(property, value) {
    if (!this.selectedElement) return;

    if (property.startsWith('style.')) {
      const styleProp = property.replace('style.', '');
      if (!this.selectedElement.style) this.selectedElement.style = {};
      this.selectedElement.style[styleProp] = value;
    } else if (property.startsWith('attributes.')) {
      const attrProp = property.replace('attributes.', '');
      if (!this.selectedElement.attributes) this.selectedElement.attributes = {};
      this.selectedElement.attributes[attrProp] = value;
    } else {
      this.selectedElement[property] = value;
    }

    this.renderCanvas();
  },

  removeSelectedElement: function() {
    if (!this.selectedElement || !this.selectedPath) return;

    // Navigate to parent and remove element
    let current = this.currentStructure.document.body.children;
    for (let i = 0; i < this.selectedPath.length - 1; i++) {
      current = current[this.selectedPath[i]];
      if (this.selectedPath[i + 1] === 'children') {
        current = current.children;
        i++; // Skip the 'children' part
      }
    }
    
    current.splice(this.selectedPath[this.selectedPath.length - 1], 1);
    this.selectedElement = null;
    this.selectedPath = null;
    this.renderCanvas();
    this.updateElementList();
    this.updatePropertiesPanel();
  },

  exportStructure: function() {
    const dataStr = JSON.stringify(this.currentStructure, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'declarative-dom-structure.json';
    link.click();
    URL.revokeObjectURL(url);
  },

  renderCanvas: function() {
    const canvas = document.getElementById('canvas-area');
    if (!canvas) return;

    canvas.innerHTML = '';
    
    if (this.currentStructure.document.body.children.length === 0) {
      canvas.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">Drop elements here to start building</div>';
      return;
    }

    // Render each child element
    this.currentStructure.document.body.children.forEach(child => {
      const element = DDOM.buildElementTree(child);
      if (element) {
        canvas.appendChild(element);
      }
    });
  },

  updateElementList: function() {
    const list = document.getElementById('element-tree');
    if (!list) return;

    list.innerHTML = '';
    this.renderElementTree(this.currentStructure.document.body.children, list, 0);
  },

  renderElementTree: function(elements, container, depth) {
    elements.forEach((element, index) => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 4px 8px 4px ${depth * 20 + 8}px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        font-size: 14px;
      `;
      item.textContent = `${element.tagName}${element.id ? ` (#${element.id})` : ''}`;
      item.onclick = () => this.selectElement(element.id);
      
      // Highlight if selected
      if (this.selectedElement && this.selectedElement.id === element.id) {
        item.style.backgroundColor = '#e3f2fd';
        item.style.fontWeight = 'bold';
      }

      container.appendChild(item);

      if (element.children && element.children.length > 0) {
        this.renderElementTree(element.children, container, depth + 1);
      }
    });
  },

  updatePropertiesPanel: function() {
    const panel = document.getElementById('properties-content');
    if (!panel) return;

    if (!this.selectedElement) {
      panel.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">Select an element to edit properties</div>';
      return;
    }

    panel.innerHTML = `
      <div style="padding: 15px;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Properties for ${this.selectedElement.tagName}</h3>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">Text Content:</label>
          <input type="text" id="prop-textContent" value="${this.selectedElement.textContent || ''}" 
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
                 onchange="window.builderApp.updateProperty('textContent', this.value)">
        </div>

        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: bold;">ID:</label>
          <input type="text" id="prop-id" value="${this.selectedElement.id || ''}" 
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
                 onchange="window.builderApp.updateProperty('id', this.value)">
        </div>

        <h4 style="margin: 20px 0 10px 0; color: #555;">Styles</h4>
        
        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">Color:</label>
          <input type="color" value="${this.selectedElement.style?.color || '#000000'}" 
                 style="width: 100%; height: 35px; border: 1px solid #ccc; border-radius: 4px;"
                 onchange="window.builderApp.updateProperty('style.color', this.value)">
        </div>

        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">Background Color:</label>
          <input type="color" value="${this.selectedElement.style?.backgroundColor || '#ffffff'}" 
                 style="width: 100%; height: 35px; border: 1px solid #ccc; border-radius: 4px;"
                 onchange="window.builderApp.updateProperty('style.backgroundColor', this.value)">
        </div>

        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">Font Size:</label>
          <input type="text" value="${this.selectedElement.style?.fontSize || ''}" 
                 placeholder="e.g., 16px, 1.2em"
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
                 onchange="window.builderApp.updateProperty('style.fontSize', this.value)">
        </div>

        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">Padding:</label>
          <input type="text" value="${this.selectedElement.style?.padding || ''}" 
                 placeholder="e.g., 10px, 1rem"
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
                 onchange="window.builderApp.updateProperty('style.padding', this.value)">
        </div>

        <div style="margin-bottom: 10px;">
          <label style="display: block; margin-bottom: 5px;">Margin:</label>
          <input type="text" value="${this.selectedElement.style?.margin || ''}" 
                 placeholder="e.g., 10px, 1rem"
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;"
                 onchange="window.builderApp.updateProperty('style.margin', this.value)">
        </div>

        <div style="margin-top: 20px;">
          <button onclick="window.builderApp.removeSelectedElement()" 
                  style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%;">
            Delete Element
          </button>
        </div>
      </div>
    `;
  },

  highlightSelectedElement: function(elementId) {
    // Remove previous highlights
    document.querySelectorAll('[data-highlighted]').forEach(el => {
      el.style.outline = '';
      el.removeAttribute('data-highlighted');
    });

    // Highlight current selection
    const element = document.getElementById(elementId);
    if (element) {
      element.style.outline = '2px solid #007bff';
      element.setAttribute('data-highlighted', 'true');
    }
  },

  document: {
    body: {
      style: {
        margin: '0',
        padding: '0',
        fontFamily: 'Arial, sans-serif',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      },
      children: [
        // Header with export button
        {
          tagName: 'header',
          style: {
            backgroundColor: '#343a40',
            color: 'white',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          },
          children: [
            {
              tagName: 'h1',
              textContent: 'Declarative DOM Builder',
              style: { margin: '0', fontSize: '1.5em' }
            },
            {
              tagName: 'button',
              textContent: 'Export JSON',
              style: {
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              },
              onclick: function() { window.builderApp.exportStructure(); }
            }
          ]
        },

        // Main content area
        {
          tagName: 'div',
          style: {
            display: 'flex',
            flex: '1',
            height: 'calc(100vh - 70px)'
          },
          children: [
            // Left panel - Element palette
            {
              tagName: 'div',
              style: {
                width: '250px',
                backgroundColor: '#f8f9fa',
                borderRight: '1px solid #dee2e6',
                overflowY: 'auto'
              },
              children: [
                {
                  tagName: 'div',
                  style: {
                    padding: '15px',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: 'white'
                  },
                  children: [
                    {
                      tagName: 'h3',
                      textContent: 'Elements',
                      style: { margin: '0 0 10px 0', color: '#333' }
                    },
                    {
                      tagName: 'div',
                      id: 'element-palette'
                    }
                  ]
                },
                {
                  tagName: 'div',
                  style: {
                    padding: '15px'
                  },
                  children: [
                    {
                      tagName: 'h3',
                      textContent: 'Structure',
                      style: { margin: '0 0 10px 0', color: '#333' }
                    },
                    {
                      tagName: 'div',
                      id: 'element-tree',
                      style: {
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        backgroundColor: 'white',
                        minHeight: '200px'
                      }
                    }
                  ]
                }
              ]
            },

            // Center panel - Canvas
            {
              tagName: 'div',
              style: {
                flex: '1',
                backgroundColor: 'white',
                overflow: 'auto'
              },
              children: [
                {
                  tagName: 'div',
                  id: 'canvas-area',
                  style: {
                    minHeight: '100%',
                    padding: '20px'
                  }
                }
              ]
            },

            // Right panel - Properties
            {
              tagName: 'div',
              style: {
                width: '300px',
                backgroundColor: '#f8f9fa',
                borderLeft: '1px solid #dee2e6',
                overflowY: 'auto'
              },
              children: [
                {
                  tagName: 'div',
                  style: {
                    padding: '15px',
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: 'white'
                  },
                  children: [
                    {
                      tagName: 'h3',
                      textContent: 'Properties',
                      style: { margin: '0', color: '#333' }
                    }
                  ]
                },
                {
                  tagName: 'div',
                  id: 'properties-content'
                }
              ]
            }
          ]
        }
      ]
    }
  },

  onRender: function() {
    // Expose the builder globally
    window.builderApp = this;

    // Populate element palette
    const palette = document.getElementById('element-palette');
    if (palette) {
      this.elementTypes.forEach(elementType => {
        const button = document.createElement('button');
        button.style.cssText = `
          display: block;
          width: 100%;
          padding: 10px;
          margin-bottom: 8px;
          background: white;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          font-size: 14px;
        `;
        button.innerHTML = `<strong>${elementType.icon}</strong> ${elementType.name}`;
        button.onclick = () => this.addElement(elementType);
        
        // Hover effects
        button.onmouseover = () => button.style.backgroundColor = '#e9ecef';
        button.onmouseout = () => button.style.backgroundColor = 'white';
        
        palette.appendChild(button);
      });
    }

    // Initial render
    this.renderCanvas();
    this.updateElementList();
    this.updatePropertiesPanel();
  }
};