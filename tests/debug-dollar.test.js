import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Dollar Property Debug', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.keys(window).forEach(key => {
      if (key.startsWith('$') || key.startsWith('test')) {
        delete window[key];
      }
    });
  });

  test('should create dollar properties as signals', () => {
    const spec = {
      $testValue: 'hello world'
    };

    DDOM(spec);
    
    console.log('window.$testValue:', window.$testValue);
    console.log('typeof window.$testValue:', typeof window.$testValue);
    
    if (window.$testValue && typeof window.$testValue === 'object') {
      console.log('Has get method:', 'get' in window.$testValue);
      if ('get' in window.$testValue) {
        console.log('Value from get():', window.$testValue.get());
      }
    }
    
    expect(window.$testValue).toBeDefined();
  });

  test('debug simple template literal', () => {
    const spec = {
      $name: 'Alice',
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'debug-test',
            textContent: 'Hello ${$name}!'
          }]
        }
      }
    };

    DDOM(spec);
    
    console.log('window.$name:', window.$name);
    console.log('typeof window.$name:', typeof window.$name);
    
    if (window.$name && typeof window.$name === 'object' && 'get' in window.$name) {
      console.log('Value from get():', window.$name.get());
    }
    
    const element = document.getElementById('debug-test');
    console.log('Element textContent:', element.textContent);
    
    expect(element).toBeDefined();
  });
});