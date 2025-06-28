import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Reactive Property Debug', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.keys(window).forEach(key => {
      if (key.startsWith('$') || key.startsWith('test')) {
        delete window[key];
      }
    });
  });

  test('should create scope properties as signals', () => {
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
              console.log('Function called with $userName:', $userName);
              console.log('$userName type:', typeof $userName);
              if ($userName && 'get' in $userName) {
                console.log('$userName.get():', $userName.get());
                const result = 'Signal value: ' + $userName.get();
                console.log('Setting clickedName to:', result);
                clickedName = result;
                console.log('clickedName after assignment:', clickedName);
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
    
    console.log('Final clickedName:', clickedName);
    expect(clickedName).toBeDefined();
  });

  test('debug template function call', () => {
    const spec = {
      $name: 'Alice',
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'debug-test',
            textContent: function () {
              console.log('Getter called with this:', this);
              console.log('Getter $name:', this.$name);
              return 'Hello from getter!';
            }
          }]
        }
      }
    };

    DDOM(spec);
    
    const element = document.getElementById('debug-test');
    console.log('Element textContent from getter:', element.textContent);
    
    expect(element).toBeDefined();
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