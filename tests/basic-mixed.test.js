import { describe, test, expect } from 'vitest';
import { createElement, isMappedArrayExpr } from '../lib/dist/index.js';

describe('Basic Mixed Children Test', () => {
  test('verify that isMappedArrayExpr works correctly on mixed array elements', () => {
    const staticChild = { tagName: 'p', textContent: 'Static' };
    const dynamicChild = { items: ['A', 'B'], map: item => ({ tagName: 'span', textContent: item }) };
    
    expect(isMappedArrayExpr(staticChild)).toBe(false);
    expect(isMappedArrayExpr(dynamicChild)).toBe(true);
  });

  test('verify that static only children work', () => {
    const div = createElement({
      tagName: 'div',
      children: [
        { tagName: 'p', textContent: 'First' },
        { tagName: 'p', textContent: 'Second' }
      ]
    });
    
    expect(div.children.length).toBe(2);
    expect(div.children[0].textContent).toBe('First');
    expect(div.children[1].textContent).toBe('Second');
  });

  test('verify that dynamic only children work', () => {
    const div = createElement({
      tagName: 'div',
      children: [
        { items: ['A', 'B'], map: item => ({ tagName: 'span', textContent: item }) }
      ]
    });
    
    expect(div.children.length).toBe(2);
    expect(div.children[0].textContent).toBe('A');
    expect(div.children[1].textContent).toBe('B');
  });

  test('verify that mixed static and dynamic children work', () => {
    const div = createElement({
      tagName: 'div',
      children: [
        { tagName: 'p', textContent: 'Static Before' },
        { items: ['A', 'B'], map: item => ({ tagName: 'span', textContent: item }) },
        { tagName: 'p', textContent: 'Static After' }
      ]
    });
    
    expect(div.children.length).toBe(4); // 1 p + 2 spans + 1 p
    expect(div.children[0].tagName.toLowerCase()).toBe('p');
    expect(div.children[0].textContent).toBe('Static Before');
    expect(div.children[1].tagName.toLowerCase()).toBe('span');
    expect(div.children[1].textContent).toBe('A');
    expect(div.children[2].tagName.toLowerCase()).toBe('span');
    expect(div.children[2].textContent).toBe('B');
    expect(div.children[3].tagName.toLowerCase()).toBe('p');
    expect(div.children[3].textContent).toBe('Static After');
  });
});