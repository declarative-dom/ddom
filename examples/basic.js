export default {
	document: {
		body: {
			style: {
				fontFamily: 'Arial, sans-serif',
				padding: '2em',
			},
			children: [
				{
					tagName: 'h1',
					textContent: 'Basic Declarative DOM Example',
					style: { color: '#333', marginBottom: '1em' }
				},
				{
					tagName: 'p',
					textContent: 'This is a simple paragraph created declaratively.',
					style: { marginBottom: '1em' }
				},
				{
					tagName: 'button',
					text: 'Click Me!',  // Use property instead of attribute
					textContent: '${this.text.get()}', // Reference the property
					style: {
						padding: '0.5em 1em',
						backgroundColor: '#007bff',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
						':hover': { backgroundColor: '#007acc', color: 'white' }
					},
					onclick: (event) => { alert(`You clicked on the ${event.target.text.get()} button!`); }
				}
			]
		}
	}
}