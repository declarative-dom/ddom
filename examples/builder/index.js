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
	isDraggingNewElement: false,
	draggedCanvasElement: null,

	customElements: [
		{
			tagName: 'property-field',
			children: [
				{
					tagName: 'div',
					id: 'property-container',
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
			connectedCallback: function () {
				const label = this.querySelector('label');
				const input = this.querySelector('input');
				const container = this.querySelector('div');

				if (label) {
					label.textContent = this.getAttribute('label') || '';
				}

				if (input) {
					const inputType = this.getAttribute('inputType') || 'text';
					input.type = inputType;
					input.value = this.getAttribute('value') || '';
					input.placeholder = this.getAttribute('placeholder') || '';

					// Special styling for color inputs
					if (inputType === 'color') {
						input.style.height = '35px';
						input.style.padding = '0';
						container.style.marginBottom = '10px';
						label.style.fontWeight = 'normal';
					}

					// Add change handler
					const property = this.getAttribute('property');
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
			connectedCallback: function () {
				const icon = this.getAttribute('icon') || '';
				const name = this.getAttribute('name') || '';
				const elementType = JSON.parse(this.getAttribute('elementType') || '{}');

				// Use textContent to preserve styling instead of innerHTML
				this.textContent = `${icon} ${name}`;
				this.onclick = () => window.builderApp.addElement(elementType);

				// Make draggable
				this.draggable = true;
				this.ondragstart = (e) => {
					e.dataTransfer.setData('application/element-type', JSON.stringify(elementType));
					e.dataTransfer.setData('text/plain', 'new-element');
					e.dataTransfer.effectAllowed = 'copy';
					this.style.opacity = '0.5';
					// Clear any existing dragged element - this signals it's a new element
					window.builderApp.draggedCanvasElement = null;
					window.builderApp.isDraggingNewElement = true;
				};

				this.ondragend = (_e) => {
					this.style.opacity = '1';
					window.builderApp.isDraggingNewElement = false;
					window.builderApp.clearAllDropIndicators();
				};

				// Hover effects
				this.onmouseover = () => this.style.backgroundColor = '#e9ecef';
				this.onmouseout = () => this.style.backgroundColor = 'white';
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
			connectedCallback: function () {
				const elementData = JSON.parse(this.getAttribute('elementData') || '{}');
				const index = parseInt(this.getAttribute('index') || '0');
				const depth = parseInt(this.getAttribute('depth') || '0');

				// Set padding based on depth
				this.style.padding = `4px 8px 4px ${depth * 20 + 8}px`;

				this.textContent = `${elementData.tagName}${elementData.id ? ` (#${elementData.id})` : ''}`;
				this.onclick = () => window.builderApp.selectElement(elementData.id);

				// Make item draggable
				this.draggable = true;
				this.dataset.elementId = elementData.id;
				this.dataset.elementIndex = index;
				this.dataset.elementDepth = depth;

				// Store reference for tree operations
				this._elementData = elementData;
				this._index = index;
				this._depth = depth;

				// Drag event handlers
				this.ondragstart = (e) => {
					e.dataTransfer.setData('text/plain', elementData.id);
					e.dataTransfer.effectAllowed = 'move';
					this.style.opacity = '0.5';
					window.builderApp.draggedElement = {
						element: elementData,
						index,
						depth
					};
				};

				this.ondragend = (_e) => {
					this.style.opacity = '1';
					window.builderApp.draggedElement = null;
					// Remove any drop indicators
					document.querySelectorAll('drop-indicator').forEach(el => el.remove());
				};

				this.ondragover = (e) => {
					e.preventDefault();
					e.dataTransfer.dropEffect = 'move';

					if (window.builderApp.draggedElement && window.builderApp.draggedElement.element.id !== elementData.id) {
						window.builderApp.showDropIndicator(this, e);
					}
				};

				this.ondragleave = (e) => {
					// Only remove indicator if leaving the item completely
					if (!this.contains(e.relatedTarget)) {
						window.builderApp.removeDropIndicator(this);
					}
				};

				this.ondrop = (e) => {
					e.preventDefault();
					window.builderApp.removeDropIndicator(this);

					if (window.builderApp.draggedElement && window.builderApp.draggedElement.element.id !== elementData.id) {
						// Find the elements array this item belongs to
						const elements = window.builderApp.findElementsArrayForTreeItem(this);
						window.builderApp.handleElementDrop(elementData, index, depth, elements, e);
					}
				};

				// Highlight if selected
				if (window.builderApp?.selectedElement && window.builderApp.selectedElement.id === elementData.id) {
					this.style.backgroundColor = '#e3f2fd';
					this.style.fontWeight = 'bold';
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
			connectedCallback: function () {
				const input = this.querySelector('input');
				const originalText = this.getAttribute('originalText') || '';
				const dataElement = JSON.parse(this.getAttribute('dataElement') || '{}');

				input.value = originalText;
				input.focus();
				input.select();

				const self = this;

				// Handle save/cancel
				const saveEdit = () => {
					const newText = input.value.trim();
					if (newText !== originalText && window.builderApp) {
						dataElement.textContent = newText;
						window.builderApp.updatePropertiesPanel();
					}
					self.parentElement.removeChild(self);
					self.parentElement.textContent = newText || originalText;
				};

				const cancelEdit = () => {
					self.parentElement.removeChild(self);
					self.parentElement.textContent = originalText;
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
		{ name: 'Section', tagName: 'section', icon: 'SEC' },
		{ name: 'Input', tagName: 'input', icon: 'IN' },
		{ name: 'Image', tagName: 'img', icon: 'IMG' },
		{ name: 'Link', tagName: 'a', icon: 'A' }
	],

	// Add element to the structure
	addElement: function (elementType) {
		const newElement = this.createDefaultElement(elementType);
		this.currentStructure.document.body.children.push(newElement);
		this.createElementCanvas();
		this.updateElementList();
	},

	createDefaultElement: function (elementType) {
		const defaults = {
			h1: { textContent: 'Heading 1', style: { color: '#333', fontSize: '2em', margin: '0.5em 0' } },
			h2: { textContent: 'Heading 2', style: { color: '#555', fontSize: '1.5em', margin: '0.5em 0' } },
			p: { textContent: 'This is a paragraph.', style: { margin: '1em 0', lineHeight: '1.5' } },
			button: { textContent: 'Click Me', style: { padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' } },
			div: { textContent: 'Container', style: { padding: '20px', border: '2px dashed #ccc', margin: '10px 0', minHeight: '50px', position: 'relative' }, children: [] },
			section: { textContent: 'Section', style: { padding: '20px', border: '1px solid #ddd', margin: '10px 0', minHeight: '60px', position: 'relative' }, children: [] },
			input: { attributes: { type: 'text', placeholder: 'Enter text...' }, style: { padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } },
			img: { attributes: { src: 'https://via.placeholder.com/150x100', alt: 'Placeholder' }, style: { maxWidth: '100%', height: 'auto' } },
			a: { textContent: 'Link Text', attributes: { href: '#' }, style: { color: '#007bff', textDecoration: 'underline' } }
		};

		return {
			tagName: elementType.tagName,
			id: 'element-' + Date.now(),
			...defaults[elementType.tagName],
			onclick: this.selectElementHandler.bind(this)
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

		this.createElementCanvas();
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
		this.createElementCanvas();
		this.updateElementList();
		this.updatePropertiesPanel();
	},

	exportStructure: function () {
		const dataStr = JSON.stringify(this.currentStructure, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		// Create download link using declarative DOM
		const link = window.DDOM.createElement({
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

	// Shadow DOM for isolated canvas styles
	canvasShadowRoot: null,

	createElementCanvas: function () {
		const canvasHost = document.getElementById('canvas-area');
		if (!canvasHost) return;

		// Initialize shadow root if not already done
		if (!this.canvasShadowRoot) {
			this.canvasShadowRoot = canvasHost.attachShadow({ mode: 'open' });
		}

		// Clear existing content
		this.canvasShadowRoot.innerHTML = '';

		// Create an isolated stylesheet for the shadow DOM
		const style = document.createElement('style');
		style.textContent = `
			:host {
				display: block;
				min-height: 100%;
				padding: 20px;
				box-sizing: border-box;
			}
			.empty-state {
				text-align: center;
				color: #999;
				padding: 40px;
			}
			.canvas-drop-indicator {
				position: absolute;
				left: 0;
				right: 0;
				height: 3px;
				background-color: #007bff;
				z-index: 1000;
				pointer-events: none;
				border-radius: 1px;
			}
			.container-drop-indicator {
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				border: 3px dashed #007bff;
				background-color: rgba(0, 123, 255, 0.1);
				z-index: 1000;
				pointer-events: none;
				border-radius: 4px;
				display: flex;
				align-items: center;
				justify-content: center;
				color: #007bff;
				font-weight: bold;
				font-size: 14px;
			}
		`;
		this.canvasShadowRoot.appendChild(style);

		// Make canvas a drop target for new elements
		canvasHost.ondragover = (e) => {
			e.preventDefault();
			if (this.isDraggingNewElement) {
				e.dataTransfer.dropEffect = 'copy';
			} else {
				e.dataTransfer.dropEffect = 'move';
			}
		};

		canvasHost.ondragleave = (e) => {
			// Clear indicators when leaving canvas entirely
			if (!canvasHost.contains(e.relatedTarget) && !this.canvasShadowRoot.contains(e.relatedTarget)) {
				this.clearAllDropIndicators();
			}
		};

		canvasHost.ondrop = (e) => {
			e.preventDefault();
			this.clearAllDropIndicators();
			const elementType = e.dataTransfer.getData('application/element-type');
			if (elementType) {
				const type = JSON.parse(elementType);
				this.addElement(type);
			}
		};

		if (this.currentStructure.document.body.children.length === 0) {
			const emptyState = document.createElement('div');
			emptyState.className = 'empty-state';
			emptyState.textContent = 'Drop elements here to start building';
			this.canvasShadowRoot.appendChild(emptyState);
			return;
		}

		// Create each child element with inline styles for shadow DOM isolation
		this.currentStructure.document.body.children.forEach((child, index) => {
			// Ensure the element has an ID
			if (!child.id) {
				child.id = 'element-' + Date.now() + '-' + index;
			}

			// Create element with inline styles (bypasses global stylesheet)
			const element = this.createCanvasElement(child);
			if (element) {
				this.setupElementDragAndDrop(element, child, index, []);
				this.canvasShadowRoot.appendChild(element);
			}
		});
	},

	// Creates an element for the canvas with inline styles (no global CSS pollution)
	createCanvasElement: function (spec) {
		const el = document.createElement(spec.tagName);

		// Set ID
		if (spec.id) {
			el.id = spec.id;
		}

		// Apply styles inline
		if (spec.style) {
			for (const [key, value] of Object.entries(spec.style)) {
				if (typeof value === 'string') {
					el.style[key] = value;
				}
			}
		}

		// Apply text content
		if (spec.textContent !== undefined) {
			el.textContent = spec.textContent;
		}

		// Apply attributes
		if (spec.attributes) {
			for (const [key, value] of Object.entries(spec.attributes)) {
				el.setAttribute(key, value);
			}
		}

		// Recursively create children
		if (spec.children && Array.isArray(spec.children)) {
			spec.children.forEach((child, childIndex) => {
				if (!child.id) {
					child.id = 'element-' + Date.now() + '-' + childIndex;
				}
				const childEl = this.createCanvasElement(child);
				if (childEl) {
					el.appendChild(childEl);
				}
			});
		}

		return el;
	},

	showCanvasDropIndicator: function (element, event) {
		// Remove all existing indicators first
		this.clearAllDropIndicators();

		const rect = element.getBoundingClientRect();
		const midY = rect.top + rect.height / 2;
		const isAbove = event.clientY < midY;

		const indicator = document.createElement('div');
		indicator.className = 'canvas-drop-indicator';
		indicator.style.cssText = `
			position: absolute;
			left: 0;
			right: 0;
			height: 3px;
			background-color: #007bff;
			z-index: 1000;
			pointer-events: none;
			border-radius: 1px;
		`;

		if (isAbove) {
			indicator.style.top = '-2px';
			indicator.dataset.position = 'before';
		} else {
			indicator.style.bottom = '-2px';
			indicator.dataset.position = 'after';
		}

		element.appendChild(indicator);
	},

	handleCanvasElementDrop: function (targetIndex, _event) {
		if (!this.draggedCanvasElement) return;

		// Check shadow DOM first, then document
		let indicator = this.canvasShadowRoot?.querySelector('.canvas-drop-indicator');
		if (!indicator) {
			indicator = document.querySelector('.canvas-drop-indicator');
		}
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
		this.createElementCanvas();
		this.updateElementList();
		this.selectElement(movedElement.id);
	},

	findElementsArrayForTreeItem: function (_treeItem) {
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
		const input = window.DDOM.createElement({
			tagName: 'inline-editor',
			attributes: {
				originalText: dataElement.textContent || '',
				dataElement: JSON.stringify(dataElement)
			}
		}, { css: false });

		// Store original text and hide it
		const _originalText = domElement.textContent;
		domElement.textContent = '';

		// Add input to element
		domElement.appendChild(input);
	},

	updateElementList: function () {
		const list = document.getElementById('element-tree');
		if (!list) return;

		list.innerHTML = '';
		this.createElementElementTree(this.currentStructure.document.body.children, list, 0);
	},

	createElementElementTree: function (elements, container, depth) {
		elements.forEach((element, index) => {
			const item = window.DDOM.createElement({
				tagName: 'tree-item',
				attributes: {
					elementData: JSON.stringify(element),
					index: index.toString(),
					depth: depth.toString()
				}
			});

			container.appendChild(item);

			if (element.children && element.children.length > 0) {
				this.createElementElementTree(element.children, container, depth + 1);
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

		const indicator = window.DDOM.createElement({
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
		this.createElementCanvas();
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
			const emptyState = window.DDOM.createElement({
				tagName: 'div',
				style: { padding: '20px', textAlign: 'center', color: '#999' },
				textContent: 'Select an element to edit properties'
			}, { css: false });
			panel.appendChild(emptyState);
			return;
		}

		// Create properties container
		const container = window.DDOM.createElement({
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
		}, { css: false });

		panel.appendChild(container);
	},

	highlightSelectedElement: function (elementId) {
		if (!this.canvasShadowRoot) return;

		// Remove previous highlights
		this.canvasShadowRoot.querySelectorAll('[data-highlighted]').forEach(el => {
			el.style.outline = '';
			el.removeAttribute('data-highlighted');
		});

		// Highlight current selection in shadow DOM
		const element = this.canvasShadowRoot.getElementById(elementId);
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
										minHeight: '100%'
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

	oncreateElement: function () {
		// Expose the builder globally
		window.builderApp = this;

		// Populate element palette
		const palette = document.getElementById('element-palette');
		if (palette) {
			this.elementTypes.forEach(elementType => {
				const button = window.DDOM.createElement({
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

		// Initial createElement
		this.createElementCanvas();
		this.updateElementList();
		this.updatePropertiesPanel();
	},

	setupElementDragAndDrop: function (element, dataElement, index, parentPath) {
		// Add visual indicators for drag and drop
		element.style.position = 'relative';

		// Make createElemented elements draggable for reordering
		element.draggable = true;
		element.dataset.canvasIndex = index;
		element.dataset.elementId = dataElement.id;

		element.ondragstart = (e) => {
			e.stopPropagation();
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', dataElement.id);
			element.style.opacity = '0.5';
			this.draggedCanvasElement = {
				element: dataElement,
				index,
				parentPath: [...parentPath]
			};
		};

		element.ondragend = (_e) => {
			element.style.opacity = '1';
			this.draggedCanvasElement = null;
			// Remove all drop indicators
			this.clearAllDropIndicators();
		};

		element.ondragover = (e) => {
			e.preventDefault();
			e.stopPropagation();

			// Check if this is a new element from palette using the flag
			const isNewElement = this.isDraggingNewElement === true;

			if (isNewElement && this.isContainer(dataElement)) {
				// New element being dropped into container
				e.dataTransfer.dropEffect = 'copy';
				this.showContainerDropIndicator(element);
			} else if (!this.draggedCanvasElement || this.draggedCanvasElement.element.id === dataElement.id) {
				// Not dragging anything or dragging over self - do nothing
				if (!isNewElement) {
					return;
				}
			} else if (this.isContainer(dataElement)) {
				// Existing element being moved into container
				e.dataTransfer.dropEffect = 'move';
				this.showContainerDropIndicator(element);
			} else {
				// Element reordering
				e.dataTransfer.dropEffect = 'move';
				this.showCanvasDropIndicator(element, e);
			}
		};

		element.ondragleave = (e) => {
			// Only remove indicators if we're actually leaving the element
			if (!element.contains(e.relatedTarget)) {
				this.clearDropIndicatorsFromElement(element);
			}
		};

		element.ondrop = (e) => {
			e.preventDefault();
			e.stopPropagation();

			// Clear all indicators first
			this.clearAllDropIndicators();

			const elementType = e.dataTransfer.getData('application/element-type');
			const isNewElement = elementType && e.dataTransfer.getData('text/plain') === 'new-element';

			if (isNewElement && this.isContainer(dataElement)) {
				// Adding new element to container
				const type = JSON.parse(elementType);
				const newElement = this.createDefaultElement(type);

				if (!dataElement.children) {
					dataElement.children = [];
				}
				dataElement.children.push(newElement);

				this.createElementCanvas();
				this.updateElementList();
				this.selectElement(newElement.id);
				return;
			}

			if (!this.draggedCanvasElement || this.draggedCanvasElement.element.id === dataElement.id) {
				return;
			}

			// Check if dropping into a container
			if (this.isContainer(dataElement)) {
				this.handleDropIntoContainer(dataElement, parentPath, e);
			} else {
				this.handleCanvasElementDrop(index, e);
			}
		};

		// Add inline editing for text content
		if (dataElement.textContent !== undefined && !['input', 'img'].includes(dataElement.tagName)) {
			element.ondblclick = (e) => {
				e.preventDefault();
				e.stopPropagation();
				this.startInlineEdit(element, dataElement);
			};

			// Add visual hint for editable elements
			element.style.cursor = 'text';
			element.title = 'Double-click to edit text';
		}

		// Setup drag and drop for child elements if this is a container
		if (dataElement.children && dataElement.children.length > 0) {
			// Find child elements in shadow DOM and setup drag/drop
			setTimeout(() => {
				dataElement.children.forEach((child, childIndex) => {
					const childElement = this.canvasShadowRoot?.getElementById(child.id);
					if (childElement) {
						this.setupElementDragAndDrop(childElement, child, childIndex, [...parentPath, index, 'children']);
					}
				});
			}, 0);
		}
	},

	clearAllDropIndicators: function () {
		// Clear from document
		document.querySelectorAll('.canvas-drop-indicator, .container-drop-indicator, canvas-drop-indicator, drop-indicator').forEach(el => el.remove());
		// Clear from shadow DOM
		if (this.canvasShadowRoot) {
			this.canvasShadowRoot.querySelectorAll('.canvas-drop-indicator, .container-drop-indicator').forEach(el => el.remove());
		}
	},

	clearDropIndicatorsFromElement: function (element) {
		element.querySelectorAll('.canvas-drop-indicator, .container-drop-indicator').forEach(el => el.remove());
	},

	isContainer: function (dataElement) {
		// Elements that can contain other elements
		return ['div', 'section', 'article', 'main', 'aside', 'header', 'footer', 'nav'].includes(dataElement.tagName);
	},

	showContainerDropIndicator: function (element) {
		// Remove existing indicators from all elements first
		this.clearAllDropIndicators();

		const indicator = document.createElement('div');
		indicator.className = 'container-drop-indicator';
		indicator.style.cssText = `
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			border: 3px dashed #007bff;
			background-color: rgba(0, 123, 255, 0.1);
			z-index: 1000;
			pointer-events: none;
			border-radius: 4px;
			display: flex;
			align-items: center;
			justify-content: center;
			color: #007bff;
			font-weight: bold;
			font-size: 14px;
		`;
		indicator.textContent = 'Drop here to add to container';

		element.appendChild(indicator);
	},

	handleDropIntoContainer: function (containerElement, _containerPath, _event) {
		if (!this.draggedCanvasElement) return;

		// Remove the dragged element from its current location
		const sourceElements = this.getElementsAtPath(this.draggedCanvasElement.parentPath);
		const movedElement = sourceElements.splice(this.draggedCanvasElement.index, 1)[0];

		// Ensure the container has a children array
		if (!containerElement.children) {
			containerElement.children = [];
		}

		// Add to the container
		containerElement.children.push(movedElement);

		// Update displays
		this.createElementCanvas();
		this.updateElementList();
		this.selectElement(movedElement.id);
	},
};