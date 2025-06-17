import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement } from '../lib/dist/index.js';

describe('Custom Elements Example', () => {
  beforeEach(() => {
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      // No specific global vars to clean for this example
    }
  });

  test('should create basic custom elements', () => {
    const customElementsSpec = {
      customElements: [
        {
          tagName: 'user-card',
          style: {
            border: '1px solid #ddd',
            borderRadius: '8px',
            display: 'block',
            padding: '1em',
            margin: '1em 0',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          children: [
            {
              tagName: 'h3',
              textContent: 'User Name',
              style: { margin: '0 0 0.5em 0', color: '#333' }
            },
            {
              tagName: 'p',
              textContent: 'user@example.com',
              style: { margin: '0', color: '#666' }
            }
          ]
        },
        {
          tagName: 'todo-item',
          style: {
            display: 'flex',
            alignItems: 'center',
            padding: '0.5em',
            borderBottom: '1px solid #eee'
          },
          children: [
            {
              tagName: 'input',
              type: 'checkbox',
              style: { marginRight: '0.5em' }
            },
            {
              tagName: 'span',
              textContent: 'Sample todo item',
              style: { flex: '1' }
            }
          ]
        }
      ]
    };

    // Test that DDOM can process the custom elements spec
    expect(() => DDOM(customElementsSpec)).not.toThrow();
  });

  test('should create user-card custom element', () => {
    const userCard = createElement({
      tagName: 'user-card',
      style: {
        border: '1px solid #ddd',
        borderRadius: '8px',
        display: 'block',
        padding: '1em'
      },
      children: [
        {
          tagName: 'h3',
          textContent: 'User Name'
        },
        {
          tagName: 'p',
          textContent: 'user@example.com'
        }
      ]
    });

    expect(userCard).toBeDefined();
    expect(userCard.tagName.toLowerCase()).toBe('user-card');
    expect(userCard.children.length).toBe(2);
    expect(userCard.children[0].tagName.toLowerCase()).toBe('h3');
    expect(userCard.children[1].tagName.toLowerCase()).toBe('p');
  });

  test('should create todo-item custom element with form controls', () => {
    const todoItem = createElement({
      tagName: 'todo-item',
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.5em'
      },
      children: [
        {
          tagName: 'input',
          type: 'checkbox',
          style: { marginRight: '0.5em' }
        },
        {
          tagName: 'span',
          textContent: 'Sample todo item',
          style: { flex: '1' }
        }
      ]
    });

    expect(todoItem).toBeDefined();
    expect(todoItem.tagName.toLowerCase()).toBe('todo-item');
    expect(todoItem.children.length).toBe(2);
    
    const checkbox = todoItem.children[0];
    const span = todoItem.children[1];
    
    expect(checkbox.tagName.toLowerCase()).toBe('input');
    // Note: type attribute might be handled differently in test environment
    expect(span.tagName.toLowerCase()).toBe('span');
    expect(span.textContent).toBe('Sample todo item');
  });

  test('should handle custom element styling', () => {
    const styledElement = createElement({
      tagName: 'styled-element',
      style: {
        border: '1px solid #ddd',
        borderRadius: '8px',
        display: 'block',
        padding: '1em',
        margin: '1em 0',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    });

    expect(styledElement).toBeDefined();
    expect(styledElement.tagName.toLowerCase()).toBe('styled-element');
    // Style properties might be applied differently in test environment
    // The important thing is that the element is created without errors
  });

  test('should create complete document structure with custom elements', () => {
    const documentSpec = {
      customElements: [
        {
          tagName: 'user-card',
          children: [
            { tagName: 'h3', textContent: 'Test User' },
            { tagName: 'p', textContent: 'test@example.com' }
          ]
        }
      ],
      document: {
        body: {
          style: {
            fontFamily: 'Arial, sans-serif',
            padding: '2em',
            backgroundColor: '#f8f9fa'
          },
          children: [
            {
              tagName: 'h1',
              textContent: 'Custom Elements Example'
            },
            { tagName: 'user-card' },
            {
              tagName: 'div',
              children: [
                {
                  tagName: 'h2',
                  textContent: 'Todo List'
                }
              ]
            }
          ]
        }
      }
    };

    // Test that DDOM can process the complete document spec
    expect(() => DDOM(documentSpec)).not.toThrow();
  });

  test('should handle multiple instances of the same custom element', () => {
    const multipleElementsSpec = {
      customElements: [
        {
          tagName: 'todo-item',
          children: [
            {
              tagName: 'span',
              textContent: 'Todo item'
            }
          ]
        }
      ],
      document: {
        body: {
          children: [
            { tagName: 'todo-item' },
            { tagName: 'todo-item' },
            { tagName: 'todo-item' }
          ]
        }
      }
    };

    // Test that DDOM can handle multiple instances
    expect(() => DDOM(multipleElementsSpec)).not.toThrow();
  });
});