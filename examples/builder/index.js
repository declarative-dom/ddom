import DDOM, { Signal, createEffect } from '../../lib/dist/index.js';
import elementMetadata from './metadata/elements.json' with { type: 'json' };

// ==================== Process Metadata ====================
// Flatten categories into a single array and build container lookup

const elementTypes = elementMetadata.categories.flatMap(category =>
	category.elements.map(el => ({ ...el, category: category.id }))
);

const containerTags = elementMetadata.categories
	.flatMap(cat => cat.elements)
	.filter(el => el.isContainer)
	.map(el => el.tagName);

// ==================== Shared State & Methods ====================
// Created before DDOM processes the spec so custom elements can use immediately

const builderState = {
	// Shared state - the declarative structure being built
	$currentStructure: new Signal.State({
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
	}),

	// Selection state
	$selectedElement: new Signal.State(null),
	$selectedPath: new Signal.State(null),

	// Drag state - shared across components
	$isDragging: new Signal.State(false),
	$isDraggingNewElement: new Signal.State(false),
	$draggedElement: new Signal.State(null),
	$draggedElementType: new Signal.State(null),
	$dropTarget: new Signal.State(null),
	$dropPosition: new Signal.State(null),

	// Metadata references
	elementMetadata,
	elementTypes,
	containerTags,

	// ==================== Utility Methods ====================

	isContainer(dataElement) {
		// Check if element's metadata explicitly defines it as a container
		const elementDef = this.elementTypes.find(et => et.tagName === dataElement.tagName);
		if (elementDef?.isContainer !== undefined) {
			return elementDef.isContainer;
		}
		// Fallback to tag-based detection
		return this.containerTags.includes(dataElement.tagName);
	},

	createDefaultElement(elementType) {
		const element = {
			tagName: elementType.tagName,
			id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		};

		// Apply defaults from metadata
		if (elementType.defaults) {
			if (elementType.defaults.textContent) {
				element.textContent = elementType.defaults.textContent;
			}
			if (elementType.defaults.attributes) {
				element.attributes = { ...elementType.defaults.attributes };
			}
			if (elementType.defaults.style) {
				element.style = { ...elementType.defaults.style };
			}
		}

		return element;
	},

	addElement(elementType) {
		const element = this.createDefaultElement(elementType);
		this.$currentStructure.get().document.body.children.push(element);
		this.$currentStructure.set({ ...this.$currentStructure.get() });
	},

	selectElement(elementId) {
		const found = this.findElementById(elementId);
		if (found) {
			this.$selectedElement.set(found.element);
			this.$selectedPath.set(found.parentPath.concat(found.index));
		}
	},

	findElementById(id, elements = null, parentPath = []) {
		elements = elements || this.$currentStructure.get().document.body.children;

		for (let i = 0; i < elements.length; i++) {
			if (elements[i].id === id) {
				return { element: elements[i], index: i, parentPath };
			}
			if (elements[i].children && elements[i].children.length > 0) {
				const found = this.findElementById(id, elements[i].children, [...parentPath, i, 'children']);
				if (found) return found;
			}
		}
		return null;
	},

	getElementsAtPath(path) {
		if (!path || path.length === 0) {
			return this.$currentStructure.get().document.body.children;
		}

		let current = this.$currentStructure.get().document.body.children;
		for (let i = 0; i < path.length; i++) {
			if (path[i] === 'children') continue;
			current = current[path[i]];
			if (i + 1 < path.length && path[i + 1] === 'children') {
				current = current.children;
				i++;
			}
		}
		return current;
	},

	removeSelectedElement() {
		const selectedPath = this.$selectedPath.get();
		if (!this.$selectedElement.get() || !selectedPath) return;

		let current = this.$currentStructure.get().document.body.children;
		for (let i = 0; i < selectedPath.length - 1; i++) {
			if (selectedPath[i] === 'children') continue;
			current = current[selectedPath[i]];
			if (selectedPath[i + 1] === 'children') {
				current = current.children;
				i++;
			}
		}

		current.splice(selectedPath[selectedPath.length - 1], 1);
		this.$selectedElement.set(null);
		this.$selectedPath.set(null);
		this.$currentStructure.set({ ...this.$currentStructure.get() });
	},

	updateProperty(property, value) {
		const selected = this.$selectedElement.get();
		if (!selected) return;

		if (property.startsWith('style.')) {
			const styleProp = property.replace('style.', '');
			if (!selected.style) selected.style = {};
			selected.style[styleProp] = value;
		} else {
			selected[property] = value;
		}

		this.$currentStructure.set({ ...this.$currentStructure.get() });
	},

	exportStructure() {
		const structure = this.$currentStructure.get();
		const dataStr = JSON.stringify(structure, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = 'declarative-dom-structure.json';
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
};

// Make it globally available immediately
window.builderState = builderState;

// Shorthand for builderState (used in all callbacks below)
const BS = builderState;

export default {
	// ==================== Custom Element Definitions ====================

	customElements: [
		// ==================== Builder Palette Component ====================
		{
			tagName: 'builder-palette',
			style: {
				display: 'block',
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
					className: 'palette-categories'
				}
			],
			connectedCallback: function () {
				const container = this.querySelector('.palette-categories');

				// Render categories from metadata
				BS.elementMetadata.categories.forEach(category => {
					// Category header (collapsible)
					const categorySection = window.DDOM.createElement({
						tagName: 'div',
						className: 'palette-category',
						style: { marginBottom: '10px' }
					});

					const header = window.DDOM.createElement({
						tagName: 'div',
						className: 'category-header',
						textContent: `${category.icon || ''} ${category.name}`,
						style: {
							padding: '6px 8px',
							backgroundColor: '#e9ecef',
							borderRadius: '4px',
							cursor: 'pointer',
							fontWeight: 'bold',
							fontSize: '12px',
							color: '#495057',
							userSelect: 'none',
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center'
						}
					});

					const arrow = window.DDOM.createElement({
						tagName: 'span',
						textContent: '▼',
						style: { fontSize: '10px', transition: 'transform 0.2s' }
					});
					header.appendChild(arrow);

					const itemsContainer = window.DDOM.createElement({
						tagName: 'div',
						className: 'category-items',
						style: { marginTop: '6px' }
					});

					// Toggle collapse
					header.onclick = () => {
						const isCollapsed = itemsContainer.style.display === 'none';
						itemsContainer.style.display = isCollapsed ? 'block' : 'none';
						arrow.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
					};

					// Add elements to category
					category.elements.forEach(elementType => {
						const button = window.DDOM.createElement({
							tagName: 'palette-item',
							attributes: {
								icon: elementType.icon,
								name: elementType.name,
								description: elementType.description || '',
								elementType: JSON.stringify(elementType)
							}
						});
						itemsContainer.appendChild(button);
					});

					categorySection.appendChild(header);
					categorySection.appendChild(itemsContainer);
					container.appendChild(categorySection);
				});
			}
		},

		// Palette Item - draggable element button
		{
			tagName: 'palette-item',
			style: {
				display: 'block',
				padding: '8px 10px',
				marginBottom: '4px',
				background: 'white',
				border: '1px solid #dee2e6',
				borderRadius: '4px',
				cursor: 'grab',
				textAlign: 'left',
				fontSize: '13px',
				userSelect: 'none',
				transition: 'background-color 0.15s, transform 0.1s',
				':hover': {
					backgroundColor: '#e9ecef'
				}
			},
			connectedCallback: function () {
				const icon = this.getAttribute('icon') || '';
				const name = this.getAttribute('name') || '';
				const description = this.getAttribute('description') || '';
				const elementType = JSON.parse(this.getAttribute('elementType') || '{}');

				this.textContent = `${icon} ${name}`;
				if (description) {
					this.title = description;
				}

				// Click to add
				this.onclick = () => BS.addElement(elementType);

				// Mouse-based drag
				this.onmousedown = (e) => {
					if (e.button !== 0) return;
					e.preventDefault();

					BS.$isDragging.set(true);
					BS.$isDraggingNewElement.set(true);
					BS.$draggedElementType.set(elementType);
					BS.$dropTarget.set(null);
					BS.$dropPosition.set(null);

					this.style.opacity = '0.5';
					document.body.style.cursor = 'grabbing';

					const onMouseMove = (moveEvent) => {
						const canvas = document.querySelector('builder-canvas');
						if (canvas) canvas.handleDragOver(moveEvent);
					};

					const onMouseUp = () => {
						document.removeEventListener('mousemove', onMouseMove);
						document.removeEventListener('mouseup', onMouseUp);

						this.style.opacity = '1';
						document.body.style.cursor = '';

						const canvas = document.querySelector('builder-canvas');
						if (canvas) canvas.handleDrop();

						BS.$isDragging.set(false);
						BS.$isDraggingNewElement.set(false);
						BS.$draggedElementType.set(null);
					};

					document.addEventListener('mousemove', onMouseMove);
					document.addEventListener('mouseup', onMouseUp);
				};
			}
		},

		// ==================== Builder Tree Component ====================
		{
			tagName: 'builder-tree',
			style: {
				display: 'block',
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
					className: 'tree-container',
					style: {
						border: '1px solid #dee2e6',
						borderRadius: '4px',
						backgroundColor: 'white',
						minHeight: '200px'
					}
				}
			],
			connectedCallback: function () {
				this._container = this.querySelector('.tree-container');
				this.render();

				// Re-render when structure changes
				createEffect(() => { BS.$currentStructure.get(); this.render(); });
				createEffect(() => { BS.$selectedElement.get(); this.render(); });
			},
			render: function () {
				this._container.innerHTML = '';
				const children = BS.$currentStructure.get().document.body.children;
				this.renderItems(children, 0, []);
			},
			renderItems: function (elements, depth, parentPath) {
				elements.forEach((element, index) => {
					const item = window.DDOM.createElement({
						tagName: 'tree-item',
						attributes: {
							elementData: JSON.stringify(element),
							index: index.toString(),
							depth: depth.toString(),
							parentPath: JSON.stringify(parentPath)
						}
					});
					this._container.appendChild(item);

					if (element.children && element.children.length > 0) {
						this.renderItems(element.children, depth + 1, [...parentPath, index, 'children']);
					}
				});
			}
		},

		// Tree Item - individual tree node
		{
			tagName: 'tree-item',
			style: {
				display: 'block',
				cursor: 'pointer',
				borderBottom: '1px solid #eee',
				fontSize: '14px',
				userSelect: 'none',
				position: 'relative',
				transition: 'background-color 0.15s'
			},
			connectedCallback: function () {
				const elementData = JSON.parse(this.getAttribute('elementData') || '{}');
				const index = parseInt(this.getAttribute('index') || '0');
				const depth = parseInt(this.getAttribute('depth') || '0');
				const parentPath = JSON.parse(this.getAttribute('parentPath') || '[]');

				this.style.padding = `8px 8px 8px ${depth * 20 + 12}px`;
				this.textContent = `${elementData.tagName}${elementData.id ? ` (#${elementData.id.slice(0, 12)}...)` : ''}`;

				// Store data for drag operations
				this._elementData = elementData;
				this._index = index;
				this._depth = depth;
				this._parentPath = parentPath;

				// Highlight if selected
				const selected = BS.$selectedElement.get();
				if (selected && selected.id === elementData.id) {
					this.style.backgroundColor = '#e3f2fd';
					this.style.fontWeight = 'bold';
				}

				// Selection click
				this.onclick = () => {
					if (!BS.$isDragging.get()) {
						BS.selectElement(elementData.id);
					}
				};

				// Mouse-based drag
				this.onmousedown = (e) => {
					if (e.button !== 0) return;
					e.preventDefault();

					BS.$isDragging.set(true);
					BS.$isDraggingNewElement.set(false);
					BS.$draggedElement.set({
						element: elementData,
						index,
						depth,
						parentPath
					});

					this.style.opacity = '0.5';
					document.body.style.cursor = 'grabbing';

					const onMouseMove = (moveEvent) => this.handleTreeDragOver(moveEvent);
					const onMouseUp = () => {
						document.removeEventListener('mousemove', onMouseMove);
						document.removeEventListener('mouseup', onMouseUp);

						this.style.opacity = '1';
						document.body.style.cursor = '';
						this.handleTreeDrop();

						BS.$isDragging.set(false);
						BS.$draggedElement.set(null);
						this.clearDropIndicators();
					};

					document.addEventListener('mousemove', onMouseMove);
					document.addEventListener('mouseup', onMouseUp);
				};
			},

			handleTreeDragOver: function (event) {
				const dragged = BS.$draggedElement.get();
				if (!dragged) return;

				this.style.visibility = 'hidden';
				const elementsAtPoint = document.elementsFromPoint(event.clientX, event.clientY);
				this.style.visibility = '';

				let targetItem = null;
				for (const el of elementsAtPoint) {
					if (el.tagName?.toLowerCase() === 'tree-item' && el !== this) {
						targetItem = el;
						break;
					}
				}

				if (!targetItem || !targetItem._elementData || dragged.element.id === targetItem._elementData.id) {
					this.clearDropIndicators();
					BS.$dropTarget.set(null);
					BS.$dropPosition.set(null);
					return;
				}

				const rect = targetItem.getBoundingClientRect();
				const relativeY = event.clientY - rect.top;
				const isContainer = BS.isContainer(targetItem._elementData);

				let position;
				if (isContainer) {
					const topZone = rect.height * 0.25;
					const bottomZone = rect.height * 0.75;
					position = relativeY < topZone ? 'before' : relativeY > bottomZone ? 'after' : 'inside';
				} else {
					position = relativeY < rect.height / 2 ? 'before' : 'after';
				}

				BS.$dropTarget.set({
					element: targetItem._elementData,
					domElement: targetItem,
					index: targetItem._index,
					parentPath: targetItem._parentPath
				});
				BS.$dropPosition.set(position);

				this.showDropIndicator(targetItem, position, isContainer);
			},

			showDropIndicator: function (item, position, isContainer) {
				this.clearDropIndicators();
				const indicator = document.createElement('div');
				indicator.className = 'tree-drop-indicator';

				if (position === 'inside' && isContainer) {
					indicator.style.cssText = `
						position: absolute; top: 0; left: 0; right: 0; bottom: 0;
						border: 2px dashed #007bff; background: rgba(0,123,255,0.1);
						pointer-events: none; border-radius: 2px;
					`;
				} else {
					indicator.style.cssText = `
						position: absolute; left: 0; right: 0; height: 2px;
						background: #007bff; pointer-events: none;
						${position === 'before' ? 'top: -1px;' : 'bottom: -1px;'}
					`;
				}
				item.appendChild(indicator);
			},

			clearDropIndicators: function () {
				document.querySelectorAll('.tree-drop-indicator').forEach(el => el.remove());
			},

			handleTreeDrop: function () {
				const dragged = BS.$draggedElement.get();
				const target = BS.$dropTarget.get();
				const position = BS.$dropPosition.get();

				if (!dragged || !target || !position) return;

				const sourceElements = BS.getElementsAtPath(dragged.parentPath);
				const movedElement = sourceElements.splice(dragged.index, 1)[0];

				if (position === 'inside') {
					if (!target.element.children) target.element.children = [];
					target.element.children.push(movedElement);
				} else {
					const targetElements = BS.getElementsAtPath(target.parentPath);
					let newIndex = target.index + (position === 'after' ? 1 : 0);
					const sameContainer = JSON.stringify(dragged.parentPath) === JSON.stringify(target.parentPath);
					if (sameContainer && dragged.index < newIndex) newIndex--;
					targetElements.splice(newIndex, 0, movedElement);
				}

				BS.$currentStructure.set({ ...BS.$currentStructure.get() });
				BS.selectElement(movedElement.id);
			}
		},

		// ==================== Builder Canvas Component ====================
		{
			tagName: 'builder-canvas',
			style: {
				display: 'block',
				flex: '1',
				backgroundColor: 'white',
				overflow: 'auto',
				position: 'relative'
			},
			children: [
				{
					tagName: 'div',
					className: 'canvas-host',
					style: { minHeight: '100%', position: 'relative' }
				}
			],
			connectedCallback: function () {
				this._host = this.querySelector('.canvas-host');
				this._shadowRoot = this._host.attachShadow({ mode: 'open' });
				this.render();

				// Re-render when structure changes
				createEffect(() => { BS.$currentStructure.get(); this.render(); });
				createEffect(() => { BS.$selectedElement.get(); this.highlightSelected(); });
			},

			render: function () {
				this._shadowRoot.innerHTML = '';

				// Add isolated styles
				const style = document.createElement('style');
				style.textContent = `
					* { box-sizing: border-box; }
					[data-canvas-element] {
						position: relative;
						min-height: 30px;
						outline: 1px dashed transparent;
						transition: outline-color 0.15s;
					}
					[data-canvas-element]:hover { outline-color: #007bff; }
					[data-canvas-element].selected { outline: 2px solid #007bff; }
					.canvas-drop-indicator {
						position: absolute;
						pointer-events: none;
						z-index: 1000;
					}
				`;
				this._shadowRoot.appendChild(style);

				// Render elements
				const children = BS.$currentStructure.get().document.body.children;
				children.forEach((spec, index) => {
					const el = this.createCanvasElement(spec, index, []);
					if (el) this._shadowRoot.appendChild(el);
				});

				this.highlightSelected();
			},

			createCanvasElement: function (spec, index, parentPath) {
				const el = document.createElement(spec.tagName);
				el.id = spec.id;
				el.dataset.canvasElement = 'true';

				if (spec.textContent) el.textContent = spec.textContent;
				if (spec.style) Object.assign(el.style, spec.style);
				if (spec.attributes) {
					Object.entries(spec.attributes).forEach(([k, v]) => el.setAttribute(k, v));
				}

				// Setup interactions
				this.setupElementInteractions(el, spec, index, parentPath);

				// Render children
				if (spec.children) {
					spec.children.forEach((child, childIndex) => {
						if (!child.id) child.id = `element-${Date.now()}-${childIndex}`;
						const childEl = this.createCanvasElement(child, childIndex, [...parentPath, index, 'children']);
						if (childEl) el.appendChild(childEl);
					});
				}

				return el;
			},

			setupElementInteractions: function (element, dataElement, index, parentPath) {
				// Selection
				element.onclick = (e) => {
					if (!BS.$isDragging.get()) {
						e.stopPropagation();
						BS.selectElement(dataElement.id);
					}
				};

				// Inline editing
				if (dataElement.textContent !== undefined && !['input', 'img'].includes(dataElement.tagName)) {
					element.ondblclick = (e) => {
						e.preventDefault();
						e.stopPropagation();
						this.startInlineEdit(element, dataElement);
					};
					element.style.cursor = 'text';
					element.title = 'Double-click to edit';
				}

				// Mouse-based drag
				element.onmousedown = (e) => {
					if (e.button !== 0 || e.target.tagName === 'INPUT') return;
					e.preventDefault();
					e.stopPropagation();

					BS.$isDragging.set(true);
					BS.$isDraggingNewElement.set(false);
					BS.$draggedElement.set({
						element: dataElement,
						domElement: element,
						index,
						parentPath
					});

					element.style.opacity = '0.5';
					document.body.style.cursor = 'grabbing';

					const onMouseMove = (moveEvent) => this.handleDragOver(moveEvent, element);
					const onMouseUp = () => {
						document.removeEventListener('mousemove', onMouseMove);
						document.removeEventListener('mouseup', onMouseUp);

						element.style.opacity = '1';
						document.body.style.cursor = '';
						this.handleDrop();

						BS.$isDragging.set(false);
						BS.$draggedElement.set(null);
						this.clearDropIndicators();
					};

					document.addEventListener('mousemove', onMouseMove);
					document.addEventListener('mouseup', onMouseUp);
				};
			},

			handleDragOver: function (event, draggedElement = null) {
				const rect = this.getBoundingClientRect();
				if (event.clientX < rect.left || event.clientX > rect.right ||
					event.clientY < rect.top || event.clientY > rect.bottom) {
					this.clearDropIndicators();
					BS.$dropTarget.set(null);
					BS.$dropPosition.set(null);
					return;
				}

				if (draggedElement) draggedElement.style.visibility = 'hidden';

				let targetElement = null;
				let targetData = null;

				// Check shadow DOM elements
				const shadowElements = this._shadowRoot.elementsFromPoint?.(event.clientX, event.clientY) || [];
				for (const el of shadowElements) {
					if (el.dataset?.canvasElement && el !== draggedElement) {
						targetElement = el;
						const found = BS.findElementById(el.id);
						if (found) targetData = found;
						break;
					}
				}

				if (draggedElement) draggedElement.style.visibility = '';

				if (!targetElement || !targetData) {
					this.clearDropIndicators();
					BS.$dropTarget.set({ element: null, index: -1, parentPath: [] });
					BS.$dropPosition.set('append');
					return;
				}

				// Don't drop on self
				const dragged = BS.$draggedElement.get();
				if (dragged && dragged.element.id === targetData.element.id) {
					this.clearDropIndicators();
					return;
				}

				// Calculate 25/50/25 zones for containers
				const targetRect = targetElement.getBoundingClientRect();
				const relativeY = event.clientY - targetRect.top;
				const isContainer = BS.isContainer(targetData.element);

				let position;
				if (isContainer) {
					const topZone = targetRect.height * 0.25;
					const bottomZone = targetRect.height * 0.75;
					position = relativeY < topZone ? 'before' : relativeY > bottomZone ? 'after' : 'inside';
				} else {
					position = relativeY < targetRect.height / 2 ? 'before' : 'after';
				}

				BS.$dropTarget.set({
					element: targetData.element,
					domElement: targetElement,
					index: targetData.index,
					parentPath: targetData.parentPath
				});
				BS.$dropPosition.set(position);

				this.showDropIndicator(targetElement, position, isContainer);
			},

			showDropIndicator: function (element, position, isContainer) {
				this.clearDropIndicators();

				const rect = element.getBoundingClientRect();
				const hostRect = this._host.getBoundingClientRect();
				const indicator = document.createElement('div');
				indicator.className = 'canvas-drop-indicator';

				if (position === 'inside' && isContainer) {
					indicator.style.cssText = `
						position: absolute;
						top: ${rect.top - hostRect.top}px;
						left: ${rect.left - hostRect.left}px;
						width: ${rect.width}px;
						height: ${rect.height}px;
						border: 3px dashed #007bff;
						background: rgba(0,123,255,0.1);
						display: flex; align-items: center; justify-content: center;
						color: #007bff; font-weight: bold; font-size: 12px;
						pointer-events: none; border-radius: 4px; box-sizing: border-box;
					`;
					indicator.textContent = 'Drop inside';
				} else {
					const top = position === 'before'
						? rect.top - hostRect.top - 2
						: rect.bottom - hostRect.top - 1;
					indicator.style.cssText = `
						position: absolute;
						top: ${top}px;
						left: ${rect.left - hostRect.left}px;
						width: ${rect.width}px;
						height: 3px;
						background: #007bff;
						pointer-events: none; border-radius: 1px;
					`;
				}

				this._host.appendChild(indicator);
			},

			clearDropIndicators: function () {
				this._host.querySelectorAll('.canvas-drop-indicator').forEach(el => el.remove());
			},

			handleDrop: function () {
				const target = BS.$dropTarget.get();
				const position = BS.$dropPosition.get();
				const isNewElement = BS.$isDraggingNewElement.get();
				const draggedType = BS.$draggedElementType.get();
				const dragged = BS.$draggedElement.get();

				this.clearDropIndicators();

				if (isNewElement && draggedType) {
					// New element from palette
					const newElement = BS.createDefaultElement(draggedType);

					if (!target || position === 'append') {
						BS.$currentStructure.get().document.body.children.push(newElement);
					} else if (position === 'inside') {
						if (!target.element.children) target.element.children = [];
						target.element.children.push(newElement);
					} else {
						const targetElements = BS.getElementsAtPath(target.parentPath);
						let newIndex = target.index + (position === 'after' ? 1 : 0);
						targetElements.splice(newIndex, 0, newElement);
					}

					BS.$currentStructure.set({ ...BS.$currentStructure.get() });
					BS.selectElement(newElement.id);

				} else if (dragged && target && position) {
					// Moving existing element
					const sourceElements = BS.getElementsAtPath(dragged.parentPath);
					const movedElement = sourceElements.splice(dragged.index, 1)[0];

					if (position === 'inside') {
						if (!target.element.children) target.element.children = [];
						target.element.children.push(movedElement);
					} else {
						const targetElements = BS.getElementsAtPath(target.parentPath);
						let newIndex = target.index + (position === 'after' ? 1 : 0);
						const sameContainer = JSON.stringify(dragged.parentPath) === JSON.stringify(target.parentPath);
						if (sameContainer && dragged.index < newIndex) newIndex--;
						targetElements.splice(newIndex, 0, movedElement);
					}

					BS.$currentStructure.set({ ...BS.$currentStructure.get() });
					BS.selectElement(movedElement.id);
				}
			},

			highlightSelected: function () {
				this._shadowRoot.querySelectorAll('[data-canvas-element]').forEach(el => {
					el.classList.remove('selected');
				});
				const selected = BS.$selectedElement.get();
				if (selected) {
					const el = this._shadowRoot.getElementById(selected.id);
					if (el) el.classList.add('selected');
				}
			},

			startInlineEdit: function (domElement, dataElement) {
				if (domElement.querySelector('input')) return;

				const input = document.createElement('input');
				input.type = 'text';
				input.value = dataElement.textContent || '';
				input.style.cssText = `
					width: 100%; padding: 4px; border: 2px solid #007bff;
					border-radius: 3px; font: inherit; outline: none;
				`;

				const originalText = domElement.textContent;
				domElement.textContent = '';
				domElement.appendChild(input);
				input.focus();
				input.select();

				const save = () => {
					const newText = input.value.trim();
					dataElement.textContent = newText || originalText;
					BS.$currentStructure.set({ ...BS.$currentStructure.get() });
				};

				input.onblur = save;
				input.onkeydown = (e) => {
					if (e.key === 'Enter') { e.preventDefault(); save(); }
					if (e.key === 'Escape') { domElement.textContent = originalText; }
				};
			}
		},

		// ==================== Builder Properties Component ====================
		{
			tagName: 'builder-properties',
			style: {
				display: 'block',
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
						{ tagName: 'h3', textContent: 'Properties', style: { margin: '0', color: '#333' } }
					]
				},
				{
					tagName: 'div',
					className: 'properties-content'
				}
			],
			connectedCallback: function () {
				this._content = this.querySelector('.properties-content');
				this.render();
				createEffect(() => { BS.$selectedElement.get(); this.render(); });
				createEffect(() => { BS.$currentStructure.get(); this.render(); });
			},

			render: function () {
				this._content.innerHTML = '';
				const selected = BS.$selectedElement.get();

				if (!selected) {
					this._content.innerHTML = `
						<div style="padding: 20px; text-align: center; color: #999;">
							Select an element to edit properties
						</div>
					`;
					return;
				}

				const container = document.createElement('div');
				container.style.padding = '15px';

				// Element info
				container.innerHTML = `
					<div style="margin-bottom: 15px; padding: 10px; background: #e9ecef; border-radius: 4px;">
						<strong>${selected.tagName}</strong>
						<div style="font-size: 12px; color: #666; margin-top: 4px;">${selected.id || 'No ID'}</div>
					</div>
				`;

				// Properties
				this.addPropertyField(container, 'ID', 'id', selected.id || '');
				if (selected.textContent !== undefined) {
					this.addPropertyField(container, 'Text Content', 'textContent', selected.textContent || '');
				}

				// Style properties
				const styleHeader = document.createElement('h4');
				styleHeader.textContent = 'Styles';
				styleHeader.style.cssText = 'margin: 20px 0 10px; color: #333; border-bottom: 1px solid #dee2e6; padding-bottom: 5px;';
				container.appendChild(styleHeader);

				const styleProps = ['color', 'backgroundColor', 'fontSize', 'padding', 'margin', 'border', 'borderRadius'];
				styleProps.forEach(prop => {
					const value = selected.style?.[prop] || '';
					this.addPropertyField(container, prop, `style.${prop}`, value);
				});

				// Delete button
				const deleteBtn = document.createElement('button');
				deleteBtn.textContent = 'Delete Element';
				deleteBtn.style.cssText = `
					width: 100%; padding: 10px; margin-top: 20px;
					background: #dc3545; color: white; border: none;
					border-radius: 4px; cursor: pointer; font-size: 14px;
				`;
				deleteBtn.onclick = () => BS.removeSelectedElement();
				container.appendChild(deleteBtn);

				this._content.appendChild(container);
			},

			addPropertyField: function (container, label, property, value) {
				const field = document.createElement('div');
				field.style.marginBottom = '12px';
				field.innerHTML = `
					<label style="display: block; margin-bottom: 4px; font-weight: bold; font-size: 12px; color: #555;">${label}</label>
					<input type="text" value="${value}" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;">
				`;
				field.querySelector('input').onchange = (e) => {
					BS.updateProperty(property, e.target.value);
				};
				container.appendChild(field);
			}
		}
	],

	// ==================== Main App Layout ====================

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
				// Header
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
							textContent: 'DDOM Builder',
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
							onclick: function () {
								BS.exportStructure();
							}
						}
					]
				},

				// Main content area
				{
					tagName: 'div',
					style: {
						display: 'flex',
						flex: '1',
						height: 'calc(100vh - 50px)',
						overflow: 'hidden'
					},
					children: [
						// Left sidebar
						{
							tagName: 'div',
							style: {
								width: '250px',
								backgroundColor: '#f8f9fa',
								borderRight: '1px solid #dee2e6',
								overflowY: 'auto',
								display: 'flex',
								flexDirection: 'column'
							},
							children: [
								{ tagName: 'builder-palette' },
								{ tagName: 'builder-tree' }
							]
						},

						// Canvas
						{ tagName: 'builder-canvas' },

						// Properties panel
						{ tagName: 'builder-properties' }
					]
				}
			]
		}
	},

	oncreateElement: function () {
		// builderState (BS) is already globally available
		// This hook is called when the document is fully created
	}
};
