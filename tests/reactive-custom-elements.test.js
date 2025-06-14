import { describe, test, expect, beforeEach } from 'vitest';
import { adoptWindow, createElement } from '../lib/dist/index.js';

describe('Reactive Custom Elements Example', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
  });

  test('should create custom elements with reactivity', () => {
    const spec = {
      customElements: [{
        tagName: 'counter-element',
        count: 0,
        increment: function() {
          this.count += 1;
        },
        children: [{
          tagName: 'div',
          textContent: 'Count: ${this.parentNode.count}',
          children: [{
            tagName: 'button',
            textContent: 'Increment',
            onclick: function() {
              this.parentNode.increment();
            }
          }]
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.customElements).toBeDefined();
    expect(Array.isArray(window.customElements)).toBe(true);
    expect(window.customElements.length).toBe(1);

    const counterElement = window.customElements[0];
    expect(counterElement.tagName).toBe('counter-element');
    expect(counterElement.count).toBe(0);
    expect(typeof counterElement.increment).toBe('function');
  });

  test('should handle custom element property updates', () => {
    const spec = {
      customElements: [{
        tagName: 'user-card',
        name: 'John Doe',
        email: 'john@example.com',
        active: true,
        updateProfile: function(newName, newEmail) {
          this.name = newName;
          this.email = newEmail;
        }
      }]
    };

    adoptWindow(spec);

    const userCard = window.customElements[0];
    expect(userCard.name).toBe('John Doe');
    expect(userCard.email).toBe('john@example.com');
    expect(userCard.active).toBe(true);

    // Test property updates
    userCard.name = 'Jane Smith';
    userCard.email = 'jane@example.com';
    userCard.active = false;

    expect(userCard.name).toBe('Jane Smith');
    expect(userCard.email).toBe('jane@example.com');
    expect(userCard.active).toBe(false);

    // Test method call
    if (typeof userCard.updateProfile === 'function') {
      userCard.updateProfile('Bob Wilson', 'bob@example.com');
      expect(userCard.name).toBe('Bob Wilson');
      expect(userCard.email).toBe('bob@example.com');
    }
  });

  test('should handle nested custom elements', () => {
    const spec = {
      customElements: [
        {
          tagName: 'parent-element',
          title: 'Parent Component',
          children: [{
            tagName: 'child-element',
            message: 'Child Component'
          }]
        },
        {
          tagName: 'child-element',
          message: 'Default Child'
        }
      ]
    };

    adoptWindow(spec);

    expect(window.customElements.length).toBe(2);
    expect(window.customElements[0].tagName).toBe('parent-element');
    expect(window.customElements[1].tagName).toBe('child-element');
    expect(window.customElements[0].title).toBe('Parent Component');
    expect(window.customElements[1].message).toBe('Default Child');
  });

  test('should handle custom element with computed properties', () => {
    const spec = {
      customElements: [{
        tagName: 'calculator',
        a: 10,
        b: 5,
        operation: 'add',
        get result() {
          switch (this.operation) {
            case 'add': return this.a + this.b;
            case 'subtract': return this.a - this.b;
            case 'multiply': return this.a * this.b;
            case 'divide': return this.b !== 0 ? this.a / this.b : 0;
            default: return 0;
          }
        }
      }]
    };

    adoptWindow(spec);

    const calculator = window.customElements[0];
    expect(calculator.result).toBe(15); // 10 + 5

    calculator.operation = 'subtract';
    expect(calculator.result).toBe(5); // 10 - 5

    calculator.operation = 'multiply';
    expect(calculator.result).toBe(50); // 10 * 5

    calculator.a = 20;
    calculator.b = 4;
    calculator.operation = 'divide';
    expect(calculator.result).toBe(5); // 20 / 4
  });

  test('should handle custom element lifecycle methods', () => {
    let connectedCallCount = 0;
    let disconnectedCallCount = 0;

    const spec = {
      customElements: [{
        tagName: 'lifecycle-element',
        data: 'initial',
        connectedCallback: function() {
          connectedCallCount++;
          this.data = 'connected';
        },
        disconnectedCallback: function() {
          disconnectedCallCount++;
          this.data = 'disconnected';
        }
      }]
    };

    adoptWindow(spec);

    const element = window.customElements[0];
    expect(element.data).toBe('initial');

    // Simulate lifecycle methods
    if (typeof element.connectedCallback === 'function') {
      element.connectedCallback();
      expect(connectedCallCount).toBe(1);
      expect(element.data).toBe('connected');
    }

    if (typeof element.disconnectedCallback === 'function') {
      element.disconnectedCallback();
      expect(disconnectedCallCount).toBe(1);
      expect(element.data).toBe('disconnected');
    }
  });

  test('should handle custom element with event handlers', () => {
    let clickCount = 0;
    let inputValue = '';

    const spec = {
      customElements: [{
        tagName: 'interactive-element',
        value: '',
        handleClick: function() {
          clickCount++;
          this.value = `clicked-${clickCount}`;
        },
        handleInput: function(event) {
          inputValue = event.target.value;
          this.value = inputValue;
        }
      }]
    };

    adoptWindow(spec);

    const element = window.customElements[0];

    // Test click handler
    if (typeof element.handleClick === 'function') {
      element.handleClick();
      expect(clickCount).toBe(1);
      expect(element.value).toBe('clicked-1');

      element.handleClick();
      expect(clickCount).toBe(2);
      expect(element.value).toBe('clicked-2');
    }

    // Test input handler with mock event
    if (typeof element.handleInput === 'function') {
      const mockEvent = {
        target: { value: 'test input' }
      };
      element.handleInput(mockEvent);
      expect(inputValue).toBe('test input');
      expect(element.value).toBe('test input');
    }
  });

  test('should handle custom element with array properties', () => {
    const spec = {
      customElements: [{
        tagName: 'list-element',
        items: ['Item 1', 'Item 2'],
        addItem: function(item) {
          this.items.push(item);
        },
        removeItem: function(index) {
          this.items.splice(index, 1);
        },
        get itemCount() {
          return this.items.length;
        }
      }]
    };

    adoptWindow(spec);

    const listElement = window.customElements[0];
    expect(listElement.items.length).toBe(2);
    expect(listElement.itemCount).toBe(2);

    // Test adding items
    if (typeof listElement.addItem === 'function') {
      listElement.addItem('Item 3');
      expect(listElement.items.length).toBe(3);
      expect(listElement.itemCount).toBe(3);
      expect(listElement.items[2]).toBe('Item 3');
    }

    // Test removing items
    if (typeof listElement.removeItem === 'function') {
      listElement.removeItem(0);
      expect(listElement.items.length).toBe(2);
      expect(listElement.itemCount).toBe(2);
      expect(listElement.items[0]).toBe('Item 2');
    }
  });

  test('should handle template literals in custom elements', () => {
    const spec = {
      appName: 'My App',
      customElements: [{
        tagName: 'header-element',
        title: 'Welcome',
        subtitle: 'Version 1.0',
        children: [{
          tagName: 'h1',
          textContent: '${this.parentNode.title} to ${this.parentNode.appName}'
        }, {
          tagName: 'p',
          textContent: '${this.parentNode.subtitle}'
        }]
      }]
    };

    adoptWindow(spec);

    expect(window.appName).toBe('My App');
    const headerElement = window.customElements[0];
    expect(headerElement.title).toBe('Welcome');
    expect(headerElement.subtitle).toBe('Version 1.0');
  });

  test('should create custom element using createElement', () => {
    const customElement = createElement({
      tagName: 'custom-div',
      className: 'my-custom-element',
      data: 'test data',
      count: 0,
      increment: function() {
        this.count++;
      }
    });

    expect(customElement).toBeDefined();
    expect(customElement.className).toBe('my-custom-element');
    expect(customElement.data).toBe('test data');
    expect(customElement.count).toBe(0);
    expect(typeof customElement.increment).toBe('function');

    // Test the method
    customElement.increment();
    expect(customElement.count).toBe(1);
  });
});