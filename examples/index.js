import basicExample from './basic.js';
import customElementsExample from './custom-elements.js';
import interactiveFormExample from './interactive-form.js';
import dynamicListExample from './dynamic-list.js';
import computedPropertiesExample from './computed-properties.js';
import jsesc from 'https://cdn.jsdelivr.net/npm/jsesc/+esm';


export default {
  examples: {
    basic: { name: 'Basic Example', config: basicExample, path: '/basic.html' },
    'custom-elements': {
      name: 'Custom Elements',
      config: customElementsExample,
      path: '/custom-elements.html',
    },
    'interactive-form': {
      name: 'Interactive Form',
      config: interactiveFormExample,
      path: '/interactive-form.html',
    },
    'dynamic-list': {
      name: 'Dynamic List',
      config: dynamicListExample,
      path: '/dynamic-list.html',
    },
    'computed-properties': {
      name: 'Computed Properties',
      config: computedPropertiesExample,
      path: '/computed-properties.html',
    },
  },

  // Reactive current example
  $currentExample: 'basic',

  // Computed properties for iframe content generation
  currentExampleConfig: function () {
    // Return the config for the current example
    return window.examples[window.$currentExample.get()]?.config;
  },

  currentExampleURL: function () {
    return window.examples[window.$currentExample.get()]?.path;
  },

  currentExampleJSON: function () {
    return jsesc(window.currentExampleConfig(), {
      compact: false,
      json: false,
      wrap: true,
      es6: true,
      indent: '  ',
    });
  },

  customElements: [
    {
      tagName: 'nav-button',

      // Scoped & Reactive Properties
      $label: '',
      $example: '',
      $active: false,

      attributes: {
        'data-active': '${this.$active.get()}',
      },

      style: {
        display: 'block',

        // Active/inactive button styling using attributes
        '[data-active="true"] button': {
          backgroundColor: '#007bff',
          color: 'white',
        },
        '[data-active="false"] button': {
          backgroundColor: 'white',
          color: '#007bff',
        },
      },

      children: [
        {
          tagName: 'button',
          textContent: '${this.$label.get()}', // Use the reactive label property
          style: {
            padding: '0.5em 1em',
            border: '1px solid #007bff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.9em',
            transition: 'all 0.2s',
          },
          onclick: function () {
            window.switchExample(this.$example.get());
          },
        },
      ],
    },
  ],

  switchExample: function (exampleKey) {
    window.$currentExample.set(exampleKey);
  },

  document: {
    body: {
      style: {
        fontFamily: 'Arial, sans-serif',
        margin: '0',
        padding: '0',
        backgroundColor: '#f8f9fa',
      },
      children: [
        {
          tagName: 'header',
          style: {
            backgroundColor: '#343a40',
            color: 'white',
            padding: '1em 2em',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
          children: [
            {
              tagName: 'h1',
              textContent: 'Declarative DOM Examples',
              style: { margin: '0', fontSize: '1.5em' },
            },
          ],
        },
        {
          tagName: 'nav',
          style: {
            backgroundColor: 'white',
            padding: '1em 2em',
            borderBottom: '1px solid #dee2e6',
          },
          children: [
            {
              tagName: 'div',
              style: {
                display: 'flex',
                gap: '1em',
                flexWrap: 'wrap',
              },
              children: [
                {
                  tagName: 'nav-button',
                  id: 'nav-basic',
                  $label: 'Basic Example',
                  $example: 'basic',
                  $active: '${window.$currentExample.get() === "basic"}',
                },
                {
                  tagName: 'nav-button',
                  id: 'nav-custom-elements',
                  $label: 'Custom Elements',
                  $example: 'custom-elements',
                  $active:
                    '${window.$currentExample.get() === "custom-elements"}',
                },
                {
                  tagName: 'nav-button',
                  id: 'nav-interactive-form',
                  $label: 'Interactive Form',
                  $example: 'interactive-form',
                  $active:
                    '${window.$currentExample.get() === "interactive-form"}',
                },
                {
                  tagName: 'nav-button',
                  id: 'nav-dynamic-list',
                  $label: 'Dynamic List',
                  $example: 'dynamic-list',
                  $active: '${window.$currentExample.get() === "dynamic-list"}',
                },
                {
                  tagName: 'nav-button',
                  id: 'nav-computed-properties',
                  $label: 'Computed Properties',
                  $example: 'computed-properties',
                  $active:
                    '${window.$currentExample.get() === "computed-properties"}',
                },
              ],
            },
          ],
        },
        {
          tagName: 'main',
          style: {
            height: 'calc(100vh - 120px)',
          },
          children: [
            {
              tagName: 'div',
              style: {
                display: 'flex',
                height: '100%',
                gap: '1px',
                backgroundColor: '#dee2e6',
              },
              children: [
                // Left side - iframe with example
                {
                  tagName: 'iframe',
                  src: '${window.currentExampleURL()}',
                  style: {
                    flex: '1',
                    border: 'none',
                    backgroundColor: 'white',
                  },
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
                    lineHeight: '1.4',
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
                        fontSize: '1em',
                      },
                    },
                    {
                      tagName: 'pre',
                      id: 'config-display',
                      textContent: '${window.currentExampleJSON()}',
                      style: {
                        backgroundColor: '#ffffff',
                        border: '1px solid #dee2e6',
                        borderRadius: '4px',
                        padding: '1rem',
                        margin: '0',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
};
