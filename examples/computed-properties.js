// Computed Properties Example
// Demonstrates how DDOM supports computed properties using native JavaScript getters

export default {
  customElements: [
    {
      tagName: 'user-card',

      // Reactive properties
      $firstName: 'John',
      $lastName: 'Doe',
      $score: 85,
      $level: 1,

      // Computed properties using native ES6+ getter syntax

      // Native getter function syntax (more familiar to developers)
      $fullName: function () {
        return `${this.$firstName.get()} ${this.$lastName.get()}`;
      },

      $displayTitle: function () {
        const score = this.$score.get();
        const level = this.$level.get();
        if (score >= 90) return `Expert (Level ${level})`;
        if (score >= 70) return `Advanced (Level ${level})`;
        if (score >= 50) return `Intermediate (Level ${level})`;
        return `Beginner (Level ${level})`;
      },

      $badgeColor: function () {
        const score = this.$score.get();
        if (score >= 90) return '#28a745'; // green
        if (score >= 70) return '#007bff'; // blue
        if (score >= 50) return '#ffc107'; // yellow
        return '#6c757d'; // gray
      },

      $progressPercentage: function () {
        return Math.min(100, Math.max(0, this.$score.get()));
      },

      // Computed property for level attribute
      $levelClass: function () {
        const score = this.$score.get();
        if (score >= 90) return 'expert';
        if (score >= 70) return 'advanced';
        if (score >= 50) return 'intermediate';
        return 'beginner';
      },

      attributes: {
        // Use data attributes for CSS styling
        'data-level': '${this.$levelClass()}',
        'data-score': '${this.$score.get()}',
        'data-progress': '${this.$progressPercentage()}',
      },

      style: {
        display: 'block',
        maxWidth: '400px',
        margin: '1em auto',
        padding: '1.5em',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontFamily: 'system-ui, sans-serif',

        // Level-based styling using attribute selectors
        '[data-level="beginner"] .badge': {
          backgroundColor: '#6c757d',
        },
        '[data-level="intermediate"] .badge': {
          backgroundColor: '#ffc107',
        },
        '[data-level="advanced"] .badge': {
          backgroundColor: '#007bff',
        },
        '[data-level="expert"] .badge': {
          backgroundColor: '#28a745',
        },

        '[data-level="beginner"] .level-text': {
          color: '#6c757d',
        },
        '[data-level="intermediate"] .level-text': {
          color: '#ffc107',
        },
        '[data-level="advanced"] .level-text': {
          color: '#007bff',
        },
        '[data-level="expert"] .level-text': {
          color: '#28a745',
        },

        '[data-level="beginner"] .progress-bar': {
          backgroundColor: '#6c757d',
        },
        '[data-level="intermediate"] .progress-bar': {
          backgroundColor: '#ffc107',
        },
        '[data-level="advanced"] .progress-bar': {
          backgroundColor: '#007bff',
        },
        '[data-level="expert"] .progress-bar': {
          backgroundColor: '#28a745',
        },

        // Progress width using CSS attr() function
        '--progress': 'attr(data-progress %)',
        '.progress-bar': {
          width: 'var(--progress)',
        },
      },

      children: [
        {
          tagName: 'div',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1em',
            marginBottom: '1em',
          },
          children: [
            {
              tagName: 'div',
              className: 'badge',
              style: {
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.2em',
              },
              textContent: '${this.$level.get()}',
            },
            {
              tagName: 'div',
              style: {
                flex: '1',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: '0.25em',
              },
              children: [
                {
                  tagName: 'h3',
                  textContent: '${this.$fullName()}',
                  style: {
                    margin: '0 0 0.25em 0',
                    fontSize: '1.25em',
                    color: '#333',
                  },
                },
                {
                  tagName: 'div',
                  className: 'level-text',
                  textContent:
                    '${this.$displayTitle()}',
                  style: {
                    fontWeight: '500',
                    fontSize: '0.9em',
                  },
                },
              ],
            },
          ],
        },
        {
          tagName: 'div',
          style: {
            marginBottom: '1em',
          },
          children: [
            {
              tagName: 'div',
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5em',
              },
              children: [
                {
                  tagName: 'span',
                  textContent: 'Progress',
                  style: { fontSize: '0.9em', color: '#666' },
                },
                {
                  tagName: 'span',
                  textContent:
                    '${this.$score.get()}%',
                  style: {
                    fontSize: '0.9em',
                    fontWeight: '500',
                  },
                },
              ],
            },
            {
              tagName: 'div',
              style: {
                width: '100%',
                height: '8px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                overflow: 'hidden',
              },
              children: [
                {
                  tagName: 'div',
                  className: 'progress-bar',
                  style: {
                    height: '100%',
                    transition: 'width 0.3s ease',
                  },
                },
              ],
            },
          ],
        },
        {
          tagName: 'div',
          style: {
            display: 'flex',
            gap: '0.5em',
          },
          children: [
            {
              tagName: 'button',
              textContent: '+10 Score',
              style: {
                padding: '0.5em 1em',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#28a745',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.85em',
                ':hover': {
                  backgroundColor: '#218838',
                },
              },
              onclick: function () {
                const currentScore = this.$score.get();
                this.$score.set(Math.min(100, currentScore + 10));

                // Level up logic
                if (this.$score.get() >= this.$level.get() * 20) {
                  this.$level.set(this.$level.get() + 1);
                }
              },
            },
            {
              tagName: 'button',
              textContent: '-10 Score',
              style: {
                padding: '0.5em 1em',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: '#dc3545',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.85em',
                ':hover': {
                  backgroundColor: '#c82333',
                },
              },
              onclick: function () {
                const currentScore = this.$score.get();
                this.$score.set(Math.max(0, currentScore - 10));
              },
            },
            {
              tagName: 'button',
              textContent: 'Change Name',
              style: {
                padding: '0.5em 1em',
                border: '1px solid #007bff',
                borderRadius: '4px',
                backgroundColor: 'white',
                color: '#007bff',
                cursor: 'pointer',
                fontSize: '0.85em',
                ':hover': {
                  backgroundColor: '#f8f9fa',
                },
              },
              onclick: function () {
                const names = [
                  { first: 'Jane', last: 'Smith' },
                  { first: 'Bob', last: 'Johnson' },
                  { first: 'Alice', last: 'Wilson' },
                  { first: 'John', last: 'Doe' },
                ];
                const randomName =
                  names[Math.floor(Math.random() * names.length)];
                this.$firstName.set(randomName.first);
                this.$lastName.set(randomName.last);
              },
            },
          ],
        },
      ],
    },
  ],

  document: {
    head: {
      title: 'Computed Properties Example',
    },
    body: {
      style: {
        fontFamily: 'system-ui, sans-serif',
        padding: '2em',
        backgroundColor: '#f8f9fa',
        margin: '0',
        lineHeight: '1.6',
      },
      children: [
        {
          tagName: 'h1',
          textContent: 'Computed Properties Example',
          style: {
            textAlign: 'center',
            color: '#333',
            marginBottom: '0.5em',
          },
        },
        {
          tagName: 'p',
          textContent:
            'This example demonstrates computed properties using native JavaScript getters. The user card below shows how computed properties automatically update when their dependencies change.',
          style: {
            textAlign: 'center',
            color: '#666',
            maxWidth: '600px',
            margin: '0 auto 2em',
          },
        },
        {
          tagName: 'user-card',
        },
        {
          tagName: 'div',
          style: {
            maxWidth: '600px',
            margin: '2em auto',
            padding: '1.5em',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '1px solid #ddd',
          },
          children: [
            {
              tagName: 'h3',
              textContent: 'Computed Properties Features',
              style: { marginTop: '0', color: '#333' },
            },
            {
              tagName: 'ul',
              style: { color: '#666', lineHeight: '1.8' },
              children: [
                {
                  tagName: 'li',
                  textContent:
                    'Native JavaScript getter syntax: { get() { return ... } }',
                },
                {
                  tagName: 'li',
                  textContent:
                    'Automatic reactivity with reactive signals ($properties)',
                },
                {
                  tagName: 'li',
                  textContent:
                    'Complex computed logic ($fullName, $displayTitle, $badgeColor)',
                },
                {
                  tagName: 'li',
                  textContent:
                    'Template expressions can access computed properties',
                },
                {
                  tagName: 'li',
                  textContent: 'Real-time updates when dependencies change',
                },
              ],
            },
          ],
        },
      ],
    },
  },
};
