import { describe, test, expect, beforeEach } from 'vitest';
import { createElement, Signal } from '../lib/dist/index.js';

describe('Basic Reactivity Example', () => {
  beforeEach(() => {
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      delete window.counter;
      delete window.message;
    }
  });

  test('should create reactive state using signals', () => {
    window.counter = new Signal.State(0);
    window.message = new Signal.State('Hello');

    expect(window.counter).toBeDefined();
    expect(window.message).toBeDefined();
    expect(window.counter.get()).toBe(0);
    expect(window.message.get()).toBe('Hello');
  });

  test('should create element with template literals', () => {
    window.counter = new Signal.State(0);
    window.message = new Signal.State('Hello');

    const testElement = createElement({
      tagName: 'div',
      textContent: 'Counter: ${window.counter.get()}, Message: ${window.message.get()}',
      count: 42,
      style: {
        padding: '20px',
        border: '1px solid #ccc',
        margin: '10px'
      }
    });

    expect(testElement).toBeDefined();
    expect(testElement.tagName.toLowerCase()).toBe('div');
    expect(testElement.count).toBe(42);
  });

  test('should handle signal updates', () => {
    window.counter = new Signal.State(0);
    window.message = new Signal.State('Hello');

    // Test signal updates
    window.counter.set(5);
    window.message.set('World');

    expect(window.counter.get()).toBe(5);
    expect(window.message.get()).toBe('World');
  });

  test('should create button elements with event handlers', () => {
    window.counter = new Signal.State(0);
    
    const button = createElement({
      tagName: 'button',
      textContent: 'Increment Counter',
      onclick: () => window.counter.set(window.counter.get() + 1)
    });

    expect(button).toBeDefined();
    expect(button.tagName.toLowerCase()).toBe('button');
    expect(typeof button.onclick).toBe('function');

    // Test the onclick handler
    const initialValue = window.counter.get();
    button.onclick();
    expect(window.counter.get()).toBe(initialValue + 1);
  });
});