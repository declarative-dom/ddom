// Complete Demo - Modular Custom Elements Implementation
// Demonstrates componentization with reusable custom elements

export default {
	// Global reactive state
	counter: 0,
	userName: 'World',
	greeting: 'Hello',
	todoList: ['Learn DDOM', 'Build awesome apps'],

	// Demo methods
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
			this.todoList.set([...this.todoList.get(), todo]);
		}
	},

	clearTodos() {
		this.todoList.set([]);
	},

	updateMultipleProps() {
		this.counter.set(this.counter.get() + 10);
		this.changeName();
		this.changeGreeting();
	},

	// Custom Element Definitions
	customElements: [
		// Demo Button Component
		{
			tagName: 'demo-button',
			variant: 'primary',
			text: 'Button',
			disabled: false,
			style: {
				display: 'inline-block',
				padding: '10px 20px',
				border: 'none',
				borderRadius: '6px',
				cursor: 'pointer',
				fontWeight: '500',
				transition: 'transform 0.2s',
				fontSize: '14px',
				textAlign: 'center',
				textDecoration: 'none',
				userSelect: 'none',
				// Variant-based styling
				'[variant="primary"]': {
					background: '#2196F3',
					color: 'white'
				},
				'[variant="secondary"]': {
					background: '#6c757d',
					color: 'white'
				},
				'[variant="success"]': {
					background: '#28a745',
					color: 'white'
				},
				'[variant="danger"]': {
					background: '#dc3545',
					color: 'white'
				},
				':hover:not([disabled])': {
					transform: 'translateY(-2px)',
					filter: 'brightness(1.1)'
				},
				'[disabled]': {
					opacity: '0.6',
					cursor: 'not-allowed',
					transform: 'none'
				}
			},
			textContent: '${this.text}',
			onclick: function(event) {
				if (!this.disabled && this.action) {
					this.action.call(this, event);
				}
			}
		},

		// Code Block Component
		{
			tagName: 'code-block',
			code: '',
			style: {
				display: 'block',
				background: '#263238',
				color: '#80cbc4',
				padding: '15px',
				borderRadius: '6px',
				margin: '10px 0',
				overflowX: 'auto',
				fontFamily: "'Consolas', 'Monaco', monospace",
				fontSize: '0.9em',
				border: '1px solid #37474f',
				boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
			},
			textContent: '${this.code}'
		},

		// Reactive Display Component
		{
			tagName: 'reactive-display',
			content: '',
			variant: 'default',
			style: {
				display: 'block',
				padding: '15px',
				margin: '10px 0',
				borderRadius: '6px',
				border: '2px solid #dee2e6',
				transition: 'border-color 0.3s, box-shadow 0.3s',
				fontSize: '1.1em',
				fontWeight: '500',
				// Variant-based styling
				'[variant="default"]': {
					background: '#e9ecef',
					color: '#495057'
				},
				'[variant="counter"]': {
					background: '#e3f2fd',
					color: '#1565c0',
					borderColor: '#2196F3'
				},
				'[variant="greeting"]': {
					background: '#e8f5e8',
					color: '#2e7d32',
					borderColor: '#4caf50'
				},
				'[variant="warning"]': {
					background: '#fff3cd',
					color: '#856404',
					borderColor: '#ffc107'
				},
				':hover': {
					boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
				}
			},
			textContent: '${this.content}'
		},

		// Feature Section Component
		{
			tagName: 'feature-section',
			title: '',
			icon: '✨',
			style: {
				display: 'block',
				marginBottom: '40px',
				padding: '25px',
				borderLeft: '4px solid #2196F3',
				background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
				borderRadius: '0 12px 12px 0',
				boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
				transition: 'transform 0.2s, box-shadow 0.2s',
				':hover': {
					transform: 'translateY(-2px)',
					boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
				}
			},
			children: [
				{
					tagName: 'div',
					className: 'feature-title',
					textContent: '${this.parentNode.icon} ${this.parentNode.title}',
					style: {
						color: '#2196F3',
						fontSize: '1.5em',
						marginBottom: '20px',
						fontWeight: '700',
						borderBottom: '2px solid #e3f2fd',
						paddingBottom: '10px'
					}
				}
			]
		},

		// Demo Controls Component
		{
			tagName: 'demo-controls',
			style: {
				display: 'flex',
				gap: '12px',
				flexWrap: 'wrap',
				margin: '20px 0',
				padding: '15px',
				background: '#f8f9fa',
				borderRadius: '8px',
				border: '1px solid #e9ecef'
			}
		},

		// Todo Item Component
		{
			tagName: 'todo-item',
			text: '',
			style: {
				display: 'block',
				padding: '12px',
				margin: '6px 0',
				background: 'linear-gradient(135deg, #f0f8ff 0%, #e3f2fd 100%)',
				borderLeft: '4px solid #2196F3',
				borderRadius: '0 8px 8px 0',
				transition: 'transform 0.2s, box-shadow 0.2s',
				fontSize: '0.95em',
				':hover': {
					transform: 'translateX(4px)',
					boxShadow: '2px 2px 8px rgba(33, 150, 243, 0.2)'
				}
			},
			textContent: '• ${this.text}'
		},

		// App Header Component
		{
			tagName: 'app-header',
			title: 'DDOM Demo',
			subtitle: 'Declarative Implementation',
			style: {
				display: 'block',
				background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
				color: 'white',
				padding: '40px',
				textAlign: 'center',
				position: 'relative',
				overflow: 'hidden',
				'::before': {
					content: '""',
					position: 'absolute',
					top: '0',
					left: '0',
					right: '0',
					bottom: '0',
					background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 50%)',
					pointerEvents: 'none'
				}
			},
			children: [
				{
					tagName: 'h1',
					textContent: '🚀 ${this.parentNode.title}',
					style: {
						margin: '0 0 10px 0',
						fontSize: '2.5em',
						fontWeight: '800',
						textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
					}
				},
				{
					tagName: 'h2',
					textContent: '${this.parentNode.subtitle}',
					style: {
						margin: '0 0 15px 0',
						fontSize: '1.3em',
						fontWeight: '400',
						opacity: '0.9'
					}
				},
				{
					tagName: 'p',
					textContent: 'Pure component-based architecture with custom elements',
					style: {
						margin: '0',
						fontSize: '1.1em',
						opacity: '0.8'
					}
				}
			]
		}
	],

	document: {
		head: {
			children: [
				{
					tagName: 'title',
					textContent: 'DDOM Complete Demo - Modular Components'
				},
				{
					tagName: 'meta',
					attributes: { charset: 'UTF-8' }
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
				minHeight: '100vh',
				lineHeight: '1.6'
			},
			children: [
				{
					tagName: 'div',
					className: 'demo-container',
					style: {
						maxWidth: '1200px',
						margin: '0 auto',
						background: 'white',
						borderRadius: '16px',
						boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
						overflow: 'hidden'
					},
					children: [
						// App Header
						{
							tagName: 'app-header',
							title: 'DDOM Complete Demo',
							subtitle: 'Modular Component Architecture'
						},

						// Main Content
						{
							tagName: 'div',
							className: 'content',
							style: {
								padding: '40px'
							},
							children: [
								// Feature 1: Signal Proxies
								{
									tagName: 'feature-section',
									title: '1. Transparent Signal Proxies',
									icon: '✨',
									children: [
										{
											tagName: 'p',
											textContent: 'Properties automatically become reactive signals:'
										},
										{
											tagName: 'code-block',
											code: 'counter: 0  // ← Automatically becomes reactive'
										},
										{
											tagName: 'demo-controls',
											children: [
												{
													tagName: 'demo-button',
													variant: 'primary',
													text: 'Increment Counter',
													action: () => window.incrementCounter()
												},
												{
													tagName: 'demo-button',
													variant: 'secondary',
													text: 'Reset Counter',
													action: () => window.resetCounter()
												}
											]
										},
										{
											tagName: 'reactive-display',
											variant: 'counter',
											content: 'Counter: ${window.counter.get()}'
										}
									]
								},

								// Feature 2: Template Reactivity
								{
									tagName: 'feature-section',
									title: '2. Template Literal Reactivity',
									icon: '⚡',
									children: [
										{
											tagName: 'p',
											textContent: 'Template literals with \\$\{...\} automatically get computed signals:'
										},
										{
											tagName: 'code-block',
											code: "textContent: 'Hello \\$\{this.name\}!'  // ← Automatic reactivity"
										},
										{
											tagName: 'demo-controls',
											children: [
												{
													tagName: 'demo-button',
													variant: 'primary',
													text: 'Change Name',
													action: () => window.changeName()
												},
												{
													tagName: 'demo-button',
													variant: 'secondary',
													text: 'Change Greeting',
													action: () => window.changeGreeting()
												}
											]
										},
										{
											tagName: 'reactive-display',
											variant: 'greeting',
											content: '${window.greeting.get()} ${window.userName.get()}!'
										}
									]
								},

								// Feature 3: Dynamic Arrays
								{
									tagName: 'feature-section',
									title: '3. Dynamic Arrays',
									icon: '🌐',
									children: [
										{
											tagName: 'p',
											textContent: 'Array binding with string address resolution:'
										},
										{
											tagName: 'code-block',
											code: "items: 'window.todoList'  // ← String address"
										},
										{
											tagName: 'demo-controls',
											children: [
												{
													tagName: 'demo-button',
													variant: 'success',
													text: 'Add Todo',
													action: () => window.addTodo()
												},
												{
													tagName: 'demo-button',
													variant: 'danger',
													text: 'Clear All',
													action: () => window.clearTodos()
												}
											]
										},
										{
											tagName: 'reactive-display',
											variant: 'default',
											style: {
												padding: '20px'
											},
											children: {
												items: 'window.todoList',
												map: {
													tagName: 'todo-item',
													text: (item) => item
												}
											}
										}
									]
								},

								// Feature 4: Protected Properties
								{
									tagName: 'feature-section',
									title: '4. Protected Properties',
									icon: '🔒',
									children: [
										{
											tagName: 'p',
											textContent: 'ID and tagName are protected - set once, never reactive:'
										},
										{
											tagName: 'code-block',
											code: "id: 'my-element'  // ← Set once, never reactive"
										},
										{
											tagName: 'reactive-display',
											variant: 'warning',
											id: 'protected-element',
											content: 'ID: ${this.id}, Tag: ${this.tagName}'
										}
									]
								},

								// Feature 5: Property-Level Reactivity
								{
									tagName: 'feature-section',
									title: '5. Property-Level Reactivity',
									icon: '🎛️',
									children: [
										{
											tagName: 'p',
											textContent: 'Each property manages its own reactivity - no component re-rendering:'
										},
										{
											tagName: 'demo-controls',
											children: [
												{
													tagName: 'demo-button',
													variant: 'primary',
													text: 'Update Multiple Properties',
													action: () => window.updateMultipleProps()
												}
											]
										},
										{
											tagName: 'reactive-display',
											variant: 'default',
											children: [
												{
													tagName: 'div',
													textContent: 'Counter: ${window.counter.get()}',
													style: { 
														color: '#2196F3', 
														marginBottom: '8px',
														fontSize: '1.1em'
													}
												},
												{
													tagName: 'div',
													textContent: 'Name: ${window.userName.get()}',
													style: { 
														color: '#28a745', 
														marginBottom: '8px',
														fontSize: '1.1em'
													}
												},
												{
													tagName: 'div',
													textContent: 'Greeting: ${window.greeting.get()}',
													style: { 
														color: '#ff9800',
														fontSize: '1.1em'
													}
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
