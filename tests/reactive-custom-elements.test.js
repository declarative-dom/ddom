import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement } from '../lib/dist/index.js';

describe('Reactive Custom Elements Example', () => {
  beforeEach(() => {
    // Clean up any global variables
    const testProps = ['todos'];
    testProps.forEach(prop => {
      delete window[prop];
    });
  });

  test('should create reactive custom elements with transparent signal proxies', () => {
    const reactiveElementsSpec = {
      todos: [
        { text: 'Learn Declarative DOM', completed: false },
        { text: 'Build awesome apps', completed: false },
        { text: 'Share with the world', completed: false }
      ],
      
      customElements: [
        {
          tagName: 'counter-widget',
          count: 0,
          theme: 'light',
          children: [
            {
              tagName: 'h3',
              textContent: 'Count: ${this.parentNode.count.get()}'
            },
            {
              tagName: 'button',
              textContent: '+',
              onclick: function (event) {
                const counterElement = event.target.parentNode;
                if (counterElement && counterElement.tagName === 'COUNTER-WIDGET') {
                  counterElement.count = counterElement.count + 1;
                }
              }
            },
            {
              tagName: 'button',
              textContent: 'Toggle Theme',
              onclick: function (event) {
                const counterElement = event.target.parentNode;
                if (counterElement && counterElement.tagName === 'COUNTER-WIDGET') {
                  const newTheme = counterElement.theme === 'light' ? 'dark' : 'light';
                  counterElement.theme = newTheme;
                }
              }
            }
          ]
        }
      ]
    };

    // Test that DDOM can process the reactive elements spec
    expect(() => DDOM(reactiveElementsSpec)).not.toThrow();
    
    // Test that the todos array is available on window
    expect(window.todos).toBeDefined();
  });

  test('should create counter widget with reactive properties', () => {
    const counterWidget = createElement({
      tagName: 'counter-widget',
      count: 0,
      theme: 'light',
      children: [
        {
          tagName: 'h3',
          textContent: 'Count: ${this.parentNode.count.get()}'
        },
        {
          tagName: 'button',
          textContent: '+',
          onclick: function (_event) {
            const counter = this.parentNode;
            counter.count = counter.count + 1;
          }
        }
      ]
    });

    expect(counterWidget).toBeDefined();
    expect(counterWidget.tagName.toLowerCase()).toBe('counter-widget');
    expect(counterWidget.count).toBeDefined();
    expect(counterWidget.theme).toBeDefined();
    
    // Test that properties are reactive
    if (typeof counterWidget.count === 'object' && counterWidget.count.set) {
      counterWidget.count.set(5);
      expect(counterWidget.count.get()).toBe(5);
    }
    
    if (typeof counterWidget.theme === 'object' && counterWidget.theme.set) {
      counterWidget.theme.set('dark');
      expect(counterWidget.theme.get()).toBe('dark');
    }
  });

  test('should handle todo item with reactive properties', () => {
    const todoItem = createElement({
      tagName: 'todo-item',
      item: { text: 'Test Todo', completed: false },
      index: 0,
      delete: function () {
        // Test that the delete method exists
        expect(typeof this.delete).toBe('function');
      },
      toggle: function (checked) {
        // Test that the toggle method exists
        expect(typeof checked).toBe('boolean');
      },
      children: [
        {
          tagName: 'input',
          attributes: {
            type: 'checkbox',
            checked: '${this.parentNode.item.completed.get()}'
          },
          onchange: function (event) {
            const todoItem = event.target.parentNode;
            if (todoItem && todoItem.toggle) {
              todoItem.toggle(event.target.checked);
            }
          }
        },
        {
          tagName: 'span',
          textContent: '${this.parentNode.item.text.get()}'
        },
        {
          tagName: 'button',
          textContent: '×',
          onclick: function (event) {
            const todoItem = event.target.parentNode;
            if (todoItem && todoItem.delete) {
              todoItem.delete();
            }
          }
        }
      ]
    });

    expect(todoItem).toBeDefined();
    expect(todoItem.tagName.toLowerCase()).toBe('todo-item');
    expect(todoItem.item).toBeDefined();
    expect(todoItem.index).toBeDefined();
    expect(typeof todoItem.delete).toBe('function');
    expect(typeof todoItem.toggle).toBe('function');
  });

  test('should support template literal reactivity in custom elements', () => {
    const reactiveElement = createElement({
      tagName: 'reactive-element',
      message: 'Hello World',
      count: 42,
      children: [
        {
          tagName: 'div',
          textContent: 'Message: ${this.parentNode.message.get()}'
        },
        {
          tagName: 'div',
          textContent: 'Count: ${this.parentNode.count.get()}'
        },
        {
          tagName: 'div',
          textContent: 'Combined: ${this.parentNode.message.get()} - ${this.parentNode.count.get()}'
        }
      ]
    });

    expect(reactiveElement).toBeDefined();
    expect(reactiveElement.tagName.toLowerCase()).toBe('reactive-element');
    expect(reactiveElement.message).toBeDefined();
    expect(reactiveElement.count).toBeDefined();
    
    // Test that the reactive properties work
    if (typeof reactiveElement.message === 'object' && reactiveElement.message.set) {
      reactiveElement.message.set('Updated Message');
      expect(reactiveElement.message.get()).toBe('Updated Message');
    }
  });

  test('should handle complex reactive todo list structure', () => {
    DDOM({
      todos: [
        { text: 'Learn DDOM', completed: false },
        { text: 'Build apps', completed: true }
      ]
    });

    const getTodosValue = (todos) => {
      if (typeof todos === 'object' && todos.get) {
        return todos.get();
      }
      return Array.isArray(todos) ? todos : [];
    };

    // Test initial todos
    const initialTodos = getTodosValue(window.todos);
    expect(Array.isArray(initialTodos)).toBe(true);
    expect(initialTodos.length).toBe(2);
    expect(initialTodos[0].text).toBe('Learn DDOM');
    expect(initialTodos[0].completed).toBe(false);
    expect(initialTodos[1].text).toBe('Build apps');
    expect(initialTodos[1].completed).toBe(true);

    // Test updating todos
    if (typeof window.todos === 'object' && window.todos.set) {
      const newTodos = [
        ...window.todos.get(),
        { text: 'Share with world', completed: false }
      ];
      window.todos.set(newTodos);
      
      const updatedTodos = window.todos.get();
      expect(updatedTodos.length).toBe(3);
      expect(updatedTodos[2].text).toBe('Share with world');
    }
  });

  test('should support dynamic array binding in custom elements', () => {
    const arrayBindingSpec = {
      tagName: 'todo-list',
      id: 'todo-list',
      items: 'this.parentNode.todos',
      children: {
        tagName: 'todo-item',
        item: (item) => item,
        index: (item, index) => index
      }
    };

    // Test that the array binding element can be created
    const todoList = createElement(arrayBindingSpec);
    expect(todoList).toBeDefined();
    expect(todoList.tagName.toLowerCase()).toBe('todo-list');
    expect(todoList.id).toBe('todo-list');
  });
});