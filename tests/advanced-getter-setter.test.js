import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createElement } from '../lib/dist/index.js';

describe('Advanced Getter/Setter Examples', () => {
  let container;
  
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // Use fake timers to control microtask execution
    vi.useFakeTimers({ toFake: ['nextTick', 'queueMicrotask'] });
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
  });

  test('should support complex computed property example from issue', () => {
    // Example similar to the one in the issue description
    const element = createElement({
      tagName: 'div',
      name: 'John',
      $score: 85,  // Reactive signal
      $level: 3,   // Reactive signal
      
      // Getter - automatically becomes computed property
      get textContent() {
        const score = this.$score.get();
        const level = this.$level.get();
        if (score >= 90) return `Expert (Level ${level})`;
        if (score >= 70) return `Advanced (Level ${level})`;
        if (score >= 50) return `Intermediate (Level ${level})`;
        return `Beginner (Level ${level})`;
      },
      
      // Setter - becomes reactive property updater
      set playerLevel(newLevel) {
        this.$level.set(newLevel);
        this.setAttribute('data-level', newLevel);
      }
    });
    
    container.appendChild(element);
    
    // Test initial computed property
    expect(element.textContent).toBe('Advanced (Level 3)');
    expect(element.getAttribute('data-level')).toBeNull(); // No attribute set initially
    
    // Test setter functionality
    element.playerLevel = 5;
    expect(element.$level.get()).toBe(5);
    expect(element.getAttribute('data-level')).toBe('5');
    
    // Test reactive getter - should update when signal changes
    element.$score.set(95);
    vi.runAllTicks(); // Flush microtasks (including reactive effects)
    expect(element.textContent).toBe('Expert (Level 5)');
    
    // Test with lower score
    element.$score.set(45);
    vi.runAllTicks(); // Flush microtasks (including reactive effects)
    expect(element.textContent).toBe('Beginner (Level 5)');
  });

  test('should support reactive DOM properties', () => {
    const element = createElement({
      tagName: 'div',
      $count: 10,
      
      // This should automatically update the DOM textContent when $count changes
      get textContent() {
        return `Current count: ${this.$count.get()}`;
      }
    });
    
    container.appendChild(element);
    
    // Initial value
    expect(element.textContent).toBe('Current count: 10');
    
    // Should be reactive
    element.$count.set(25);
    vi.runAllTicks(); // Flush microtasks (including reactive effects)
    expect(element.textContent).toBe('Current count: 25');
    
    element.$count.set(0);
    vi.runAllTicks(); // Flush microtasks (including reactive effects)
    expect(element.textContent).toBe('Current count: 0');
  });

  test('should work with complex nested computed properties', () => {
    const element = createElement({
      tagName: 'div',
      $firstName: 'Jane',
      $lastName: 'Smith',
      $score: 88,
      
      get fullName() {
        return `${this.$firstName.get()} ${this.$lastName.get()}`;
      },
      
      get title() {
        const score = this.$score.get();
        if (score >= 90) return 'Expert';
        if (score >= 70) return 'Advanced';
        return 'Beginner';
      },
      
      get displayName() {
        return `${this.fullName} - ${this.title}`;
      }
    });
    
    container.appendChild(element);
    
    expect(element.fullName).toBe('Jane Smith');
    expect(element.title).toBe('Advanced');
    expect(element.displayName).toBe('Jane Smith - Advanced');
    
    // Update individual properties
    element.$score.set(95);
    vi.runAllTicks(); // Flush microtasks (including reactive effects)
    expect(element.title).toBe('Expert');
    expect(element.displayName).toBe('Jane Smith - Expert');
    
    element.$firstName.set('Dr. Jane');
    vi.runAllTicks(); // Flush microtasks (including reactive effects)
    expect(element.fullName).toBe('Dr. Jane Smith');
    expect(element.displayName).toBe('Dr. Jane Smith - Expert');
  });

  test('should support both getter and setter with complex interactions', () => {
    const element = createElement({
      tagName: 'div',
      $internalValue: 'hello',
      
      get value() {
        return this.$internalValue.get().toUpperCase();
      },
      
      set value(newValue) {
        this.$internalValue.set(newValue.toLowerCase());
        this.setAttribute('data-original', newValue);
      }
    });
    
    container.appendChild(element);
    
    // Test getter
    expect(element.value).toBe('HELLO');
    
    // Test setter
    element.value = 'WORLD';
    expect(element.$internalValue.get()).toBe('world');
    expect(element.getAttribute('data-original')).toBe('WORLD');
    expect(element.value).toBe('WORLD');
    
    // Test that changing the signal updates the getter
    element.$internalValue.set('test');
    expect(element.value).toBe('TEST');
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
    
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
});