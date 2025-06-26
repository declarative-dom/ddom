import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement } from '../lib/dist/index.js';

describe('Dollar Property Injection', () => {
  beforeEach(() => {
    // Clean up any global variables
    document.body.innerHTML = '';
    if (typeof window !== 'undefined') {
      // Clean up any test properties
      Object.keys(window).forEach(key => {
        if (key.startsWith('test') || key.startsWith('$')) {
          delete window[key];
        }
      });
    }
  });

  test('should inject dollar properties into template literals', () => {
    const spec = {
      $name: 'Alice',
      $age: 30,
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'template-test',
            textContent: 'Hello ${$name}, you are ${$age} years old!'
          }]
        }
      }
    };

    DDOM(spec);
    
    const element = document.getElementById('template-test');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Hello Alice, you are 30 years old!');
  });

  test('should inject dollar properties into functions', () => {
    let clickedName = null;
    
    const spec = {
      $userName: 'Bob',
      $userAge: 25,
      document: {
        body: {
          children: [{
            tagName: 'button',
            id: 'function-test',
            onclick: function(event) {
              clickedName = $userName.get() + ' (' + $userAge.get() + ')';
            }
          }]
        }
      }
    };

    DDOM(spec);
    
    const button = document.getElementById('function-test');
    expect(button).toBeDefined();
    
    // Simulate a click
    button.click();
    expect(clickedName).toBe('Bob (25)');
  });

  test('should inject dollar properties into getters', () => {
    const spec = {
      $firstName: 'John',
      $lastName: 'Doe',
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'getter-test',
            get fullName() {
              return `${$firstName.get()} ${$lastName.get()}`;
            }
          }]
        }
      }
    };

    DDOM(spec);
    
    const element = document.getElementById('getter-test');
    expect(element).toBeDefined();
    expect(element.fullName).toBe('John Doe');
  });

  test('should inject dollar properties into setters', () => {
    let setterValue = null;
    
    const spec = {
      $prefix: 'Mr.',
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'setter-test',
            set testValue(value) {
              setterValue = `${$prefix.get()} ${value}`;
            }
          }]
        }
      }
    };

    DDOM(spec);
    
    const element = document.getElementById('setter-test');
    expect(element).toBeDefined();
    
    element.testValue = 'Smith';
    expect(setterValue).toBe('Mr. Smith');
  });

  test('should inject dollar properties into attributes', () => {
    const spec = {
      $theme: 'dark',
      $size: 'large',
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'attribute-test',
            attributes: {
              'data-theme': '${$theme}',
              'data-size': '${$size}',
              'class': 'component theme-${$theme} size-${$size}'
            }
          }]
        }
      }
    };

    DDOM(spec);
    
    const element = document.getElementById('attribute-test');
    expect(element).toBeDefined();
    expect(element.getAttribute('data-theme')).toBe('dark');
    expect(element.getAttribute('data-size')).toBe('large');
    expect(element.getAttribute('class')).toBe('component theme-dark size-large');
  });

  test('debug custom element', () => {
    const spec = {
      customElements: [{
        tagName: 'debug-card',
        $userName: 'Carol',
        $userRole: 'Admin',
        get displayText() {
          console.log('Custom element getter - this:', this);
          console.log('Custom element $userName:', this.$userName);
          console.log('Global $userName:', typeof globalThis !== 'undefined' ? globalThis.$userName : 'undefined');
          return `${$userName.get()} - ${$userRole.get()}`;
        }
      }],
      document: {
        body: {
          children: [{
            tagName: 'debug-card',
            id: 'debug-custom-element'
          }]
        }
      }
    };

    DDOM(spec);
    
    const element = document.getElementById('debug-custom-element');
    console.log('Element:', element);
    console.log('Element $userName:', element ? element.$userName : 'element is null');
    console.log('Element displayText:', element && 'displayText' in element ? element.displayText : 'undefined');
    
    expect(element).toBeDefined();
  });

  test('should work with custom elements', () => {
    const spec = {
      customElements: [{
        tagName: 'user-card',
        $userName: 'Carol',
        $userRole: 'Admin',
        get displayText() {
          return `${$userName} - ${$userRole}`;
        },
        onclick: function() {
          this.textContent = `Clicked: ${$userName}`;
        }
      }],
      document: {
        body: {
          children: [{
            tagName: 'user-card',
            id: 'custom-element-test'
          }]
        }
      }
    };

    DDOM(spec);
    
    const element = document.getElementById('custom-element-test');
    expect(element).toBeDefined();
    expect(element.displayText).toBe('Carol - Admin');
    
    // Test the click handler
    element.click();
    expect(element.textContent).toBe('Clicked: Carol');
  });

  test('should handle complex nested structures', () => {
    const spec = {
      $appName: 'My App',
      $version: '1.0.0',
      $author: 'Developer',
      document: {
        body: {
          children: [{
            tagName: 'header',
            id: 'app-header',
            textContent: '${$appName} v${$version}',
            children: [{
              tagName: 'small',
              textContent: 'by ${$author}',
              get fullCredits() {
                return `${$appName} v${$version} by ${$author}`;
              }
            }]
          }]
        }
      }
    };

    DDOM(spec);
    
    const header = document.getElementById('app-header');
    expect(header).toBeDefined();
    expect(header.textContent).toContain('My App v1.0.0');
    
    const small = header.querySelector('small');
    expect(small).toBeDefined();
    expect(small.textContent).toBe('by Developer');
    expect(small.fullCredits).toBe('My App v1.0.0 by Developer');
  });

  test('should work without dollar properties (backward compatibility)', () => {
    const spec = {
      regularProp: 'test',
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'no-dollar-test',
            textContent: 'Regular text'
          }]
        }
      }
    };

    expect(() => DDOM(spec)).not.toThrow();
    
    const element = document.getElementById('no-dollar-test');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Regular text');
  });

  test('should handle signal values in dollar properties', () => {
    const spec = {
      $counter: 0,
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'signal-test',
            textContent: 'Count: ${$counter}',
            onclick: function() {
              // Access the signal and update it
              if (typeof $counter === 'object' && 'set' in $counter) {
                $counter.set($counter.get() + 1);
              }
            }
          }]
        }
      }
    };

    DDOM(spec);
    
    const element = document.getElementById('signal-test');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Count: 0');
    
    // The counter should be available as a signal
    expect(window.$counter).toBeDefined();
  });
});