export default {
  $buttonText: 'Click Me!', // Becomes a scoped State Signal
  $alertMessage: 'You clicked the ${$buttonText.get()} button!', // Becomes a scoped Computed Signal
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
          style: { color: '#333', marginBottom: '1em' },
        },
        {
          tagName: 'p',
          textContent: 'This is a simple paragraph created declaratively.',
          style: { marginBottom: '1em' },
        },
        {
          tagName: 'button',
          textContent: '${$buttonText.get()}', // Reference the property
          style: {
            padding: '0.5em 1em',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            ':hover': { backgroundColor: '#007acc', color: 'white' },
          },
          onclick: (event) => {
            alert($alertMessage);
			$buttonText.set('Click me again!'); // Update the button text property
          },
        },
      ],
    },
  },
};
