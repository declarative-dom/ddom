import { describe, test, expect, beforeEach } from 'vitest';
import { createElement, adoptNode } from '../lib/dist/index.js';

describe('Named Function Arguments with Object Destructuring', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  test('createElement should work with options object', () => {
    const element = createElement({
      tagName: 'div',
      id: 'test-element',
      textContent: 'Hello World',
      className: 'test-class'
    }, {
      css: true,
      ignoreKeys: []
    });

    expect(element.tagName.toLowerCase()).toBe('div');
    expect(element.id).toBe('test-element');
    expect(element.textContent).toBe('Hello World');
    expect(element.className).toBe('test-class');
  });

  test('createElement should work with minimal options', () => {
    const element = createElement({
      tagName: 'span',
      textContent: 'Test Text'
    });

    expect(element.tagName.toLowerCase()).toBe('span');
    expect(element.textContent).toBe('Test Text');
  });

  test('createElement should respect ignoreKeys option', () => {
    const element = createElement({
      tagName: 'div',
      id: 'test-id',
      className: 'test-class',
      customProp: 'should-be-ignored'
    }, {
      ignoreKeys: ['customProp']
    });

    expect(element.id).toBe('test-id');
    expect(element.className).toBe('test-class');
    expect(element.customProp).toBeUndefined();
  });

  test('adoptNode should work with options object', () => {
    const element = document.createElement('div');
    container.appendChild(element);

    adoptNode({
      id: 'adopted-element',
      textContent: 'Adopted content',
      className: 'adopted-class'
    }, element, {
      css: true,
      ignoreKeys: []
    });

    expect(element.id).toBe('adopted-element');
    expect(element.textContent).toBe('Adopted content');
    expect(element.className).toBe('adopted-class');
  });

  test('adoptNode should work with default options', () => {
    const element = document.createElement('div');
    container.appendChild(element);

    adoptNode({
      textContent: 'Default options',
      title: 'Test title'
    }, element);

    expect(element.textContent).toBe('Default options');
    expect(element.title).toBe('Test title');
  });

  test('adoptNode should respect ignoreKeys in options', () => {
    const element = document.createElement('div');
    container.appendChild(element);

    adoptNode({
      id: 'should-be-set',
      className: 'should-be-ignored',
      textContent: 'content'
    }, element, {
      ignoreKeys: ['className']
    });

    expect(element.id).toBe('should-be-set');
    expect(element.textContent).toBe('content'); 
    expect(element.className).toBe(''); // Should remain empty
  });

  test('createElement with children should work with options', () => {
    const element = createElement({
      tagName: 'div',
      children: [
        {
          tagName: 'span',
          textContent: 'Child 1'
        },
        {
          tagName: 'span', 
          textContent: 'Child 2'
        }
      ]
    }, {
      css: true
    });

    expect(element.children.length).toBe(2);
    expect(element.children[0].textContent).toBe('Child 1');
    expect(element.children[1].textContent).toBe('Child 2');
  });
});