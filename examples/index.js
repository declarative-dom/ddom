export default {
	examples: {
		basic: { name: 'Basic Example', config: null },
		'custom-elements': { name: 'Custom Elements', config: null },
		'interactive-form': { name: 'Interactive Form', config: null },
		'dynamic-list': { name: 'Dynamic List', config: null },
		'computed-properties': { name: 'Computed Properties', config: null }
	},

	customElements: [
		{
			tagName: 'nav-button',
			
			// Props passed from parent - use empty defaults to avoid conflicts
			label: '',  // Will be set by instance
			example: '', // Will be set by instance
			active: false, // Will be set by instance

			// Computed properties
			get buttonText() {
				const labelValue = this.label && this.label.get ? this.label.get() : this.label;
				return labelValue || 'Button'; // Fallback to 'Button' if no label
			},

			get isActive() {
				const activeValue = this.active && this.active.get ? this.active.get() : this.active;
				return activeValue;
			},

			connectedCallback: function () {
				// Set up reactive attributes for styling
				DDOM.createEffect(() => {
					this.setAttribute('data-active', this.isActive);
				});
			},

			style: {
				display: 'block',
				
				// Active/inactive button styling using attributes
				'[data-active="true"] button': {
					backgroundColor: '#007bff',
					color: 'white'
				},
				'[data-active="false"] button': {
					backgroundColor: 'white',
					color: '#007bff'
				}
			},

			children: [{
				tagName: 'button',
				textContent: '${this.parentNode.buttonText}',
				style: {
					padding: '0.5em 1em',
					border: '1px solid #007bff',
					borderRadius: '4px',
					cursor: 'pointer',
					fontSize: '0.9em',
					transition: 'all 0.2s'
				},
				onclick: function () {
					// Access the example property from the custom element
					const customElement = this.parentNode;
					const example = customElement.example.get ? customElement.example.get() : customElement.example;
					if (example) {
						window.switchExample(example);
					}
				}
			}]
		}
	],

	loadExamples: async function () {
		try {
			console.log('Loading examples...');
			const basicModule = await import('./basic.js');
			const customElementsModule = await import('./custom-elements.js');
			const interactiveFormModule = await import('./interactive-form.js');
			const dynamicListModule = await import('./dynamic-list.js');
			const computedPropertiesModule = await import('./computed-properties/computed-properties.js');

			this.examples.basic.config = basicModule.default;
			this.examples['custom-elements'].config = customElementsModule.default;
			this.examples['interactive-form'].config = interactiveFormModule.default;
			this.examples['dynamic-list'].config = dynamicListModule.default;
			this.examples['computed-properties'].config = computedPropertiesModule.default;
			console.log('Examples loaded successfully:', this.examples);
		} catch (error) {
			console.error('Error loading examples:', error);
		}
	},
	currentExample: 'basic',

	switchExample: function (exampleKey) {
		this.currentExample = exampleKey;
		this.createElementCurrentExample();
		this.updateNavButtons();
	},
	createElementCurrentExample: function () {
		console.log('Creating example for:', this.currentExample);
		const exampleContainer = document.getElementById('example-container');
		console.log('Example container:', exampleContainer);
		console.log('Current example config:', this.examples[this.currentExample]?.config);
		
		if (exampleContainer && this.examples[this.currentExample]?.config) {
			const example = this.examples[this.currentExample];

			// Register custom elements if they exist
			if (example.config.customElements) {
				window.DDOM.customElements.define(example.config.customElements);
			}

			// Clear and render using pure DDOM
			exampleContainer.innerHTML = '';
			console.log('About to render split layout with children:', example.config.document?.body?.children);
			
			// Create split layout using pure DDOM
			const splitLayout = {
				tagName: 'div',
				style: {
					display: 'flex',
					height: 'calc(100vh - 160px)',
					gap: '1px',
					backgroundColor: '#dee2e6'
				},
				children: [
					// Left side - rendered example
					{
						tagName: 'div',
						style: {
							flex: '1',
							backgroundColor: 'white',
							overflow: 'auto',
							padding: '1rem'
						},
						children: example.config.document?.body?.children || []
					},
					// Right side - DDOM code
					{
						tagName: 'div',
						style: {
							flex: '1',
							backgroundColor: '#f8f9fa',
							overflow: 'auto',
							padding: '1rem',
							fontFamily: 'Courier New, monospace',
							fontSize: '0.85em',
							lineHeight: '1.4'
						},
						children: [
							{
								tagName: 'h3',
								textContent: 'DDOM Configuration',
								style: {
									marginTop: '0',
									marginBottom: '1rem',
									color: '#495057',
									fontFamily: 'Arial, sans-serif',
									fontSize: '1em'
								}
							},
							{
								tagName: 'pre',
								id: 'config-display',
								style: {
									backgroundColor: '#ffffff',
									border: '1px solid #dee2e6',
									borderRadius: '4px',
									padding: '1rem',
									margin: '0',
									overflow: 'auto',
									whiteSpace: 'pre-wrap',
									wordWrap: 'break-word'
								}
								// textContent will be set manually after creation
							}
						]
					}
				]
			};

			// Render the split layout
			window.DDOM.appendChild(splitLayout, exampleContainer);

			// Manually set the JSON content to avoid template literal processing
			const configDisplay = document.getElementById('config-display');
			if (configDisplay) {
				const configToShow = { ...example.config };
				if (configToShow.oncreateElement) delete configToShow.oncreateElement;
				configDisplay.textContent = JSON.stringify(configToShow, null, 2);
			}

			// Call oncreateElement if it exists
			if (example.config.oncreateElement) {
				example.config.oncreateElement.call(example.config);
			}
		}
	},

	updateNavButtons: function () {
		Object.keys(this.examples).forEach(key => {
			const button = document.getElementById(`nav-${key}`);
			if (button && button.active) {
				// Update the reactive active signal
				const isActive = this.currentExample === key;
				if (button.active.set) {
					button.active.set(isActive);
				} else {
					button.active = isActive;
				}
			}
		});
	},

	document: {
		body: {
			style: {
				fontFamily: 'Arial, sans-serif',
				margin: '0',
				padding: '0',
				backgroundColor: '#f8f9fa'
			},
			children: [
				{
					tagName: 'header',
					style: {
						backgroundColor: '#343a40',
						color: 'white',
						padding: '1em 2em',
						boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
					},
					children: [
						{
							tagName: 'h1',
							textContent: 'Declarative DOM Examples',
							style: { margin: '0', fontSize: '1.5em' }
						}
					]
				},
				{
					tagName: 'nav',
					style: {
						backgroundColor: 'white',
						padding: '1em 2em',
						borderBottom: '1px solid #dee2e6'
					},
					children: [
						{
							tagName: 'div',
							style: {
								display: 'flex',
								gap: '1em',
								flexWrap: 'wrap'
							},
							children: [
								{
									tagName: 'nav-button',
									id: 'nav-basic',
									label: 'Basic Example',
									example: 'basic',
									active: true  // Set the first one as active initially
								},
								{
									tagName: 'nav-button',
									id: 'nav-custom-elements',
									label: 'Custom Elements',
									example: 'custom-elements',
									active: false
								},
								{
									tagName: 'nav-button',
									id: 'nav-interactive-form',
									label: 'Interactive Form',
									example: 'interactive-form',
									active: false
								},
								{
									tagName: 'nav-button',
									id: 'nav-dynamic-list',
									label: 'Dynamic List',
									example: 'dynamic-list',
									active: false
								},
								{
									tagName: 'nav-button',
									id: 'nav-computed-properties',
									label: 'Computed Properties',
									example: 'computed-properties',
									active: false
								}
							]
						}
					]
				},
				{
					tagName: 'main',
					style: {
						minHeight: 'calc(100vh - 120px)'
					},
					children: [
						{
							tagName: 'div',
							id: 'example-container',
							style: {
								padding: '0'
							}
						}
					]
				}
			]
		}
	},
	oncreateElement: async function () {
		await this.loadExamples();

		// Expose functions globally for navigation buttons and examples
		window.switchExample = this.switchExample.bind(this);

		// Ensure DDOM is available globally (it should already be from index.ts)
		if (!window.DDOM) {
			console.error('DDOM not available globally. Make sure index.js is loaded properly.');
			return;
		}

		this.createElementCurrentExample();
		this.updateNavButtons(); // Set initial active states
	}
};