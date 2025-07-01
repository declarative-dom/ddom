import { describe, test, expect, beforeEach } from 'vitest';
import { adoptNode, createElement } from '../lib/dist/index.js';

describe('DOMSpecOptions Pass-through Test', () => {
  let container;

  beforeEach(() => {
    // Create a clean container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  test('should pass options to nested adoptNode calls', () => {
    // Test that options are passed through to window handler
    // The window handler should call adoptNode with the passed options
    adoptNode({
      window: {
        document: {
          title: 'New Title'
        }
      }
    }, window, {
      css: false,
      ignoreKeys: []
    });

    // The document title should be set through the window handler
    expect(document.title).toBe('New Title');
  });

  test('should pass options through to body handler', () => {
    // Test that options flow through to body handler
    adoptNode({
      body: {
        className: 'test-class',
        customBodyProp: 'should be ignored'
      }
    }, document, {
      css: false,
      ignoreKeys: ['customBodyProp']
    });

    expect(document.body.className).toBe('test-class');
    expect(document.body.customBodyProp).toBeUndefined();
  });

  test('should pass options through to head handler', () => {
    // Test that options flow through to head handler  
    adoptNode({
      head: {
        className: 'head-class',
        customHeadProp: 'should be ignored'
      }
    }, document, {
      css: false,
      ignoreKeys: ['customHeadProp']
    });

    expect(document.head.className).toBe('head-class');
    expect(document.head.customHeadProp).toBeUndefined();
  });

  test('should respect css option in style handler', () => {
    const element = createElement({
      tagName: 'div',
      id: 'test-element',
      style: {
        color: 'red',
        backgroundColor: 'blue'
      }
    }, {
      css: false // This should prevent style processing
    });

    // Since CSS processing is disabled, styles should not be applied
    // The element should still be created but without style processing
    expect(element.id).toBe('test-element');
    expect(element.tagName.toLowerCase()).toBe('div');
  });

  test('should handle options in processProperty correctly', () => {
    // Test that options are handled correctly in individual property processing
    const element = document.createElement('div');
    container.appendChild(element);

    adoptNode({
      textContent: 'Hello World',
      className: 'test-class',
      ignoredProp: 'should not be set'
    }, element, {
      css: true,
      ignoreKeys: ['ignoredProp']
    });

    expect(element.textContent).toBe('Hello World');
    expect(element.className).toBe('test-class');
    expect(element.ignoredProp).toBeUndefined();
  });
});