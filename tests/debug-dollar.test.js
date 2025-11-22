import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Reactive Property Debug', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.keys(window).forEach(key => {
      if (key.startsWith('$') || key.startsWith('test')) {
        delete window[key];
      }
    });
    // Use fake timers to control microtask execution
    vi.useFakeTimers({ toFake: ['nextTick', 'queueMicrotask'] });
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
  });

  test('should create scope properties as signals', () => {
    const spec = {
      $testValue: 'hello world'
    };

    DDOM(spec);
    
    expect(window.$testValue).toBeDefined();
    expect(typeof window.$testValue).toBe('object');
    expect('get' in window.$testValue).toBe(true);
    expect(window.$testValue.get()).toBe('hello world');
  });

  test('debug function injection', () => {
    let clickedName = null;
    
    const spec = {
      $userName: 'Bob',
      document: {
        body: {
          children: [{
            tagName: 'button',
            id: 'debug-function',
            onclick: function() {
              if ($userName && 'get' in $userName) {
                const result = 'Signal value: ' + $userName.get();
                clickedName = result;
              } else {
                clickedName = 'Direct value: ' + $userName;
              }
            }
          }]
        }
      }
    };

    DDOM(spec);
    
    const button = document.getElementById('debug-function');
    button.click();
    
    expect(clickedName).toBeDefined();
    expect(clickedName).toBe('Signal value: Bob');
  });

  test('should support custom function properties', () => {
    const spec = {
      $name: 'Alice',
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'debug-test',
            // Custom function property (not a DOM property)
            getGreeting: function () {
              return `Hello ${this.$name.get()} from getter!`;
            }
          }]
        }
      }
    };

    DDOM(spec);
    
    vi.runAllTicks(); // Flush microtasks (including reactive effects)
    
    const element = document.getElementById('debug-test');
    
    expect(element).toBeDefined();
    expect(element.getGreeting).toBeDefined();
    expect(typeof element.getGreeting).toBe('function');
    expect(element.getGreeting()).toBe('Hello Alice from getter!');
  });

  test('debug simple template literal', () => {
    const spec = {
      $name: 'Alice',
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'debug-test',
            textContent: 'Hello ${this.$name}!'
          }]
        }
      }
    };

    DDOM(spec);
    
    vi.runAllTicks(); // Flush microtasks (including reactive effects)
    
    const element = document.getElementById('debug-test');
    
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Hello Alice!');
  });
});