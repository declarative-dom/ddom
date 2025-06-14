import { describe, test, expect, beforeEach } from 'vitest';
import { adoptWindow } from '../lib/dist/index.js';

describe('Template Literal Test Example', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
  });

  test('should process template literals in adoptWindow', () => {
    const spec = {
      document: {
        head: {
          title: 'Template Literal Test'
        },
        body: {
          style: {
            fontFamily: 'Arial, sans-serif',
            padding: '2em',
            backgroundColor: '#f5f5f5'
          }
        }
      }
    };

    adoptWindow(spec);

    // Verify document structure was created
    expect(document.head.title).toBe('Template Literal Test');
  });

  test('should handle template literals with component properties', () => {
    const spec = {
      customElements: [{
        tagName: 'test-component',
        name: 'John Doe',
        age: 30,
        score: 85,
        get status() {
          return this.score >= 80 ? 'Expert' : 'Beginner';
        }
      }]
    };

    adoptWindow(spec);

    // Check that custom elements configuration is available
    expect(window.customElements).toBeDefined();
    expect(Array.isArray(window.customElements)).toBe(true);
    expect(window.customElements.length).toBe(1);
    
    const component = window.customElements[0];
    expect(component.name).toBe('John Doe');
    expect(component.age).toBe(30);
    expect(component.score).toBe(85);
    expect(component.status).toBe('Expert');
  });

  test('should handle template literals in textContent', () => {
    const spec = {
      name: 'John Doe',
      age: 30,
      customElements: [{
        tagName: 'test-component',
        children: [{
          tagName: 'p',
          textContent: 'Name: ${this.parentNode.name}' // Template literal
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.name).toBe('John Doe');
    expect(window.age).toBe(30);
  });

  test('should handle complex template literal expressions', () => {
    const spec = {
      name: 'John Doe',
      age: 30,
      score: 85,
      get status() {
        return this.score >= 80 ? 'Expert' : 'Beginner';
      },
      customElements: [{
        tagName: 'test-component',
        children: [{
          tagName: 'div',
          children: [{
            tagName: 'p',
            textContent: 'Complex: ${this.parentNode.name.toUpperCase()} is ${this.parentNode.age >= 18 ? "an adult" : "a minor"}'
          }]
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.name).toBe('John Doe');
    expect(window.age).toBe(30);
    expect(window.status).toBe('Expert');
  });

  test('should handle template literals in attributes', () => {
    const spec = {
      name: 'John Doe',
      customElements: [{
        tagName: 'test-component',
        children: [{
          tagName: 'input',
          type: 'text',
          placeholder: '${this.parentNode.name}',
          value: '${this.parentNode.name}'
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.name).toBe('John Doe');
  });

  test('should handle multiple template literals in single element', () => {
    const spec = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      customElements: [{
        tagName: 'test-component',
        children: [{
          tagName: 'div',
          textContent: '${this.parentNode.firstName} ${this.parentNode.lastName}',
          title: 'Age: ${this.parentNode.age}'
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.firstName).toBe('John');
    expect(window.lastName).toBe('Doe');
    expect(window.age).toBe(30);
  });

  test('should handle nested template literals', () => {
    const spec = {
      user: {
        profile: {
          name: 'John Doe',
          settings: {
            theme: 'dark'
          }
        }
      },
      customElements: [{
        tagName: 'test-component',
        children: [{
          tagName: 'div',
          textContent: 'User: ${this.parentNode.user.profile.name}',
          className: 'theme-${this.parentNode.user.profile.settings.theme}'
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.user.profile.name).toBe('John Doe');
    expect(window.user.profile.settings.theme).toBe('dark');
  });

  test('should handle template literals with function calls', () => {
    const spec = {
      name: 'john doe',
      getFormattedName: function() {
        return this.name.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      },
      customElements: [{
        tagName: 'test-component',
        children: [{
          tagName: 'p',
          textContent: 'Formatted: ${this.parentNode.getFormattedName()}'
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.name).toBe('john doe');
    expect(typeof window.getFormattedName).toBe('function');
    expect(window.getFormattedName()).toBe('John Doe');
  });

  test('should handle template literals in style properties', () => {
    const spec = {
      primaryColor: '#3498db',
      padding: '20px',
      customElements: [{
        tagName: 'test-component',
        children: [{
          tagName: 'div',
          style: {
            color: '${this.parentNode.primaryColor}',
            padding: '${this.parentNode.padding}',
            border: '1px solid ${this.parentNode.primaryColor}'
          }
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.primaryColor).toBe('#3498db');
    expect(window.padding).toBe('20px');
  });

  test('should handle conditional template literals', () => {
    const spec = {
      isLoggedIn: true,
      username: 'john',
      customElements: [{
        tagName: 'test-component',
        children: [{
          tagName: 'div',
          textContent: '${this.parentNode.isLoggedIn ? "Welcome " + this.parentNode.username : "Please log in"}',
          className: '${this.parentNode.isLoggedIn ? "logged-in" : "logged-out"}'
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.isLoggedIn).toBe(true);
    expect(window.username).toBe('john');
  });

  test('should handle template literals with array access', () => {
    const spec = {
      items: ['First', 'Second', 'Third'],
      colors: ['red', 'green', 'blue'],
      customElements: [{
        tagName: 'test-component',
        children: [{
          tagName: 'div',
          textContent: 'First item: ${this.parentNode.items[0]}',
          style: {
            color: '${this.parentNode.colors[1]}'
          }
        }]
      }]
    };

    adoptWindow(spec);

    expect(Array.isArray(window.items)).toBe(true);
    expect(window.items[0]).toBe('First');
    expect(Array.isArray(window.colors)).toBe(true);
    expect(window.colors[1]).toBe('green');
  });
});