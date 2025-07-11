export default {
  $count: 0, // Scoped State Signal
  $buttonText: '${window.$count < 1 ? "Click Me!" : "Click me again!"}', // Becomes a scoped Computed Signal
  $statusMessage: 'You clicked the button ${window.$count} times!', // Another scoped Computed Signal
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
          textContent: '${window.$buttonText}', // Reference the property
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
            $count.set($count.get() + 1); // Increment the count
          }
        },
        {
          tagName: 'p',
          textContent: '${window.$statusMessage}', // Use the computed signal
          attributes: {
            hidden: function () {
              return window.$count.get() < 1; // Hide if count is less than 1
            }
          },
          style: { marginTop: '1em', color: '#555' },
        },
      ],
    },
  },
};
