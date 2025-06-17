import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement } from '../lib/dist/index.js';

describe('Dynamic List Example', () => {
  beforeEach(() => {
    // Clean up any global variables
    const testProps = ['items', 'addItem', 'removeItem', 'updateItem'];
    testProps.forEach(prop => {
      delete window[prop];
    });
  });

  test('should create dynamic list with reactive items array', () => {
    const dynamicListSpec = {
      items: ['Apple', 'Banana', 'Cherry'],
      
      addItem: function () {
        const newItem = 'New Item';
        this.items.set([...this.items.get(), newItem]);
      },

      removeItem: function (index) {
        const items = this.items.get();
        if (index >= 0 && index < items.length) {
          const updatedItems = items.filter((_, i) => i !== index);
          this.items.set(updatedItems);
        }
      },

      updateItem: function (index, newText) {
        if (newText && newText.trim()) {
          const updatedItems = [...this.items.get()];
          updatedItems[index] = newText.trim();
          this.items.set(updatedItems);
        }
      }
    };

    // Test that DDOM can process the dynamic list spec
    expect(() => DDOM(dynamicListSpec)).not.toThrow();
    
    // Test that the properties are available on window
    expect(window.items).toBeDefined();
    expect(window.addItem).toBeDefined();
    expect(window.removeItem).toBeDefined();
    expect(window.updateItem).toBeDefined();
  });

  test('should handle array operations on reactive items', () => {
    DDOM({
      items: ['Apple', 'Banana', 'Cherry']
    });

    const getItemsValue = (items) => {
      if (typeof items === 'object' && items.get) {
        return items.get();
      }
      return Array.isArray(items) ? items : [];
    };

    // Test initial state
    const initialItems = getItemsValue(window.items);
    expect(Array.isArray(initialItems)).toBe(true);
    expect(initialItems).toEqual(['Apple', 'Banana', 'Cherry']);

    // Test adding an item
    if (typeof window.items === 'object' && window.items.set) {
      window.items.set([...window.items.get(), 'Orange']);
      const updatedItems = window.items.get();
      expect(updatedItems).toEqual(['Apple', 'Banana', 'Cherry', 'Orange']);
    }

    // Test removing an item
    if (typeof window.items === 'object' && window.items.set) {
      const currentItems = window.items.get();
      const filteredItems = currentItems.filter((_, i) => i !== 1); // Remove 'Banana'
      window.items.set(filteredItems);
      const finalItems = window.items.get();
      expect(finalItems).toEqual(['Apple', 'Cherry', 'Orange']);
    }
  });

  test('should create custom element for dynamic list items', () => {
    const customElementSpec = {
      customElements: [
        {
          tagName: 'dynamic-list-item',
          item: '',
          index: 0,
          children: [
            {
              tagName: 'li',
              children: [
                {
                  tagName: 'span',
                  textContent: '${this.parentNode.parentNode.item.get()}',
                },
                {
                  tagName: 'button',
                  textContent: 'Remove',
                  onclick: function (event) {
                    const listItem = this.parentNode.parentNode;
                    const index = listItem.index.get();
                    // Test that the custom element has access to its properties
                    expect(typeof index).toBe('number');
                    expect(listItem.item).toBeDefined();
                  }
                }
              ]
            }
          ]
        }
      ]
    };

    // Test that DDOM can process custom elements spec
    expect(() => DDOM(customElementSpec)).not.toThrow();
  });

  test('should handle template literal reactivity in list items', () => {
    const listItem = createElement({
      tagName: 'dynamic-list-item',
      item: 'Test Item',
      index: 0,
      children: [
        {
          tagName: 'span',
          textContent: '${this.parentNode.item.get()}'
        }
      ]
    });

    expect(listItem).toBeDefined();
    expect(listItem.tagName.toLowerCase()).toBe('dynamic-list-item');
    expect(listItem.item).toBeDefined();
    
    // Test that the item property is reactive
    if (typeof listItem.item === 'object' && listItem.item.set) {
      listItem.item.set('Updated Item');
      expect(listItem.item.get()).toBe('Updated Item');
    }
  });

  test('should support dynamic list container with mapping', () => {
    const containerSpec = {
      tagName: 'dynamic-list-items',
      children: {
        items: 'items',
        map: {
          tagName: 'dynamic-list-item',
          item: (item, index) => item,
          index: (item, index) => index,
        }
      }
    };

    // Test that the container element can be created
    const container = createElement(containerSpec);
    expect(container).toBeDefined();
    expect(container.tagName.toLowerCase()).toBe('dynamic-list-items');
  });
});