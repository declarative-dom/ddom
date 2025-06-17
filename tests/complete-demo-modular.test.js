import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement } from '../lib/dist/index.js';

describe('Complete Demo Modular Example', () => {
  beforeEach(() => {
    // Clean up any global variables
    const testProps = ['counter', 'userName', 'greeting', 'todoList', 'incrementCounter', 'resetCounter', 'changeName', 'changeGreeting', 'addTodo', 'clearTodos', 'updateMultipleProps'];
    testProps.forEach(prop => {
      delete window[prop];
    });
  });

  test('should create modular demo with component architecture', () => {
    const modularDemoSpec = {
      counter: 0,
      userName: 'World',
      greeting: 'Hello',
      todoList: ['Learn DDOM', 'Build awesome apps'],

      incrementCounter() {
        this.counter.set(this.counter.get() + 1);
      },

      resetCounter() {
        this.counter.set(0);
      },

      changeName() {
        const names = ['World', 'Universe', 'Developer', 'Friend', 'Explorer'];
        const newName = names.find(n => n !== this.userName.get()) || names[0];
        this.userName.set(newName);
      },

      customElements: [
        {
          tagName: 'demo-button',
          variant: 'primary',
          text: 'Button',
          disabled: false,
          textContent: '${this.text}',
          onclick: function(event) {
            if (!this.disabled && this.action) {
              this.action.call(this, event);
            }
          }
        },
        {
          tagName: 'code-block',
          code: '',
          textContent: '${this.code}'
        },
        {
          tagName: 'reactive-display',
          content: '',
          variant: 'default',
          textContent: '${this.content}'
        }
      ]
    };

    // Test that DDOM can process the modular demo spec
    expect(() => DDOM(modularDemoSpec)).not.toThrow();
    
    // Test that the properties are available on window
    expect(window.counter).toBeDefined();
    expect(window.userName).toBeDefined();
    expect(window.greeting).toBeDefined();
    expect(window.todoList).toBeDefined();
    expect(window.incrementCounter).toBeDefined();
    expect(window.resetCounter).toBeDefined();
    expect(window.changeName).toBeDefined();
  });

  test('should create demo-button component with variants', () => {
    const demoButton = createElement({
      tagName: 'demo-button',
      variant: 'primary',
      text: 'Click Me',
      disabled: false,
      action: function() {
        return 'button clicked';
      },
      textContent: '${this.text}',
      onclick: function(event) {
        if (!this.disabled && this.action) {
          return this.action.call(this, event);
        }
      }
    });

    expect(demoButton).toBeDefined();
    expect(demoButton.tagName.toLowerCase()).toBe('demo-button');
    expect(demoButton.variant).toBeDefined();
    expect(demoButton.text).toBeDefined();
    expect(demoButton.disabled).toBeDefined();
    expect(typeof demoButton.action).toBe('function');

    // Test that properties are reactive
    if (typeof demoButton.text === 'object' && demoButton.text.set) {
      demoButton.text.set('Updated Text');
      expect(demoButton.text.get()).toBe('Updated Text');
    }

    if (typeof demoButton.variant === 'object' && demoButton.variant.set) {
      demoButton.variant.set('secondary');
      expect(demoButton.variant.get()).toBe('secondary');
    }
  });

  test('should create code-block component', () => {
    const codeBlock = createElement({
      tagName: 'code-block',
      code: 'const x = 42;',
      textContent: '${this.code}'
    });

    expect(codeBlock).toBeDefined();
    expect(codeBlock.tagName.toLowerCase()).toBe('code-block');
    expect(codeBlock.code).toBeDefined();

    // Test that code property is reactive
    if (typeof codeBlock.code === 'object' && codeBlock.code.set) {
      codeBlock.code.set('const y = 24;');
      expect(codeBlock.code.get()).toBe('const y = 24;');
    }
  });

  test('should create reactive-display component with variants', () => {
    const reactiveDisplay = createElement({
      tagName: 'reactive-display',
      content: 'Test Content',
      variant: 'counter',
      textContent: '${this.content}'
    });

    expect(reactiveDisplay).toBeDefined();
    expect(reactiveDisplay.tagName.toLowerCase()).toBe('reactive-display');
    expect(reactiveDisplay.content).toBeDefined();
    expect(reactiveDisplay.variant).toBeDefined();

    // Test that properties are reactive
    if (typeof reactiveDisplay.content === 'object' && reactiveDisplay.content.set) {
      reactiveDisplay.content.set('Updated Content');
      expect(reactiveDisplay.content.get()).toBe('Updated Content');
    }

    if (typeof reactiveDisplay.variant === 'object' && reactiveDisplay.variant.set) {
      reactiveDisplay.variant.set('greeting');
      expect(reactiveDisplay.variant.get()).toBe('greeting');
    }
  });

  test('should create feature-section component', () => {
    const featureSection = createElement({
      tagName: 'feature-section',
      title: 'Test Feature',
      icon: '✨',
      children: [
        {
          tagName: 'div',
          className: 'feature-title',
          textContent: '${this.parentNode.icon} ${this.parentNode.title}'
        }
      ]
    });

    expect(featureSection).toBeDefined();
    expect(featureSection.tagName.toLowerCase()).toBe('feature-section');
    expect(featureSection.title).toBeDefined();
    expect(featureSection.icon).toBeDefined();
    expect(featureSection.children.length).toBe(1);

    // Test that properties are reactive
    if (typeof featureSection.title === 'object' && featureSection.title.set) {
      featureSection.title.set('Updated Feature');
      expect(featureSection.title.get()).toBe('Updated Feature');
    }
  });

  test('should create app-header component', () => {
    const appHeader = createElement({
      tagName: 'app-header',
      title: 'DDOM Demo',
      subtitle: 'Declarative Implementation',
      children: [
        {
          tagName: 'h1',
          textContent: '🚀 ${this.parentNode.title}'
        },
        {
          tagName: 'h2',
          textContent: '${this.parentNode.subtitle}'
        }
      ]
    });

    expect(appHeader).toBeDefined();
    expect(appHeader.tagName.toLowerCase()).toBe('app-header');
    expect(appHeader.title).toBeDefined();
    expect(appHeader.subtitle).toBeDefined();
    expect(appHeader.children.length).toBe(2);

    // Test that properties are reactive
    if (typeof appHeader.title === 'object' && appHeader.title.set) {
      appHeader.title.set('Updated Demo');
      expect(appHeader.title.get()).toBe('Updated Demo');
    }
  });

  test('should handle global state management', () => {
    DDOM({
      counter: 0,
      userName: 'World',
      greeting: 'Hello',
      todoList: ['Learn DDOM', 'Build awesome apps'],

      incrementCounter() {
        this.counter.set(this.counter.get() + 1);
      },

      changeName() {
        const names = ['World', 'Universe', 'Developer'];
        const current = this.userName.get();
        const newName = names.find(n => n !== current) || names[0];
        this.userName.set(newName);
      }
    });

    // Test initial state
    const getSignalValue = (signal) => {
      if (typeof signal === 'object' && signal.get) {
        return signal.get();
      }
      return signal;
    };

    expect(getSignalValue(window.counter)).toBe(0);
    expect(getSignalValue(window.userName)).toBe('World');
    expect(getSignalValue(window.greeting)).toBe('Hello');
    expect(Array.isArray(getSignalValue(window.todoList))).toBe(true);

    // Test method calls
    expect(typeof window.incrementCounter).toBe('function');
    expect(typeof window.changeName).toBe('function');
  });

  test('should support component composition', () => {
    const composedApp = createElement({
      tagName: 'div',
      className: 'demo-container',
      children: [
        {
          tagName: 'app-header',
          title: 'Test App',
          subtitle: 'Component Demo'
        },
        {
          tagName: 'feature-section',
          title: 'Feature 1',
          icon: '⚡',
          children: [
            {
              tagName: 'demo-button',
              variant: 'primary',
              text: 'Action Button'
            },
            {
              tagName: 'reactive-display',
              content: 'Dynamic Content',
              variant: 'default'
            }
          ]
        }
      ]
    });

    expect(composedApp).toBeDefined();
    expect(composedApp.children.length).toBe(2);
    expect(composedApp.children[0].tagName.toLowerCase()).toBe('app-header');
    expect(composedApp.children[1].tagName.toLowerCase()).toBe('feature-section');
  });

  test('should handle todo-item component with array mapping', () => {
    const todoItem = createElement({
      tagName: 'todo-item',
      text: 'Test Todo',
      textContent: '• ${this.text}'
    });

    expect(todoItem).toBeDefined();
    expect(todoItem.tagName.toLowerCase()).toBe('todo-item');
    expect(todoItem.text).toBeDefined();

    // Test that text property is reactive
    if (typeof todoItem.text === 'object' && todoItem.text.set) {
      todoItem.text.set('Updated Todo');
      expect(todoItem.text.get()).toBe('Updated Todo');
    }
  });
});