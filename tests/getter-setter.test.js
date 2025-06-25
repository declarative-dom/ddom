import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement } from '../lib/dist/index.js';

describe('Getter/Setter Support', () => {
  let container;
  
  beforeEach(() => {
    // Create a clean container for each test
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      delete window.testValue;
      delete window.testSignal;
    }
  });

  test('should support native ES6 getter syntax', () => {
    // Set up some test data
    window.testValue = 'Hello World';
    
    const element = createElement({
      tagName: 'div',
      
      // Native ES6 getter syntax
      get computedContent() {
        return `Value: ${window.testValue}`;
      }
    });
    
    container.appendChild(element);
    
    // The getter should be properly bound and the property should be computed
    expect(element.computedContent).toBe('Value: Hello World');
  });

  test('should support native ES6 setter syntax', () => {
    const element = createElement({
      tagName: 'div',
      testProperty: 'initial',
      
      // Native ES6 setter syntax
      set updateValue(newValue) {
        this.testProperty = newValue;
        this.setAttribute('data-value', newValue);
      }
    });
    
    container.appendChild(element);
    
    // The setter should be properly bound
    element.updateValue = 'updated';
    
    expect(element.testProperty).toBe('updated');
    expect(element.getAttribute('data-value')).toBe('updated');
  });

  test('should support simple getter/setter combination', () => {
    const element = createElement({
      tagName: 'div',
      _internalValue: 'initial',
      
      // Simple getter
      get value() {
        return this._internalValue;
      },
      
      // Simple setter
      set value(newValue) {
        this._internalValue = newValue;
        this.setAttribute('data-internal', newValue);
      }
    });
    
    container.appendChild(element);
    
    // Test getter
    expect(element.value).toBe('initial');
    
    // Test setter
    element.value = 'updated';
    expect(element.value).toBe('updated');
    expect(element.getAttribute('data-internal')).toBe('updated');
  });

  test('should handle basic computed properties', () => {
    const element = createElement({
      tagName: 'div',
      _firstName: 'John',  // Use underscore to prevent signal conversion
      _lastName: 'Doe',
      
      get fullName() {
        return `${this._firstName} ${this._lastName}`;
      }
    });
    
    container.appendChild(element);
    
    expect(element.fullName).toBe('John Doe');
  });

  test('should work with existing functionality', () => {
    // Test that getters work alongside other DDOM features
    const element = createElement({
      tagName: 'div',
      id: 'test-element',
      textContent: 'Static text',
      
      // Regular reactive property
      $counter: 0,
      
      // Simple getter that accesses reactive property
      get counterDisplay() {
        return `Count: ${this.$counter.get()}`;
      }
    });
    
    container.appendChild(element);
    
    expect(element.id).toBe('test-element');
    expect(element.textContent).toBe('Static text');
    expect(element.counterDisplay).toBe('Count: 0');
    
    // Update reactive property
    element.$counter.set(5);
    expect(element.counterDisplay).toBe('Count: 5');
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
});