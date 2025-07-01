import { describe, test, expect } from 'vitest';
import { createElement } from '../lib/dist/index.js';

describe('Manual Mixed Children Debug', () => {
  test('manually create and inspect mixed children', () => {
    // Let me manually create an element and inspect what happens
    const element = document.createElement('div');
    
    // Test static children first
    const staticChild = createElement({
      tagName: 'p',
      textContent: 'Static paragraph'
    });
    
    element.appendChild(staticChild);
    expect(element.children.length).toBe(1);
    
    // Now let's test if the array version works
    const mixedDiv = createElement({
      tagName: 'div',
      children: [
        { tagName: 'span', textContent: 'Static span' }
      ]
    });
    
    console.log('Mixed div children:', mixedDiv.children.length);
    console.log('Mixed div innerHTML:', mixedDiv.innerHTML);
    
    expect(mixedDiv.children.length).toBe(1);
    expect(mixedDiv.children[0].textContent).toBe('Static span');
  });

  test('test mixed static and dynamic children', () => {
    const mixedDiv = createElement({
      tagName: 'div',
      children: [
        { tagName: 'p', textContent: 'Static paragraph' },
        { 
          items: ['Item 1', 'Item 2'],
          map: (item) => ({
            tagName: 'span',
            textContent: item
          })
        }
      ]
    });
    
    console.log('Real mixed div children:', mixedDiv.children.length);
    console.log('Real mixed div innerHTML:', mixedDiv.innerHTML);
    
    // This should have 3 children: 1 p + 2 spans
    expect(mixedDiv.children.length).toBe(3);
  });
});