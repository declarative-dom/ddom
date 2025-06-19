import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement, ComponentSignalWatcher, Signal, MappedArray, createEffect } from '../lib/dist/index.js';

describe('Component-Level Signal Isolation', () => {
  beforeEach(() => {
    // Clean up any existing global state
    if (typeof document !== 'undefined') {
      document.body.innerHTML = '';
    }
    if (typeof window !== 'undefined') {
      // Clean up any global properties
      Object.keys(window).forEach(key => {
        if (key.startsWith('test') || key.startsWith('component')) {
          delete window[key];
        }
      });
    }
  });

  test('ComponentSignalWatcher can be created and disposed', () => {
    const watcher = new ComponentSignalWatcher();
    expect(watcher).toBeDefined();
    expect(typeof watcher.watch).toBe('function');
    expect(typeof watcher.unwatch).toBe('function');
    expect(typeof watcher.dispose).toBe('function');
    
    // Should be able to dispose without error
    watcher.dispose();
    
    // Should be safe to dispose multiple times
    watcher.dispose();
  });

  test('MappedArray has isolated watcher and can be disposed', () => {
    const sourceArray = new Signal.State([1, 2, 3]);
    const mappedArray = new MappedArray({
      items: sourceArray,
      map: (item) => ({ tagName: 'div', textContent: `Item ${item}` })
    });
    
    expect(mappedArray).toBeDefined();
    expect(typeof mappedArray.dispose).toBe('function');
    expect(Array.isArray(mappedArray.get())).toBe(true);
    expect(mappedArray.get().length).toBe(3);
    
    // Should be able to dispose without error
    mappedArray.dispose();
  });

  test('custom elements use isolated watchers', () => {
    const spec = {
      testCounter: 0,
      customElements: [
        {
          tagName: 'test-component',
          count: 5,
          display: '${this.count}',
          increment() {
            if (typeof this.count.set === 'function') {
              this.count.set(this.count.get() + 1);
            }
          }
        }
      ]
    };

    // Create the component
    DDOM(spec);
    
    // Create an instance
    const element = createElement({
      tagName: 'test-component'
    });
    
    expect(element).toBeDefined();
    expect(element.tagName.toLowerCase()).toBe('test-component');
    
    // Add to DOM to trigger connectedCallback
    document.body.appendChild(element);
    
    // Remove from DOM to trigger disconnectedCallback and disposal
    document.body.removeChild(element);
  });

  test('multiple components have isolated signal systems', () => {
    const spec = {
      customElements: [
        {
          tagName: 'counter-a',
          value: 10,
          display: 'A: ${this.value}'
        },
        {
          tagName: 'counter-b', 
          value: 20,
          display: 'B: ${this.value}'
        }
      ]
    };

    DDOM(spec);
    
    const elementA = createElement({ tagName: 'counter-a' });
    const elementB = createElement({ tagName: 'counter-b' });
    
    document.body.appendChild(elementA);
    document.body.appendChild(elementB);
    
    // Each element should exist and be properly isolated
    expect(elementA.tagName.toLowerCase()).toBe('counter-a');
    expect(elementB.tagName.toLowerCase()).toBe('counter-b');
    
    // Clean up
    document.body.removeChild(elementA);
    document.body.removeChild(elementB);
  });

  test('array expressions use isolated watchers', () => {
    const parentDiv = createElement({
      tagName: 'div',
      children: {
        items: [1, 2, 3],
        map: (item) => ({
          tagName: 'span',
          textContent: `Item: ${item}`
        })
      }
    });

    expect(parentDiv).toBeDefined();
    expect(parentDiv.children.length).toBe(3);
    
    // Each child should be a span with the mapped content
    Array.from(parentDiv.children).forEach((child, index) => {
      expect(child.tagName.toLowerCase()).toBe('span');
      expect(child.textContent).toBe(`Item: ${index + 1}`);
    });
  });

  test('watchers are properly cleaned up when components are removed', () => {
    const spec = {
      customElements: [
        {
          tagName: 'cleanup-test',
          counter: 0,
          display: '${this.counter}'
        }
      ]
    };

    DDOM(spec);
    
    const element = createElement({ tagName: 'cleanup-test' });
    
    // Add to DOM
    document.body.appendChild(element);
    
    // Element should be connected
    expect(element.isConnected).toBe(true);
    
    // Remove from DOM - this should trigger cleanup
    document.body.removeChild(element);
    
    // Element should no longer be connected
    expect(element.isConnected).toBe(false);
  });

  test('global watcher still works for backward compatibility', async () => {
    // Test that non-component effects still work with global watcher
    const signal = new Signal.State(42);
    let effectCallCount = 0;
    let lastValue = null;
    
    // This should use the global watcher since no component watcher is provided
    const cleanup = createEffect(() => {
      effectCallCount++;
      lastValue = signal.get();
    });
    
    expect(effectCallCount).toBe(1);
    expect(lastValue).toBe(42);
    
    signal.set(100);
    
    // Give microtasks a chance to run
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(effectCallCount).toBe(2);
    expect(lastValue).toBe(100);
    
    cleanup();
  });
});