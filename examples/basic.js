export default {
  $count: 0, // Another scoped State Signal
  $buttonText: '${$count.get() < 1 ? "Click Me!" : "Click me again!"}', // Becomes a scoped State Signal
  $statusMessage: 'You clicked the button ${$count.get()} times!', // Becomes a scoped Computed Signal
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
            $count.set($count.get() + 1); // Increment the count
          }
        },
        {
          tagName: 'p',
          textContent: '${$statusMessage.get()}', // Use the computed signal
          attributes: {
            hidden: function () {
              return $count.get() < 1; // Hide if count is less than 1
            }
          },
          style: { marginTop: '1em', color: '#555' },
        },
      ],
    },
  },
};
