import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Complete Demo Example', () => {
  beforeEach(() => {
    // Clean up window properties
    const testProps = ['name', 'version', 'settings', 'counter', 'message', 'user', 'title', 'status', 'items', 'tags', 'regularProp', 'count', 'multiplier', 'app'];
    testProps.forEach(prop => {
      delete window[prop];
    });
  });

  test('should load DDOM complete demo successfully', () => {
    // Create a basic spec similar to complete-demo.js
    const spec = {
      name: 'Test App',
      version: '1.0.0',
      settings: {
        theme: 'dark',
        language: 'en'
      },
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'app',
            textContent: 'Hello ${this.parentNode.name}!'
          }]
        }
      }
    };

    DDOM(spec);
    
    expect(window.name).toBe('Test App');
    expect(window.version).toBe('1.0.0');
    expect(window.settings).toBeDefined();
    expect(window.settings.theme).toBe('dark');
    expect(window.settings.language).toBe('en');
  });

  test('should demonstrate transparent signal proxies', () => {
    const spec = {
      counter: 0,
      message: 'Hello World',
      user: {
        name: 'John',
        age: 30
      }
    };

    DDOM(spec);
    
    // Test transparent proxy access
    expect(window.counter).toBe(0);
    expect(window.message).toBe('Hello World');
    expect(window.user.name).toBe('John');
    expect(window.user.age).toBe(30);

    // Test transparent proxy updates
    window.counter = 5;
    window.message = 'Updated';
    window.user.name = 'Jane';
    window.user.age = 25;

    expect(window.counter).toBe(5);
    expect(window.message).toBe('Updated');
    expect(window.user.name).toBe('Jane');
    expect(window.user.age).toBe(25);
  });

  test('should handle expressive arrays', () => {
    const spec = {
      items: ['Item 1', 'Item 2', 'Item 3'],
      tags: ['tag1', 'tag2'],
      document: {
        body: {
          children: [{
            tagName: 'ul',
            children: [
              { tagName: 'li', textContent: 'First item' },
              { tagName: 'li', textContent: 'Second item' }
            ]
          }]
        }
      }
    };

    DDOM(spec);
    
    expect(Array.isArray(window.items)).toBe(true);
    expect(window.items.length).toBe(3);
    expect(window.items[0]).toBe('Item 1');
    expect(Array.isArray(window.tags)).toBe(true);
    expect(window.tags.length).toBe(2);
  });

  test('should demonstrate property-level reactivity', () => {
    const spec = {
      count: 0,
      multiplier: 2,
      get total() {
        return this.count * this.multiplier;
      }
    };

    DDOM(spec);
    
    expect(window.count).toBe(0);
    expect(window.multiplier).toBe(2);
    expect(window.total).toBe(0);

    window.count = 5;
    expect(window.total).toBe(10);

    window.multiplier = 3;
    expect(window.total).toBe(15);
  });
});