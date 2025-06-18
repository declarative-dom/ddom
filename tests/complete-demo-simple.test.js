import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Complete Demo Example', () => {
  beforeEach(() => {
    // Clear window properties - comprehensive cleanup
    const testProps = ['name', 'version', 'settings', 'counter', 'message', 'user', 'title', 'status', 'items', 'tags', 'regularProp', 'count', 'multiplier', 'app'];
    testProps.forEach(prop => {
      delete window[prop];
    });
  });

  test('should load DDOM and create window properties', () => {
    const spec = {
      name: 'Test App',
      version: '1.0.0'
    };

    DDOM(spec);
    
    // DDOM should create properties on window
    expect(window.name).toBeDefined();
    expect(window.version).toBeDefined();
    
    // Get actual values (handling Signal objects)
    const nameValue = getSignalValue(window.name);
    const versionValue = getSignalValue(window.version);
    
    expect(nameValue).toBe('Test App');
    expect(versionValue).toBe('1.0.0');
  });

  test('should handle simple reactive properties', () => {
    const spec = {
      counter: 0,
      message: 'Hello World'
    };

    DDOM(spec);
    
    // Test that properties exist
    expect(window.counter).toBeDefined();
    expect(window.message).toBeDefined();
    
    const counterValue = getSignalValue(window.counter);
    const messageValue = getSignalValue(window.message);
    
    expect(counterValue).toBe(0);
    expect(messageValue).toBe('Hello World');
  });

  test('should handle array properties', () => {
    const spec = {
      items: ['Item 1', 'Item 2', 'Item 3'],
      tags: ['tag1', 'tag2']
    };

    DDOM(spec);
    
    expect(window.items).toBeDefined();
    expect(window.tags).toBeDefined();
    
    // Handle Signal objects for arrays
    const itemsValue = getSignalValue(window.items);
    const tagsValue = getSignalValue(window.tags);
    
    expect(Array.isArray(itemsValue)).toBe(true);
    expect(itemsValue.length).toBe(3);
    expect(itemsValue[0]).toBe('Item 1');
    expect(Array.isArray(tagsValue)).toBe(true);
    expect(tagsValue.length).toBe(2);
  });

  test('should handle numeric computations', () => {
    const spec = {
      count: 0,
      multiplier: 2,
      // Use a computed function instead of getter
      total: function() {
        const countVal = getSignalValue(this.count);
        const multiplierVal = getSignalValue(this.multiplier);
        return countVal * multiplierVal;
      }
    };

    DDOM(spec);
    
    expect(window.count).toBeDefined();
    expect(window.multiplier).toBeDefined();
    expect(window.total).toBeDefined();
    
    const countValue = getSignalValue(window.count);
    const multiplierValue = getSignalValue(window.multiplier);
    
    expect(countValue).toBe(0);
    expect(multiplierValue).toBe(2);
    // Function property should be callable
    expect(typeof window.total).toBe('function');
    expect(window.total()).toBe(0);
  });
});