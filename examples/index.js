import basicExample from './basic.js';
import customElementsExample from './custom-elements.js';
import interactiveFormExample from './interactive-form.js';
import dynamicListExample from './dynamic-list.js';
import computedPropertiesExample from './computed-properties.js';
import jsesc from 'https://cdn.jsdelivr.net/npm/jsesc/+esm';
import { adoptWindow } from '../lib/dist/index.js';


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

  // Computed properties for shadow DOM preview generation
  currentExampleConfig: function () {
    // Return the config for the current example
    return window.examples[window.$currentExample.get()]?.config;
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
    {
      tagName: 'ddom-preview',
      
      // Shadow DOM enabled custom element for live preview     
      $exampleConfig: null,
      $previewDisposables: new Set(),
      
      style: {
        display: 'block',
        height: '100%',
        backgroundColor: 'white',
        border: 'none',
        overflow: 'auto',
      },
      
      // Shadow DOM content using template syntax
      children: [
        {
          tagName: 'template',
          shadowRootMode: 'open',
          style: {
            ':host': {
              display: 'block',
              height: '100%',
              background: 'white',
              overflow: 'auto',
            },
            
            '*': {
              boxSizing: 'border-box',
            },
            
            'main': {
              margin: '0',
              padding: '0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }
          },
          children: [
            {
              tagName: 'main',
              part: 'body',
              id: 'preview-container',
              style: {
                height: '100%',
                overflow: 'auto',
              }
            },
          ],
        },
      ],
      
      // Methods for managing preview lifecycle
      connectedCallback: function() {
        this.updatePreview();
        
        // Set up reactive effect to update preview when config changes
        if (window.effect) {
          this.effectCleanup = window.effect(() => {
            // Watch for changes to the example config
            this.$exampleConfig.get();
            // Update preview when config changes
            this.updatePreview();
          });
        }
      },
      
      disconnectedCallback: function() {
        this.cleanupPreview();
        // Clean up the reactive effect
        if (this.effectCleanup) {
          this.effectCleanup();
        }
      },
      
      updatePreview: function() {
        if (!this.$exampleConfig.get()) return;
        
        this.cleanupPreview();
        
        const container = this.shadowRoot.getElementById('preview-container');
        if (!container) return;
        
        try {
          // Create isolated context for the example
          const previewWindow = {
            document: container,
            addEventListener: container.addEventListener.bind(container),
            removeEventListener: container.removeEventListener.bind(container),
            setTimeout: window.setTimeout,
            clearTimeout: window.clearTimeout,
            setInterval: window.setInterval,
            clearInterval: window.clearInterval,
            requestAnimationFrame: window.requestAnimationFrame,
            cancelAnimationFrame: window.cancelAnimationFrame,
          };
          
          // Apply the example configuration to the isolated context
          const exampleConfig = this.$exampleConfig.get();
          
          // Adopt the example into the shadow DOM context
          this.adoptExample(previewWindow, exampleConfig);
          
        } catch (error) {
          console.error('Preview update failed:', error);
          container.innerHTML = `
            <div style="padding: 2rem; color: red; font-family: monospace;">
              <h3>Preview Error</h3>
              <pre>${error.message}</pre>
            </div>
          `;
        }
      },
      
      adoptExample: function(previewWindow, config) {
        // Clone the config to avoid mutations
        const clonedConfig = structuredClone(config);
        
        try {
          // Store reference for cleanup
          this.$previewDisposables.get().add(() => {
            const container = this.shadowRoot.getElementById('preview-container');
            if (container) container.innerHTML = '';
          });
          
          // Create a proxy window object that maps to our shadow DOM container
          const shadowWindow = this.createShadowWindowProxy(previewWindow, clonedConfig);
          
          // Use the actual DDOM adoptWindow function with our shadow window
          adoptWindow(clonedConfig, shadowWindow);
          
        } catch (error) {
          console.error('Failed to adopt example:', error);
          throw error;
        }
      },
      
      createShadowWindowProxy: function(previewWindow, config) {
        const container = this.shadowRoot.getElementById('preview-container');
        
        // Create a proxy that intercepts property access and maps to shadow DOM
        const shadowWindow = new Proxy(previewWindow, {
          get: (target, prop) => {
            // Map document to our shadow container context
            if (prop === 'document') {
              return {
                body: container,
                createElement: document.createElement.bind(document),
                createTextNode: document.createTextNode.bind(document),
                createDocumentFragment: document.createDocumentFragment.bind(document),
                querySelector: container.querySelector.bind(container),
                querySelectorAll: container.querySelectorAll.bind(container),
                getElementById: container.querySelector.bind(container, `#${arguments[0]}`),
                addEventListener: container.addEventListener.bind(container),
                removeEventListener: container.removeEventListener.bind(container),
              };
            }
            
            // Map global properties from config
            if (prop.startsWith('$') && config[prop] !== undefined) {
              return config[prop];
            }
            
            // Map functions from config
            if (typeof config[prop] === 'function') {
              return config[prop];
            }
            
            // Fall back to original window properties
            if (prop in target) {
              return target[prop];
            }
            
            // Fall back to main window for other properties
            return window[prop];
          },
          
          set: (target, prop, value) => {
            // Allow setting properties on the shadow window
            if (prop.startsWith('$')) {
              config[prop] = value;
              return true;
            }
            
            target[prop] = value;
            return true;
          }
        });
        
        return shadowWindow;
      },
      
      cleanupPreview: function() {
        // Clean up any disposables
        this.$previewDisposables.get().forEach(cleanup => {
          try {
            cleanup();
          } catch (e) {
            console.warn('Cleanup error:', e);
          }
        });
        this.$previewDisposables.get().clear();
      }
    }
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
                // Left side - shadow DOM preview with example
                {
                  tagName: 'ddom-preview',
                  $exampleConfig: '${window.currentExampleConfig()}',
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
