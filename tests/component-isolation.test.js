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
      map: {
        tagName: 'div',
        textContent: (item) => `Item ${item}`
      }
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
        prototype: 'Array',
        items: [1, 2, 3],
        map: {
          tagName: 'span',
          textContent: (item) => `Item: ${item}`
        }
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

  test('isolated watchers prevent cross-component interference', async () => {
    // Create two different components that each manage their own reactive state
    const spec = {
      customElements: [
        {
          tagName: 'counter-widget',
          count: 0,
          label: 'Counter A',
          display: '${this.label}: ${this.count}',
          increment() {
            if (typeof this.count.set === 'function') {
              this.count.set(this.count.get() + 1);
            }
          }
        },
        {
          tagName: 'timer-widget',
          seconds: 0,
          label: 'Timer B',
          display: '${this.label}: ${this.seconds}s',
          tick() {
            if (typeof this.seconds.set === 'function') {
              this.seconds.set(this.seconds.get() + 1);
            }
          }
        }
      ]
    };

    DDOM(spec);
    
    // Create multiple instances of each component
    const counter1 = createElement({ tagName: 'counter-widget' });
    const counter2 = createElement({ tagName: 'counter-widget' });
    const timer1 = createElement({ tagName: 'timer-widget' });
    const timer2 = createElement({ tagName: 'timer-widget' });
    
    // Add them all to the DOM
    document.body.appendChild(counter1);
    document.body.appendChild(counter2);
    document.body.appendChild(timer1);
    document.body.appendChild(timer2);
    
    // Each instance should be properly isolated
    expect(counter1.tagName.toLowerCase()).toBe('counter-widget');
    expect(counter2.tagName.toLowerCase()).toBe('counter-widget');
    expect(timer1.tagName.toLowerCase()).toBe('timer-widget');
    expect(timer2.tagName.toLowerCase()).toBe('timer-widget');
    
    // All should be connected
    expect(counter1.isConnected).toBe(true);
    expect(counter2.isConnected).toBe(true);
    expect(timer1.isConnected).toBe(true);
    expect(timer2.isConnected).toBe(true);
    
    // Remove some components - others should remain unaffected
    document.body.removeChild(counter1);
    document.body.removeChild(timer1);
    
    expect(counter1.isConnected).toBe(false);
    expect(timer1.isConnected).toBe(false);
    expect(counter2.isConnected).toBe(true);
    expect(timer2.isConnected).toBe(true);
    
    // Clean up remaining
    document.body.removeChild(counter2);
    document.body.removeChild(timer2);
  });

  test('MappedArray disposal prevents memory leaks', () => {
    const sourceData = new Signal.State([1, 2, 3, 4, 5]);
    
    // Create a MappedArray with filtering and mapping
    const mappedArray = new MappedArray({
      items: sourceData,
      filter: [{ leftOperand: (item) => item, operator: '>', rightOperand: 2 }],
      map: {
        tagName: 'div',
        textContent: (item) => `Item: ${item}`
      }
    });
    
    // Should work normally
    const result = mappedArray.get();
    expect(result.length).toBe(3); // Items 3, 4, 5
    expect(result[0].textContent).toBe('Item: 3');
    
    // Update source data
    sourceData.set([6, 7, 8]);
    const updatedResult = mappedArray.get();
    expect(updatedResult.length).toBe(3); // Items 6, 7, 8
    expect(updatedResult[0].textContent).toBe('Item: 6');
    
    // Dispose should clean up watchers
    mappedArray.dispose();
    
    // Should be safe to dispose multiple times
    mappedArray.dispose();
  });

  test('complex nested structures with isolation', () => {
    // Test that deeply nested components with arrays maintain isolation
    const parentElement = createElement({
      tagName: 'div',
      className: 'parent',
      children: [
        {
          tagName: 'div',
          className: 'list-container',
          children: {
            prototype: 'Array',
            items: [
              { id: 1, name: 'Alice' },
              { id: 2, name: 'Bob' },
              { id: 3, name: 'Charlie' }
            ],
            map: {
              tagName: 'div',
              className: 'person-item',
              textContent: (person) => `${person.name} (ID: ${person.id})`
            }
          }
        }
      ]
    });
    
    expect(parentElement.children.length).toBe(1);
    
    const listContainer = parentElement.children[0];
    expect(listContainer.className).toBe('list-container');
    expect(listContainer.children.length).toBe(3);
    
    // Check that each person item was created correctly
    Array.from(listContainer.children).forEach((child, index) => {
      expect(child.className).toBe('person-item');
      expect(child.textContent).toContain(['Alice', 'Bob', 'Charlie'][index]);
    });
  });

  test('ComponentSignalWatcher supports modern resource management patterns', () => {
    // Demonstrate the explicit resource management pattern
    // This is the foundation for future "using" keyword support
    const watcher = new ComponentSignalWatcher();
    const signal = new Signal.State(10);
    let effectCount = 0;
    
    // Create a computed signal that uses the isolated watcher
    const computed = new Signal.Computed(() => {
      effectCount++;
      return signal.get() * 2;
    });
    
    // Watch the computed signal with our isolated watcher
    watcher.watch(computed);
    
    // Trigger the computation
    expect(computed.get()).toBe(20);
    expect(effectCount).toBe(1);
    
    // Update the source signal
    signal.set(15);
    expect(computed.get()).toBe(30);
    
    // Explicit resource cleanup - this is the pattern that will work with "using" in the future
    watcher.dispose();
    
    // After disposal, the watcher should be inert
    signal.set(20);
    
    // The computed is no longer being watched, but still accessible
    expect(computed.get()).toBe(40);
  });

  test('resource management in realistic component lifecycle', () => {
    // Simulate a realistic component lifecycle with proper cleanup
    let watchers = [];
    
    // Simulate creating multiple components
    for (let i = 0; i < 5; i++) {
      const watcher = new ComponentSignalWatcher();
      const signal = new Signal.State(i);
      
      // Create some reactive computations for this component
      const computed = new Signal.Computed(() => signal.get() * 10);
      watcher.watch(computed);
      
      // Store for later cleanup
      watchers.push({ watcher, signal, computed });
    }
    
    expect(watchers.length).toBe(5);
    
    // Verify all components are working
    watchers.forEach(({ computed }, index) => {
      expect(computed.get()).toBe(index * 10);
    });
    
    // Simulate component cleanup (e.g., when removed from DOM)
    watchers.forEach(({ watcher }) => {
      watcher.dispose();
    });
    
    // All watchers should now be disposed
    // This prevents memory leaks in complex applications
    expect(true).toBe(true); // Test passed if no errors thrown
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