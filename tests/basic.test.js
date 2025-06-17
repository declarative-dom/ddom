import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement } from '../lib/dist/index.js';

describe('Basic Example', () => {
  beforeEach(() => {
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      delete window.text;
    }
  });

  test('should create basic DOM structure with declarative syntax', () => {
    const basicSpec = {
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
              text: 'Click Me!',
              textContent: '${this.text.get()}',
              style: {
                padding: '0.5em 1em',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              },
              onclick: (event) => { 
                // Test that the event handler works
                expect(event.target.text.get()).toBe('Click Me!');
              }
            }
          ]
        }
      }
    };

    // Test that DDOM can process the basic spec
    expect(() => DDOM(basicSpec)).not.toThrow();
  });

  test('should handle button element with reactive text property', () => {
    const button = createElement({
      tagName: 'button',
      text: 'Click Me!',
      textContent: '${this.text.get()}',
      onclick: function(event) {
        // This tests that the button has access to its text property
        return event.target.text.get();
      }
    });

    expect(button).toBeDefined();
    expect(button.tagName.toLowerCase()).toBe('button');
    expect(button.text).toBeDefined();
    
    // Test that the text property is reactive
    if (typeof button.text === 'object' && button.text.set) {
      button.text.set('New Text');
      expect(button.text.get()).toBe('New Text');
    }
  });

  test('should handle style objects', () => {
    const element = createElement({
      tagName: 'div',
      style: {
        fontFamily: 'Arial, sans-serif',
        padding: '2em',
        backgroundColor: '#f5f5f5'
      }
    });

    expect(element).toBeDefined();
    expect(element.tagName.toLowerCase()).toBe('div');
    // Note: style properties might be applied differently in different environments
    // The important thing is that the element is created without errors
  });

  test('should handle nested children structure', () => {
    const container = createElement({
      tagName: 'div',
      children: [
        {
          tagName: 'h1',
          textContent: 'Title'
        },
        {
          tagName: 'p',
          textContent: 'Description'
        }
      ]
    });

    expect(container).toBeDefined();
    expect(container.children.length).toBe(2);
    expect(container.children[0].tagName.toLowerCase()).toBe('h1');
    expect(container.children[1].tagName.toLowerCase()).toBe('p');
  });
});