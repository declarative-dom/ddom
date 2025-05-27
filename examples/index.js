export default {
	examples: {
		basic: { name: 'Basic Example', config: null },
		'custom-elements': { name: 'Custom Elements', config: null },
		'interactive-form': { name: 'Interactive Form', config: null },
		'dynamic-list': { name: 'Dynamic List', config: null }
	},

	customElements: [
		{
			tagName: 'nav-button',
			connectedCallback: function(element) {
				// Get the label from the element's properties
				const label = element.label || 'Button';
				const button = element.querySelector('button');
				if (button) {
					button.textContent = label;
				}
			},
			children: [{
				tagName: 'button',
				style: {
					padding: '0.5em 1em',
					border: '1px solid #007bff',
					borderRadius: '4px',
					backgroundColor: 'white',
					color: '#007bff',
					cursor: 'pointer',
					fontSize: '0.9em',
					transition: 'all 0.2s'
				},
				onclick: function() {
					// Access the example property from the custom element
					const customElement = this.parentElement;
					const example = customElement.example;
					console.log('Switching to example:', example);
					if (example) {
						window.switchExample(example);
					}
				}
			}]
		}
	],

	loadExamples: async function() {
		const basicModule = await import('./basic.js');
		const customElementsModule = await import('./custom-elements.js');
		const interactiveFormModule = await import('./interactive-form.js');
		const dynamicListModule = await import('./dynamic-list.js');

		this.examples.basic.config = basicModule.default;
		this.examples['custom-elements'].config = customElementsModule.default;
		this.examples['interactive-form'].config = interactiveFormModule.default;
		this.examples['dynamic-list'].config = dynamicListModule.default;
	},
	currentExample: 'basic',

	switchExample: function(exampleKey) {
		this.currentExample = exampleKey;
		this.renderCurrentExample();
		this.updateNavButtons();
	},

	renderCurrentExample: function() {
		const exampleContainer = document.getElementById('example-container');
		if (exampleContainer) {
			exampleContainer.innerHTML = '';

			const example = this.examples[this.currentExample];
			if (example && example.config) {
				// Register custom elements if they exist
				if (example.config.customElements) {
					DDOM.registerCustomElements(example.config.customElements);
				}

				// Render the body content directly using createElementDOM
				if (example.config.document && example.config.document.body) {
					// Create a container div and apply the body content to it
					const bodyDescriptor = { 
						tagName: 'div', 
						...example.config.document.body 
					};
					console.log('Body descriptor:', bodyDescriptor);
					const bodyElement = DDOM.createElementDOM(bodyDescriptor);
					console.log('Body element:', bodyElement);
					if (bodyElement && bodyElement instanceof Node) {
						exampleContainer.appendChild(bodyElement);
					} else {
						console.error('createElementDOM did not return a valid Node:', bodyElement);
					}
				}

				// Call onRender if it exists
				if (example.config.onRender) {
					example.config.onRender.call(example.config);
				}
			}
		}
	},

	updateNavButtons: function() {
		Object.keys(this.examples).forEach(key => {
			const button = document.getElementById(`nav-${key}`);
			if (button) {
				if (this.currentExample === key) {
					button.style.backgroundColor = '#007bff';
					button.style.color = 'white';
				} else {
					button.style.backgroundColor = 'white';
					button.style.color = '#007bff';
				}
			}
		});
	},

	document: {
		head: {
			children: [
				{
					tagName: 'script',
					type: 'module',
					src: '../dist/lib/render.js'
				}
			]
		},
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
									example: 'basic'
								},
								{
									tagName: 'nav-button',
									id: 'nav-custom-elements',
									label: 'Custom Elements',
									example: 'custom-elements'
								},
								{
									tagName: 'nav-button',
									id: 'nav-interactive-form',
									label: 'Interactive Form',
									example: 'interactive-form'
								},
								{
									tagName: 'nav-button',
									id: 'nav-dynamic-list',
									label: 'Dynamic List',
									example: 'dynamic-list'
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

	onRender: async function() {
		await this.loadExamples();
		// Expose switchExample function globally for navigation buttons
		window.switchExample = this.switchExample.bind(this);
		this.renderCurrentExample();
	}
};