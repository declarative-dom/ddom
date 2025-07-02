export default {
  $count: 0, // Another scoped State Signal
  $buttonText: '${$count.get() < 1 ? "Click Me!" : "Click me again!"}', // Becomes a scoped State Signal
  $alertMessage: 'You clicked the button ${$count.get() + 1} times!', // Becomes a scoped Computed Signal
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
          $localButtonText: 'local button text',
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
          onclick: () => {
            alert($alertMessage.get());
            $count.set($count.get() + 1); // Increment the count
          }
        },
      ],
    },
  },
};
