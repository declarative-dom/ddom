import { describe, test, expect } from 'vitest';
import { createElement } from '../lib/dist/index.js';

describe('Debug Mixed Children', () => {
  test('debug simple mixed children', () => {
    const div = createElement({
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

    console.log('Div children length:', div.children.length);
    console.log('Div innerHTML:', div.innerHTML);
    for (let i = 0; i < div.children.length; i++) {
      console.log(`Child ${i}:`, div.children[i].tagName, div.children[i].textContent);
    }

    expect(div.children.length).toBe(3); // 1 p + 2 spans
  });

  test('debug single mapped array', () => {
    const div = createElement({
      tagName: 'div',
      children: {
        items: ['Item 1', 'Item 2'],
        map: (item) => ({
          tagName: 'span',
          textContent: item
        })
      }
    });

    console.log('Single mapped div children length:', div.children.length);
    console.log('Single mapped div innerHTML:', div.innerHTML);
    
    expect(div.children.length).toBe(2);
  });
});