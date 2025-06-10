// Complete Demo - Pure DDOM Implementation
// Demonstrates all features of the new reactivity model in a single declarative object

export default {
	// Global reactive state - these automatically get transparent signal proxies
	counter: 0,
	userName: 'World',
	greeting: 'Hello',
	todoList: ['Learn DDOM', 'Build awesome apps'],

	// Demo methods that operate on the reactive state
	incrementCounter() {
		this.counter.set(this.counter.get() + 1);
	},

	resetCounter() {
		this.counter.set(0);
	},

	changeName() {
		const names = ['World', 'Universe', 'Developer', 'Friend', 'Explorer'];
		const newName = names.find(n => n !== this.userName.get()) || names[0];
		this.userName.set(newName);
	},

	changeGreeting() {
		const greetings = ['Hello', 'Hi', 'Hey', 'Greetings', 'Welcome'];
		const newGreeting = greetings.find(g => g !== this.greeting.get()) || greetings[0];
		this.greeting.set(newGreeting);
	},

	addTodo() {
		const todo = prompt('Enter a new todo:');
		if (todo) {
			// Note: In DDOM, array manipulation should create new arrays for reactivity
			this.todoList.set([...this.todoList.get(), todo]);
		}
	},

	clearTodos() {
		this.todoList.set([]);
	},

	updateMultipleProps() {
		// This demonstrates property-level reactivity - only changed properties update
		this.counter.set(this.counter.get() + 10);
		this.changeName();
		this.changeGreeting();
	},

	document: {
		head: {
			children: [
				{
					tagName: 'title',
					textContent: 'DDOM Complete Demo - Pure Implementation'
				},
				{
					tagName: 'meta',
					attributes: {
						charset: 'UTF-8'
					}
				},
				{
					tagName: 'meta',
					attributes: {
						name: 'viewport',
						content: 'width=device-width, initial-scale=1.0'
					}
				}
			]
		},

		body: {
			style: {
				fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
				margin: '0',
				padding: '20px',
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				minHeight: '100vh'
			},
			children: [
				{
					tagName: 'div',
					className: 'demo-container',
					style: {
						maxWidth: '1200px',
						margin: '0 auto',
						background: 'white',
						borderRadius: '12px',
						boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
						overflow: 'hidden'
					},
					children: [
						// Header
						{
							tagName: 'div',
							className: 'header',
							style: {
								background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
								color: 'white',
								padding: '30px',
								textAlign: 'center'
							},
							children: [
								{
									tagName: 'h1',
									textContent: '🚀 DDOM Complete Demo'
								},
								{
									tagName: 'h2',
									textContent: 'Pure Declarative Implementation'
								},
								{
									tagName: 'p',
									textContent: 'Everything in one DDOM object - no mixed HTML/JS!'
								}
							]
						},

						// Content
						{
							tagName: 'div',
							className: 'content',
							style: {
								padding: '30px'
							},
							children: [
								// Feature 1: Transparent Signal Proxies
								{
									tagName: 'div',
									className: 'feature-section',
									style: {
										marginBottom: '40px',
										padding: '20px',
										borderLeft: '4px solid #2196F3',
										background: '#f8f9fa',
										borderRadius: '0 8px 8px 0'
									},
									children: [
										{
											tagName: 'div',
											className: 'feature-title',
											textContent: '✨ 1. Transparent Signal Proxies',
											style: {
												color: '#2196F3',
												fontSize: '1.4em',
												marginBottom: '15px',
												fontWeight: '600'
											}
										},
										{
											tagName: 'p',
											textContent: 'Properties automatically get transparent signal proxies:'
										},
										{
											tagName: 'div',
											className: 'code-block',
											innerHTML: 'counter: 0  // ← Automatically becomes reactive',
											style: {
												background: '#263238',
												color: '#80cbc4',
												padding: '15px',
												borderRadius: '6px',
												margin: '10px 0',
												overflowX: 'auto',
												fontFamily: "'Consolas', 'Monaco', monospace",
												fontSize: '0.9em'
											}
										},
										{
											tagName: 'div',
											className: 'demo-controls',
											style: {
												display: 'flex',
												gap: '10px',
												flexWrap: 'wrap',
												margin: '15px 0'
											},
											children: [
												{
													tagName: 'button',
													className: 'btn btn-primary',
													textContent: 'Increment Counter',
													onclick: () => window.incrementCounter(),
													style: {
														padding: '10px 20px',
														border: 'none',
														borderRadius: '6px',
														cursor: 'pointer',
														fontWeight: '500',
														transition: 'transform 0.2s',
														background: '#2196F3',
														color: 'white'
													}
												},
												{
													tagName: 'button',
													className: 'btn btn-secondary',
													textContent: 'Reset Counter',
													onclick: () => window.resetCounter(),
													style: {
														padding: '10px 20px',
														border: 'none',
														borderRadius: '6px',
														cursor: 'pointer',
														fontWeight: '500',
														transition: 'transform 0.2s',
														background: '#6c757d',
														color: 'white'
													}
												}
											]
										}, {
											tagName: 'div',
											className: 'reactive-display',
											textContent: 'Counter: ${window.counter.get()}',
											style: {
												fontSize: '1.2em',
												fontWeight: 'bold',
												color: '#2196F3',
												padding: '15px',
												margin: '10px 0',
												background: '#e9ecef',
												borderRadius: '6px',
												border: '2px solid #dee2e6',
												transition: 'border-color 0.3s'
											}
										}
									]
								},

								// Feature 2: Template Literal Reactivity
								{
									tagName: 'div',
									className: 'feature-section',
									style: {
										marginBottom: '40px',
										padding: '20px',
										borderLeft: '4px solid #2196F3',
										background: '#f8f9fa',
										borderRadius: '0 8px 8px 0'
									},
									children: [
										{
											tagName: 'div',
											className: 'feature-title',
											textContent: '⚡ 2. Template Literal Reactivity',
											style: {
												color: '#2196F3',
												fontSize: '1.4em',
												marginBottom: '15px',
												fontWeight: '600'
											}
										},
										{
											tagName: 'p',
											textContent: 'Template literals with \\$\{...\} automatically get computed signals:'
										},
										{
											tagName: 'div',
											className: 'code-block',
											textContent: "textContent: 'Hello \\$\{this.name\}!'  // ← Automatic reactivity",
											style: {
												background: '#263238',
												color: '#80cbc4',
												padding: '15px',
												borderRadius: '6px',
												margin: '10px 0',
												overflowX: 'auto',
												fontFamily: "'Consolas', 'Monaco', monospace",
												fontSize: '0.9em'
											}
										},
										{
											tagName: 'div',
											className: 'demo-controls',
											style: {
												display: 'flex',
												gap: '10px',
												flexWrap: 'wrap',
												margin: '15px 0'
											},
											children: [
												{
													tagName: 'button',
													className: 'btn btn-primary',
													textContent: 'Change Name',
													onclick: () => window.changeName(),
													style: {
														padding: '10px 20px',
														border: 'none',
														borderRadius: '6px',
														cursor: 'pointer',
														fontWeight: '500',
														transition: 'transform 0.2s',
														background: '#2196F3',
														color: 'white'
													}
												},
												{
													tagName: 'button',
													className: 'btn btn-secondary',
													textContent: 'Change Greeting',
													onclick: () => window.changeGreeting(),
													style: {
														padding: '10px 20px',
														border: 'none',
														borderRadius: '6px',
														cursor: 'pointer',
														fontWeight: '500',
														transition: 'transform 0.2s',
														background: '#6c757d',
														color: 'white'
													}
												}
											]
										},
										{
											tagName: 'div',
											className: 'reactive-display', textContent: '${window.greeting.get()} ${window.userName.get()}!',
											style: {
												fontSize: '1.2em',
												fontWeight: 'bold',
												color: '#28a745',
												padding: '15px',
												margin: '10px 0',
												background: '#e9ecef',
												borderRadius: '6px',
												border: '2px solid #dee2e6',
												transition: 'border-color 0.3s'
											}
										}
									]
								},

								// Feature 3: Expressive Arrays
								{
									tagName: 'div',
									className: 'feature-section',
									style: {
										marginBottom: '40px',
										padding: '20px',
										borderLeft: '4px solid #2196F3',
										background: '#f8f9fa',
										borderRadius: '0 8px 8px 0'
									},
									children: [
										{
											tagName: 'div',
											className: 'feature-title',
											textContent: '🌐 3. Expressive Arrays',
											style: {
												color: '#2196F3',
												fontSize: '1.4em',
												marginBottom: '15px',
												fontWeight: '600'
											}
										},
										{
											tagName: 'p',
											textContent: 'Dynamic arrays with string address resolution:'
										},
										{
											tagName: 'div',
											className: 'code-block',
											innerHTML: "items: 'this.parentNode.todoList'  // ← String address",
											style: {
												background: '#263238',
												color: '#80cbc4',
												padding: '15px',
												borderRadius: '6px',
												margin: '10px 0',
												overflowX: 'auto',
												fontFamily: "'Consolas', 'Monaco', monospace",
												fontSize: '0.9em'
											}
										},
										{
											tagName: 'div',
											className: 'demo-controls',
											style: {
												display: 'flex',
												gap: '10px',
												flexWrap: 'wrap',
												margin: '15px 0'
											},
											children: [
												{
													tagName: 'button',
													className: 'btn btn-success',
													textContent: 'Add Todo',
													onclick: () => window.addTodo(),
													style: {
														padding: '10px 20px',
														border: 'none',
														borderRadius: '6px',
														cursor: 'pointer',
														fontWeight: '500',
														transition: 'transform 0.2s',
														background: '#28a745',
														color: 'white'
													}
												},
												{
													tagName: 'button',
													className: 'btn btn-danger',
													textContent: 'Clear All',
													onclick: () => window.clearTodos(),
													style: {
														padding: '10px 20px',
														border: 'none',
														borderRadius: '6px',
														cursor: 'pointer',
														fontWeight: '500',
														transition: 'transform 0.2s',
														background: '#dc3545',
														color: 'white'
													}
												}
											]
										},
										{
											tagName: 'div',
											className: 'reactive-display',
											style: {
												padding: '15px',
												margin: '10px 0',
												background: '#e9ecef',
												borderRadius: '6px',
												border: '2px solid #dee2e6',
												transition: 'border-color 0.3s'
											},
											children: {
												items: 'window.todoList',
												map: {
													tagName: 'div',
													className: 'todo-item',
													textContent: '• ${this}',
													item: (item) => item,
													style: {
														padding: '8px',
														margin: '4px 0',
														background: '#f0f8ff',
														borderLeft: '3px solid #2196F3',
														borderRadius: '0 4px 4px 0'
													}
												}
											}
										}
									]
								},

								// Feature 4: Protected Properties
								{
									tagName: 'div',
									className: 'feature-section',
									style: {
										marginBottom: '40px',
										padding: '20px',
										borderLeft: '4px solid #2196F3',
										background: '#f8f9fa',
										borderRadius: '0 8px 8px 0'
									},
									children: [
										{
											tagName: 'div',
											className: 'feature-title',
											textContent: '🔒 4. Protected Properties',
											style: {
												color: '#2196F3',
												fontSize: '1.4em',
												marginBottom: '15px',
												fontWeight: '600'
											}
										},
										{
											tagName: 'p',
											textContent: 'ID and tagName are protected - set once, never reactive:'
										},
										{
											tagName: 'div',
											className: 'code-block',
											innerHTML: "id: 'my-element'  // ← Set once, never reactive",
											style: {
												background: '#263238',
												color: '#80cbc4',
												padding: '15px',
												borderRadius: '6px',
												margin: '10px 0',
												overflowX: 'auto',
												fontFamily: "'Consolas', 'Monaco', monospace",
												fontSize: '0.9em'
											}
										},
										{
											tagName: 'div',
											className: 'reactive-display',
											id: 'protected-element',
											textContent: 'ID: ${this.id}, Tag: ${this.tagName}',
											style: {
												padding: '15px',
												margin: '10px 0',
												background: '#fff3cd',
												border: '1px solid #ffeaa7',
												borderRadius: '6px',
												transition: 'border-color 0.3s'
											}
										}
									]
								},

								// Feature 5: Property-Level Reactivity
								{
									tagName: 'div',
									className: 'feature-section',
									style: {
										marginBottom: '40px',
										padding: '20px',
										borderLeft: '4px solid #2196F3',
										background: '#f8f9fa',
										borderRadius: '0 8px 8px 0'
									},
									children: [
										{
											tagName: 'div',
											className: 'feature-title',
											textContent: '🎛️ 5. Property-Level Reactivity Only',
											style: {
												color: '#2196F3',
												fontSize: '1.4em',
												marginBottom: '15px',
												fontWeight: '600'
											}
										},
										{
											tagName: 'p',
											textContent: 'Each property manages its own reactivity - no component re-rendering:'
										},
										{
											tagName: 'div',
											className: 'demo-controls',
											style: {
												display: 'flex',
												gap: '10px',
												flexWrap: 'wrap',
												margin: '15px 0'
											},
											children: [
												{
													tagName: 'button',
													className: 'btn btn-primary',
													textContent: 'Update Multiple Properties',
													onclick: () => window.updateMultipleProps(),
													style: {
														padding: '10px 20px',
														border: 'none',
														borderRadius: '6px',
														cursor: 'pointer',
														fontWeight: '500',
														transition: 'transform 0.2s',
														background: '#2196F3',
														color: 'white'
													}
												}
											]
										},
										{
											tagName: 'div',
											className: 'reactive-display',
											style: {
												padding: '15px',
												margin: '10px 0',
												background: '#e9ecef',
												borderRadius: '6px',
												border: '2px solid #dee2e6',
												transition: 'border-color 0.3s'
											},
											children: [
												{
													tagName: 'div',
													textContent: 'Counter: ${window.counter.get()}',
													style: { color: '#2196F3', marginBottom: '5px' }
												},
												{
													tagName: 'div',
													textContent: 'Name: ${window.userName.get()}',
													style: { color: '#28a745', marginBottom: '5px' }
												},
												{
													tagName: 'div',
													textContent: 'Greeting: ${window.greeting.get()}',
													style: { color: '#ff9800' }
												}
											]
										}
									]
								}
							]
						}
					]
				}
			]
		}
	}
};
