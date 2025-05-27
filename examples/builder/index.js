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

	customElements: [
		{
			tagName: 'property-field',
			children: [
				{
					tagName: 'div',
					style: {
						marginBottom: '15px',
						display: 'flex',
						flexDirection: 'column',
					},
					children: [
						{
							tagName: 'label',
							style: {
								display: 'block',
								marginBottom: '5px',
								fontWeight: 'bold'
							}
						},
						{
							tagName: 'input',
							style: {
								width: 'auto',
								padding: '8px',
								border: '1px solid #ccc',
								borderRadius: '4px'
							}
						}
					]
				}
			],
			connectedCallback: function (element) {
				const label = element.querySelector('label');
				const input = element.querySelector('input');
				const container = element.querySelector('div');

				if (label) {
					label.textContent = element.getAttribute('label') || '';
				}

				if (input) {
					const inputType = element.getAttribute('inputType') || 'text';
					input.type = inputType;
					input.value = element.getAttribute('value') || '';
					input.placeholder = element.getAttribute('placeholder') || '';

					// Special styling for color inputs
					if (inputType === 'color') {
						input.style.height = '35px';
						input.style.padding = '0';
						container.style.marginBottom = '10px';
						label.style.fontWeight = 'normal';
					}

					// Add change handler
					const property = element.getAttribute('property');
					input.onchange = function () {
						if (property && window.builderApp) {
							window.builderApp.updateProperty(property, this.value);
						}
					};
				}
			}
		},
		{
			tagName: 'palette-button',
			style: {
				display: 'block',
				padding: '10px',
				marginBottom: '8px',
				background: 'white',
				border: '1px solid #dee2e6',
				borderRadius: '4px',
				cursor: 'pointer',
				textAlign: 'left',
				fontSize: '14px',
				userSelect: 'none'
			},
			connectedCallback: function(element) {
				const icon = element.getAttribute('icon') || '';
				const name = element.getAttribute('name') || '';
				const elementType = JSON.parse(element.getAttribute('elementType') || '{}');
				
				// Use textContent to preserve styling instead of innerHTML
				element.textContent = `${icon} ${name}`;
				element.onclick = () => window.builderApp.addElement(elementType);
				
				// Make draggable
				element.draggable = true;
				element.ondragstart = (e) => {
					e.dataTransfer.setData('application/element-type', JSON.stringify(elementType));
					e.dataTransfer.effectAllowed = 'copy';
					element.style.opacity = '0.5';
				};
				
				element.ondragend = (e) => {
					element.style.opacity = '1';
				};
				
				// Hover effects
				element.onmouseover = () => element.style.backgroundColor = '#e9ecef';
				element.onmouseout = () => element.style.backgroundColor = 'white';
			}
		},
		{
			tagName: 'tree-item',
			style: {
				cursor: 'pointer',
				borderBottom: '1px solid #eee',
				fontSize: '14px',
				userSelect: 'none',
				position: 'relative'
			},
			connectedCallback: function(element) {
				const elementData = JSON.parse(element.getAttribute('elementData') || '{}');
				const index = parseInt(element.getAttribute('index') || '0');
				const depth = parseInt(element.getAttribute('depth') || '0');
				
				// Set padding based on depth
				element.style.padding = `4px 8px 4px ${depth * 20 + 8}px`;
				
				element.textContent = `${elementData.tagName}${elementData.id ? ` (#${elementData.id})` : ''}`;
				element.onclick = () => window.builderApp.selectElement(elementData.id);
				
				// Make item draggable
				element.draggable = true;
				element.dataset.elementId = elementData.id;
				element.dataset.elementIndex = index;
				element.dataset.elementDepth = depth;
				
				// Store reference for tree operations
				element._elementData = elementData;
				element._index = index;
				element._depth = depth;
				
				// Drag event handlers
				element.ondragstart = (e) => {
					e.dataTransfer.setData('text/plain', elementData.id);
					e.dataTransfer.effectAllowed = 'move';
					element.style.opacity = '0.5';
					window.builderApp.draggedElement = { 
						element: elementData, 
						index, 
						depth
					};
				};
				
				element.ondragend = (e) => {
					element.style.opacity = '1';
					window.builderApp.draggedElement = null;
					// Remove any drop indicators
					document.querySelectorAll('drop-indicator').forEach(el => el.remove());
				};
				
				element.ondragover = (e) => {
					e.preventDefault();
					e.dataTransfer.dropEffect = 'move';
					
					if (window.builderApp.draggedElement && window.builderApp.draggedElement.element.id !== elementData.id) {
						window.builderApp.showDropIndicator(element, e);
					}
				};
				
				element.ondragleave = (e) => {
					// Only remove indicator if leaving the item completely
					if (!element.contains(e.relatedTarget)) {
						window.builderApp.removeDropIndicator(element);
					}
				};
				
				element.ondrop = (e) => {
					e.preventDefault();
					window.builderApp.removeDropIndicator(element);
					
					if (window.builderApp.draggedElement && window.builderApp.draggedElement.element.id !== elementData.id) {
						// Find the elements array this item belongs to
						const elements = window.builderApp.findElementsArrayForTreeItem(element);
						window.builderApp.handleElementDrop(elementData, index, depth, elements, e);
					}
				};
				
				// Highlight if selected
				if (window.builderApp?.selectedElement && window.builderApp.selectedElement.id === elementData.id) {
					element.style.backgroundColor = '#e3f2fd';
					element.style.fontWeight = 'bold';
				}
			}
		},
		{
			tagName: 'drop-indicator',
			style: {
				position: 'absolute',
				left: '0',
				right: '0',
				height: '2px',
				backgroundColor: '#007bff',
				zIndex: '1000',
				pointerEvents: 'none'
			}
		},
		{
			tagName: 'canvas-drop-indicator',
			style: {
				position: 'absolute',
				left: '0',
				right: '0',
				height: '3px',
				backgroundColor: '#007bff',
				zIndex: '1000',
				pointerEvents: 'none',
				borderRadius: '1px'
			}
		},
		{
			tagName: 'inline-editor',
			children: [
				{
					tagName: 'input',
					type: 'text',
					style: {
						width: '100%',
						padding: '2px 4px',
						border: '2px solid #007bff',
						borderRadius: '3px',
						background: 'white',
						fontFamily: 'inherit',
						fontSize: 'inherit',
						fontWeight: 'inherit',
						color: 'inherit',
						outline: 'none',
						zIndex: '1001'
					}
				}
			],
			connectedCallback: function(element) {
				const input = element.querySelector('input');
				const originalText = element.getAttribute('originalText') || '';
				const dataElement = JSON.parse(element.getAttribute('dataElement') || '{}');
				
				input.value = originalText;
				input.focus();
				input.select();
				
				// Handle save/cancel
				const saveEdit = () => {
					const newText = input.value.trim();
					if (newText !== originalText && window.builderApp) {
						dataElement.textContent = newText;
						window.builderApp.updatePropertiesPanel();
					}
					element.parentElement.removeChild(element);
					element.parentElement.textContent = newText || originalText;
				};
				
				const cancelEdit = () => {
					element.parentElement.removeChild(element);
					element.parentElement.textContent = originalText;
				};
				
				// Event listeners
				input.onblur = saveEdit;
				input.onkeydown = (e) => {
					if (e.key === 'Enter') {
						e.preventDefault();
						saveEdit();
					} else if (e.key === 'Escape') {
						e.preventDefault();
						cancelEdit();
					}
				};
				
				// Prevent drag events while editing
				input.ondragstart = (e) => e.preventDefault();
			}
		}
	],

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
	addElement: function (elementType) {
		const newElement = this.createDefaultElement(elementType);
		this.currentStructure.document.body.children.push(newElement);
		this.renderCanvas();
		this.updateElementList();
	},

	createDefaultElement: function (elementType) {
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

	selectElementHandler: function (event) {
		event.preventDefault();
		event.stopPropagation();
		const elementId = event.target.id;
		this.selectElement(elementId);
	},

	selectElement: function (elementId) {
		const element = this.findElementById(elementId);
		if (element) {
			this.selectedElement = element;
			this.selectedPath = this.findElementPath(elementId);
			this.updatePropertiesPanel();
			this.highlightSelectedElement(elementId);
		}
	},

	findElementById: function (id, elements = this.currentStructure.document.body.children, path = []) {
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

	findElementPath: function (id, elements = this.currentStructure.document.body.children, path = []) {
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

	updateProperty: function (property, value) {
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

	removeSelectedElement: function () {
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

	exportStructure: function () {
		const dataStr = JSON.stringify(this.currentStructure, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);
		
		// Create download link using declarative DOM
		const link = DDOM.render({
			tagName: 'a',
			attributes: {
				href: url,
				download: 'declarative-dom-structure.json'
			},
			style: { display: 'none' }
		});
		
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	},

	renderCanvas: function () {
		const canvas = document.getElementById('canvas-area');
		if (!canvas) return;

		canvas.innerHTML = '';

		// Make canvas a drop target for new elements
		canvas.ondragover = (e) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = 'copy';
		};

		canvas.ondrop = (e) => {
			e.preventDefault();
			const elementType = e.dataTransfer.getData('application/element-type');
			if (elementType) {
				const type = JSON.parse(elementType);
				this.addElement(type);
			}
		};

		if (this.currentStructure.document.body.children.length === 0) {
			canvas.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">Drop elements here to start building</div>';
			return;
		}

		// Render each child element
		this.currentStructure.document.body.children.forEach((child, index) => {
			const element = DDOM.render(child);
			if (element) {
				// Add visual indicators for drag and drop
				element.style.position = 'relative';

				// Make rendered elements draggable for reordering
				element.draggable = true;
				element.dataset.canvasIndex = index;

				element.ondragstart = (e) => {
					e.stopPropagation();
					e.dataTransfer.effectAllowed = 'move';
					element.style.opacity = '0.5';
					this.draggedCanvasElement = { element: child, index };
				};

				element.ondragend = (e) => {
					element.style.opacity = '1';
					this.draggedCanvasElement = null;
					// Remove drop indicators
					canvas.querySelectorAll('.canvas-drop-indicator').forEach(el => el.remove());
				};

				element.ondragover = (e) => {
					e.preventDefault();
					e.stopPropagation();
					if (this.draggedCanvasElement && this.draggedCanvasElement.index !== index) {
						this.showCanvasDropIndicator(element, e);
					}
				};

				element.ondrop = (e) => {
					e.preventDefault();
					e.stopPropagation();
					if (this.draggedCanvasElement && this.draggedCanvasElement.index !== index) {
						this.handleCanvasElementDrop(index, e);
					}
				};

				// Add inline editing for text content
				if (child.textContent !== undefined && !['input', 'img'].includes(child.tagName)) {
					element.ondblclick = (e) => {
						e.preventDefault();
						e.stopPropagation();
						this.startInlineEdit(element, child);
					};

					// Add visual hint for editable elements
					element.style.cursor = 'text';
					element.title = 'Double-click to edit text';
				}

				canvas.appendChild(element);
			}
		});
	},

	showCanvasDropIndicator: function (element, event) {
		// Remove existing indicators
		document.querySelectorAll('.canvas-drop-indicator').forEach(el => el.remove());

		const rect = element.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		const isAbove = event.clientY < midY;

		const indicator = DDOM.render({
			tagName: 'canvas-drop-indicator'
		});

		if (isAbove) {
			indicator.style.top = '-2px';
			indicator.dataset.position = 'before';
		} else {
			indicator.style.bottom = '-2px';
			indicator.dataset.position = 'after';
		}

		element.appendChild(indicator);
	},

	handleCanvasElementDrop: function (targetIndex, event) {
		if (!this.draggedCanvasElement) return;

		const indicator = document.querySelector('.canvas-drop-indicator');
		const position = indicator ? indicator.dataset.position : 'after';

		let newIndex = targetIndex;
		if (position === 'after') {
			newIndex = targetIndex + 1;
		}

		const sourceIndex = this.draggedCanvasElement.index;
		const elements = this.currentStructure.document.body.children;

		// Remove from current position
		const movedElement = elements.splice(sourceIndex, 1)[0];

		// Adjust target index if moving within same container
		if (sourceIndex < newIndex) {
			newIndex--;
		}

		// Insert at new position
		elements.splice(newIndex, 0, movedElement);

		// Update displays
		this.renderCanvas();
		this.updateElementList();
		this.selectElement(movedElement.id);
	},

	findElementsArrayForTreeItem: function(treeItem) {
		// This would need to be implemented to find the parent elements array
		// For now, default to the main children array
		return this.currentStructure.document.body.children;
	},

	startInlineEdit: function (domElement, dataElement) {
		// Don't start editing if already editing
		if (domElement.querySelector('.inline-editor')) return;

		// Select the element first
		this.selectElement(dataElement.id);

		// Create input element
		const input = DDOM.render({
			tagName: 'inline-editor',
			attributes: {
				originalText: dataElement.textContent || '',
				dataElement: JSON.stringify(dataElement)
			}
		});

		// Store original text and hide it
		const originalText = domElement.textContent;
		domElement.textContent = '';

		// Add input to element
		domElement.appendChild(input);
	},

	updateElementList: function () {
		const list = document.getElementById('element-tree');
		if (!list) return;

		list.innerHTML = '';
		this.renderElementTree(this.currentStructure.document.body.children, list, 0);
	},

	renderElementTree: function (elements, container, depth) {
		elements.forEach((element, index) => {
			const item = DDOM.render({
				tagName: 'tree-item',
				attributes: {
					elementData: JSON.stringify(element),
					index: index.toString(),
					depth: depth.toString()
				}
			});

			container.appendChild(item);

			if (element.children && element.children.length > 0) {
				this.renderElementTree(element.children, container, depth + 1);
			}
		});
	},

	getParentPath: function (elements) {
		// Find the path to the parent container of these elements
		if (elements === this.currentStructure.document.body.children) {
			return [];
		}

		// This is a simplified approach - in a full implementation you'd want to track the full path
		return this.findElementsParentPath(elements);
	},

	findElementsParentPath: function (targetElements, elements = this.currentStructure.document.body.children, path = []) {
		for (let i = 0; i < elements.length; i++) {
			if (elements[i].children === targetElements) {
				return [...path, i, 'children'];
			}
			if (elements[i].children && elements[i].children.length > 0) {
				const found = this.findElementsParentPath(targetElements, elements[i].children, [...path, i, 'children']);
				if (found) return found;
			}
		}
		return [];
	},

	showDropIndicator: function (item, event) {
		this.removeDropIndicator(item);

		const rect = item.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		const isAbove = event.clientY < midY;

		const indicator = DDOM.render({
			tagName: 'drop-indicator'
		});

		if (isAbove) {
			indicator.style.top = '-1px';
			indicator.dataset.position = 'before';
		} else {
			indicator.style.bottom = '-1px';
			indicator.dataset.position = 'after';
		}

		item.appendChild(indicator);
	},

	removeDropIndicator: function (item) {
		const existing = item.querySelector('drop-indicator');
		if (existing) {
			existing.remove();
		}
	},

	handleElementDrop: function (targetElement, targetIndex, targetDepth, targetElements, event) {
		if (!this.draggedElement) return;

		const indicator = event.target.closest('div').querySelector('.drop-indicator');
		const position = indicator ? indicator.dataset.position : 'after';

		// Calculate new position
		let newIndex = targetIndex;
		if (position === 'after') {
			newIndex = targetIndex + 1;
		}

		// Remove element from current position
		const sourceElements = this.getElementsAtPath(this.draggedElement.parentPath);
		const movedElement = sourceElements.splice(this.draggedElement.index, 1)[0];

		// Adjust target index if moving within same container and after current position
		if (sourceElements === targetElements && this.draggedElement.index < newIndex) {
			newIndex--;
		}

		// Insert at new position
		targetElements.splice(newIndex, 0, movedElement);

		// Update the display
		this.renderCanvas();
		this.updateElementList();
		this.selectElement(movedElement.id); // Keep selection
	},

	getElementsAtPath: function (path) {
		if (path.length === 0) {
			return this.currentStructure.document.body.children;
		}

		let current = this.currentStructure.document.body.children;
		for (let i = 0; i < path.length; i++) {
			if (path[i] === 'children') {
				// Skip 'children' markers
				continue;
			}
			current = current[path[i]];
			if (i + 1 < path.length && path[i + 1] === 'children') {
				current = current.children;
				i++; // Skip the 'children' part
			}
		}
		return current;
	},

	updatePropertiesPanel: function () {
		const panel = document.getElementById('properties-content');
		if (!panel) return;

		panel.innerHTML = '';

		if (!this.selectedElement) {
			const emptyState = DDOM.render({
				tagName: 'div',
				style: { padding: '20px', textAlign: 'center', color: '#999' },
				textContent: 'Select an element to edit properties'
			});
			panel.appendChild(emptyState);
			return;
		}

		// Create properties container
		const container = DDOM.render({
			tagName: 'div',
			style: { padding: '15px' },
			children: [
				// Header
				{
					tagName: 'h3',
					textContent: `Properties for ${this.selectedElement.tagName}`,
					style: { margin: '0 0 15px 0', color: '#333' }
				},

				// Text Content field
				{
					tagName: 'property-field',
					attributes: {
						label: 'Text Content:',
						inputType: 'text',
						property: 'textContent',
						value: this.selectedElement.textContent || ''
					}
				},

				// ID field
				{
					tagName: 'property-field',
					attributes: {
						label: 'ID:',
						inputType: 'text',
						property: 'id',
						value: this.selectedElement.id || ''
					}
				},

				// Styles header
				{
					tagName: 'h4',
					textContent: 'Styles',
					style: { margin: '20px 0 10px 0', color: '#555' }
				},

				// Color field
				{
					tagName: 'property-field',
					attributes: {
						label: 'Color:',
						inputType: 'color',
						property: 'style.color',
						value: this.selectedElement.style?.color || '#000000'
					}
				},

				// Background Color field
				{
					tagName: 'property-field',
					attributes: {
						label: 'Background Color:',
						inputType: 'color',
						property: 'style.backgroundColor',
						value: this.selectedElement.style?.backgroundColor || '#ffffff'
					}
				},

				// Font Size field
				{
					tagName: 'property-field',
					attributes: {
						label: 'Font Size:',
						inputType: 'text',
						property: 'style.fontSize',
						value: this.selectedElement.style?.fontSize || '',
						placeholder: 'e.g., 16px, 1.2em'
					}
				},

				// Padding field
				{
					tagName: 'property-field',
					attributes: {
						label: 'Padding:',
						inputType: 'text',
						property: 'style.padding',
						value: this.selectedElement.style?.padding || '',
						placeholder: 'e.g., 10px, 1rem'
					}
				},

				// Margin field
				{
					tagName: 'property-field',
					attributes: {
						label: 'Margin:',
						inputType: 'text',
						property: 'style.margin',
						value: this.selectedElement.style?.margin || '',
						placeholder: 'e.g., 10px, 1rem'
					}
				},

				// Delete button
				{
					tagName: 'div',
					style: { marginTop: '20px' },
					children: [
						{
							tagName: 'button',
							textContent: 'Delete Element',
							style: {
								background: '#dc3545',
								color: 'white',
								border: 'none',
								padding: '8px 16px',
								borderRadius: '4px',
								cursor: 'pointer',
								width: '100%'
							},
							onclick: function () {
								window.builderApp.removeSelectedElement();
							}
						}
					]
				}
			]
		});

		panel.appendChild(container);
	},

	highlightSelectedElement: function (elementId) {
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
							onclick: function () { window.builderApp.exportStructure(); }
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
												minHeight: '200px',
												display: 'flex',
												flexDirection: 'column',
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

	onRender: function () {
		// Expose the builder globally
		window.builderApp = this;

		// Populate element palette
		const palette = document.getElementById('element-palette');
		if (palette) {
			this.elementTypes.forEach(elementType => {
				const button = DDOM.render({
					tagName: 'palette-button',
					attributes: {
						icon: elementType.icon,
						name: elementType.name,
						elementType: JSON.stringify(elementType)
					}
				});

				palette.appendChild(button);
			});
		}

		// Initial render
		this.renderCanvas();
		this.updateElementList();
		this.updatePropertiesPanel();
	}
};