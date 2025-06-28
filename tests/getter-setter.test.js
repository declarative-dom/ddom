import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createElement } from '../lib/dist/index.js';

describe('Function Property Support', () => {
  let container;
  
  beforeEach(() => {
    // Create a clean container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
    // Use fake timers to control microtask execution
    vi.useFakeTimers({ toFake: ['nextTick', 'queueMicrotask'] });
    
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      delete window.testValue;
      delete window.$testSignal;
    }
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
  });

  test('should support function properties that return computed values', () => {
    // Set up some test data
    window.testValue = 'Hello World';
    
    const element = createElement({
      tagName: 'div',
      
      // Function property that computes a value
      computedContent: function () {
        return `Value: ${window.testValue}`;
      }
    });
    
    container.appendChild(element);
    
    // The function should return the computed value
    expect(element.computedContent()).toBe('Value: Hello World');
  });

  test('should support function properties with reactive signals', () => {
    const element = createElement({
      tagName: 'div',
      $testProperty: 'initial',
      
      // Function that uses reactive signal
      getValue: function () {
        return this.$testProperty.get();
      },
      
      // Function that updates reactive signal
      updateValue: function (newValue) {
        this.$testProperty.set(newValue);
        this.setAttribute('data-value', newValue);
      }
    });
    
    container.appendChild(element);
    
    // Test function that gets reactive value
    expect(element.getValue()).toBe('initial');
    
    // Test function that updates reactive value
    element.updateValue('updated');
    expect(element.getValue()).toBe('updated');
    expect(element.getAttribute('data-value')).toBe('updated');
  });

  test('should support functions for computed properties', () => {
    const element = createElement({
      tagName: 'div',
      _internalValue: 'initial', // Non-reactive internal value
      
      // Function that returns computed value
      getValue: function () {
        return this._internalValue;
      },
      
      // Function that updates internal value
      setValue: function (newValue) {
        this._internalValue = newValue;
        this.setAttribute('data-internal', newValue);
      }
    });
    
    container.appendChild(element);
    
    // Test getter function
    expect(element.getValue()).toBe('initial');
    
    // Test setter function
    element.setValue('updated');
    expect(element.getValue()).toBe('updated');
    expect(element.getAttribute('data-internal')).toBe('updated');
  });

  test('should handle computed properties with signals', () => {
    const element = createElement({
      tagName: 'div',
      $firstName: 'John',
      $lastName: 'Doe',
      
      // Function that computes full name from signals
      fullName: function () {
        return `${this.$firstName.get()} ${this.$lastName.get()}`;
      }
    });
    
    container.appendChild(element);
    
    expect(element.fullName()).toBe('John Doe');
    
    // Update signals and verify computed value changes
    element.$firstName.set('Jane');
    expect(element.fullName()).toBe('Jane Doe');
  });

  test('should work with existing DDOM functionality', () => {
    // Test that functions work alongside other DDOM features
    const element = createElement({
      tagName: 'div',
      id: 'test-element',
      textContent: 'Static text',
      
      // Regular reactive property
      $counter: 0,
      
      // Function that accesses reactive property
      counterDisplay: function () {
        return `Count: ${this.$counter.get()}`;
      },
      
      // Function that increments counter
      increment: function () {
        this.$counter.set(this.$counter.get() + 1);
      }
    });
    
    container.appendChild(element);
    
    expect(element.id).toBe('test-element');
    expect(element.textContent).toBe('Static text');
    expect(element.counterDisplay()).toBe('Count: 0');
    
    // Update reactive property via function
    element.increment();
    expect(element.counterDisplay()).toBe('Count: 1');
  });

  test('should support functions with template literals', () => {
    // Test that functions work with template literal reactivity
    const element = createElement({
      tagName: 'div',
      $message: 'Hello',
      
      // Function property
      getMessage: function () {
        return this.$message.get().toUpperCase();
      },
      
      // Template literal that uses the signal
      textContent: 'Message: ${this.$message.get()}'
    });
    
    container.appendChild(element);
    
    expect(element.getMessage()).toBe('HELLO');
    expect(element.textContent).toBe('Message: Hello');
    
    // Update signal and verify both function and template update
    element.$message.set('World');
    expect(element.getMessage()).toBe('WORLD');
    // Note: Template literal reactivity would need to be verified in an integration test
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
});