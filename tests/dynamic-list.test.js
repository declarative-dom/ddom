import { describe, test, expect, beforeEach } from 'vitest';
import { adoptWindow } from '../lib/dist/index.js';

describe('Dynamic List Example', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
  });

  test('should create dynamic list with transparent reactivity', () => {
    const spec = {
      items: ['Item 1', 'Item 2', 'Item 3'],
      newItemText: '',
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'list-container',
            children: [{
              tagName: 'ul',
              id: 'dynamic-list',
              children: [
                { tagName: 'li', textContent: 'Static item 1' },
                { tagName: 'li', textContent: 'Static item 2' }
              ]
            }]
          }]
        }
      }
    };

    adoptWindow(spec);
    
    // Check that the spec properties are available
    expect(window.items).toBeDefined();
    expect(Array.isArray(window.items)).toBe(true);
    expect(window.items.length).toBe(3);
    expect(window.newItemText).toBe('');
  });

  test('should handle list item updates', () => {
    const spec = {
      todos: [
        { id: 1, text: 'Task 1', completed: false },
        { id: 2, text: 'Task 2', completed: true }
      ],
      filter: 'all'
    };

    adoptWindow(spec);

    expect(window.todos).toBeDefined();
    expect(Array.isArray(window.todos)).toBe(true);
    expect(window.todos.length).toBe(2);
    expect(window.todos[0].text).toBe('Task 1');
    expect(window.todos[0].completed).toBe(false);
    expect(window.todos[1].completed).toBe(true);
    expect(window.filter).toBe('all');
  });

  test('should support adding new items', () => {
    const spec = {
      items: ['Initial Item'],
      addItem: function(text) {
        this.items.push(text);
      }
    };

    adoptWindow(spec);

    expect(window.items.length).toBe(1);
    expect(window.items[0]).toBe('Initial Item');

    // Test adding new item
    if (typeof window.addItem === 'function') {
      window.addItem('New Item');
      expect(window.items.length).toBe(2);
      expect(window.items[1]).toBe('New Item');
    }
  });

  test('should support removing items', () => {
    const spec = {
      items: ['Item 1', 'Item 2', 'Item 3'],
      removeItem: function(index) {
        this.items.splice(index, 1);
      }
    };

    adoptWindow(spec);

    expect(window.items.length).toBe(3);

    // Test removing item
    if (typeof window.removeItem === 'function') {
      window.removeItem(1); // Remove 'Item 2'
      expect(window.items.length).toBe(2);
      expect(window.items[0]).toBe('Item 1');
      expect(window.items[1]).toBe('Item 3');
    }
  });

  test('should handle filter functionality', () => {
    const spec = {
      todos: [
        { id: 1, text: 'Task 1', completed: false },
        { id: 2, text: 'Task 2', completed: true },
        { id: 3, text: 'Task 3', completed: false }
      ],
      filter: 'all',
      get filteredTodos() {
        if (this.filter === 'completed') {
          return this.todos.filter(todo => todo.completed);
        } else if (this.filter === 'active') {
          return this.todos.filter(todo => !todo.completed);
        }
        return this.todos;
      }
    };

    adoptWindow(spec);

    // Test 'all' filter
    expect(window.filteredTodos.length).toBe(3);

    // Test 'completed' filter
    window.filter = 'completed';
    expect(window.filteredTodos.length).toBe(1);
    expect(window.filteredTodos[0].completed).toBe(true);

    // Test 'active' filter
    window.filter = 'active';
    expect(window.filteredTodos.length).toBe(2);
    expect(window.filteredTodos.every(todo => !todo.completed)).toBe(true);
  });

  test('should handle item state changes', () => {
    const spec = {
      items: [
        { name: 'Item 1', active: true },
        { name: 'Item 2', active: false }
      ],
      toggleItem: function(index) {
        this.items[index].active = !this.items[index].active;
      }
    };

    adoptWindow(spec);

    expect(window.items[0].active).toBe(true);
    expect(window.items[1].active).toBe(false);

    // Test toggling item state
    if (typeof window.toggleItem === 'function') {
      window.toggleItem(0);
      expect(window.items[0].active).toBe(false);
      
      window.toggleItem(1);
      expect(window.items[1].active).toBe(true);
    }
  });

  test('should support list operations with reactive updates', () => {
    const spec = {
      list: [],
      count: 0,
      addToList: function(item) {
        this.list.push(item);
        this.count = this.list.length;
      },
      clearList: function() {
        this.list.length = 0;
        this.count = 0;
      }
    };

    adoptWindow(spec);

    expect(window.list.length).toBe(0);
    expect(window.count).toBe(0);

    // Test adding items
    if (typeof window.addToList === 'function') {
      window.addToList('First');
      expect(window.list.length).toBe(1);
      expect(window.count).toBe(1);

      window.addToList('Second');
      expect(window.list.length).toBe(2);
      expect(window.count).toBe(2);
    }

    // Test clearing list
    if (typeof window.clearList === 'function') {
      window.clearList();
      expect(window.list.length).toBe(0);
      expect(window.count).toBe(0);
    }
  });
});