/**
 * Comprehensive test suite for MappedArray functionality
 * Tests all pipeline operations: filter, sort, groupBy, map, prepend, append
 */

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createArrayNamespace } from '../lib/src/namespaces/array';
import { Signal } from '../lib/src/core/signals';

// Mock DOM environment for tests
Object.defineProperty(globalThis, 'document', {
  value: {
    body: {},
    createElement: () => ({}),
  },
  writable: true,
});

// Sample data for testing
interface User {
  id: number;
  name: string;
  department: string;
  age: number;
  active: boolean;
  salary: number;
}

const sampleUsers: User[] = [
  { id: 1, name: 'Alice', department: 'Engineering', age: 30, active: true, salary: 80000 },
  { id: 2, name: 'Bob', department: 'Sales', age: 25, active: true, salary: 60000 },
  { id: 3, name: 'Charlie', department: 'Engineering', age: 35, active: false, salary: 90000 },
  { id: 4, name: 'Diana', department: 'Sales', age: 28, active: true, salary: 65000 },
  { id: 5, name: 'Eve', department: 'Marketing', age: 32, active: true, salary: 70000 },
  { id: 6, name: 'Frank', department: 'Engineering', age: 40, active: false, salary: 95000 },
];

describe('Array Namespace', () => {
  let userSignal: Signal.State<User[]>;

  beforeEach(() => {
    userSignal = new Signal.State(sampleUsers);
    // Use fake timers to control microtask execution
    vi.useFakeTimers({ toFake: ['nextTick', 'queueMicrotask'] });
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
  });

  describe('Basic Array Sources', () => {
    it('should work with static arrays', () => {
      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers,
        map: { name: '${item.name.toUpperCase()}' },
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({ name: 'ALICE' });
    });

    it('should work with Signal.State arrays', () => {
      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: userSignal,
        map: { id: 'item.id', name: 'item.name' },
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({ id: 1, name: 'Alice' });
    });

    it('should work with function references as array sources', () => {
      // Create a mock parent element with a function that returns processed data
      const parentElement = {
        $processedUsers: function () {
          return sampleUsers.filter(user => user.active).map(user => ({
            ...user,
            displayName: `${user.name} (${user.department})`
          }));
        }
      };

      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: 'this.$processedUsers', // Function reference string
        map: {
          id: 'item.id',
          name: 'item.displayName',
          department: 'item.department'
        },
      }, 'testKey', parentElement);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(4); // Only active users
      expect(result[0]).toEqual({
        id: 1,
        name: 'Alice (Engineering)',
        department: 'Engineering'
      });
    });

    it('should work with property accessor strings to Signal.State', () => {
      // Create a test element with proper context structure that mirrors real usage
      const testElement = {
        // Add the signal to the element's context like adoptWindow would do
        $globalUsers: userSignal
      };

      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: 'this.$globalUsers', // This should resolve to the signal on testElement
        map: { id: 'item.id', name: 'item.name' },
      }, 'testKey', testElement);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({ id: 1, name: 'Alice' });
    });

    it('should work with window property accessor', () => {
      // Set up global window like the real example does
      (globalThis.window as any).$globalUsers = userSignal;

      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: 'window.$globalUsers', // Property accessor to global signal
        map: { id: 'item.id', name: 'item.name' },
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({ id: 1, name: 'Alice' });

      // Clean up
      delete (globalThis.window as any).$globalUsers;
    });
  });

  describe('Filtering', () => {
    it('should filter items based on property values', () => {
      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers,
        filter: [
          { leftOperand: 'item.active', operator: '===', rightOperand: true },
        ],
        map: { name: 'item.name' },
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'Diana', 'Eve']);
    });

    it('should filter with item accessors', () => {
      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers,
        filter: [
          { leftOperand: 'item.age', operator: '>=', rightOperand: 30 },
        ],
        map: { name: 'item.name' },
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['Alice', 'Charlie', 'Eve', 'Frank']);
    });

    it('should support multiple filters (AND logic)', () => {
      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers,
        filter: [
          { leftOperand: 'item.active', operator: '===', rightOperand: true },
          { leftOperand: 'item.department', operator: '===', rightOperand: 'Engineering' },
        ],
        map: { name: 'item.name' },
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('should support string method filters', () => {
      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers,
        filter: [
          { leftOperand: 'item.name', operator: 'startsWith', rightOperand: 'A' },
        ],
        map: { name: 'item.name' },
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('Sorting', () => {
    it('should sort by property name ascending', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers,
        sort: [
          { sortBy: 'item.name', direction: 'asc' }
        ],
        map: { name: 'item.name' }
      }, 'testKey', document.body);

      const result = mappedArray.get();
      expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank']);
    });

    it('should sort by property name descending', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers,
        sort: [
          { sortBy: 'item.age', direction: 'desc' }
        ],
        map: { name: 'item.name', age: 'item.age' }
      }, 'testKey', document.body);

      const result = mappedArray.get();
      expect(result.map(r => r.name)).toEqual(['Frank', 'Charlie', 'Eve', 'Alice', 'Diana', 'Bob']);
    });

    it('should sort with property sortBy', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers,
        sort: [
          { sortBy: 'item.salary', direction: 'asc' }
        ],
        map: { name: 'item.name', salary: 'item.salary' }
      }, 'testKey', document.body);

      const result = mappedArray.get();
      expect(result.map(r => r.name)).toEqual(['Bob', 'Diana', 'Eve', 'Alice', 'Charlie', 'Frank']);
    });

    it('should support multiple sort criteria', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers,
        sort: [
          { sortBy: 'item.department', direction: 'asc' },
          { sortBy: 'item.age', direction: 'asc' }
        ],
        map: { name: 'item.name', department: 'item.department' }
      }, 'testKey', document.body);

      const result = mappedArray.get();
      // Engineering: Alice(30), Charlie(35), Frank(40)
      // Marketing: Eve(32)  
      // Sales: Bob(25), Diana(28)
      expect(result.map(r => r.name)).toEqual(['Alice', 'Charlie', 'Frank', 'Eve', 'Bob', 'Diana']);
    });
  });

  describe('Mapping', () => {
    it('should map with object templates', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers.slice(0, 2),
        map: {
          id: 'item.id',
          displayName: '${item.name} (${item.department})',
          isActive: 'item.active',
          static: 'test'
        }
      }, 'testKey', document.body);

      const result = mappedArray.get();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        displayName: 'Alice (Engineering)',
        isActive: true,
        static: 'test'
      });
    });

    it('should map with string templates', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers.slice(0, 2),
        map: '${item.name} - ${item.department}'
      }, 'testKey', document.body);

      const result = mappedArray.get();
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Alice - Engineering');
      expect(result[1]).toBe('Bob - Sales');
    });

    it('should map with direct values', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers.slice(0, 3),
        map: 'transformed'
      }, 'testKey', document.body);

      const result = mappedArray.get();
      expect(result).toHaveLength(3);
      expect(result).toEqual(['transformed', 'transformed', 'transformed']);
    });
  });

  describe('Reactivity', () => {
    it('should react to source signal changes', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: userSignal,
        filter: [
          { leftOperand: 'item.active', operator: '===', rightOperand: true }
        ],
        map: { name: 'item.name' }
      }, 'testKey', document.body);

      // Initial state
      expect(mappedArray.get()).toHaveLength(4);

      // Add new active user
      const newUsers = [...sampleUsers, {
        id: 7, name: 'Grace', department: 'Engineering', age: 29, active: true, salary: 75000
      }];
      userSignal.set(newUsers);

      // Should now have 5 active users
      expect(mappedArray.get()).toHaveLength(5);
      expect(mappedArray.get().map(r => r.name)).toContain('Grace');
    });

    it('should update when source array is modified', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: userSignal,
        map: { count: 1 }
      }, 'testKey', document.body);

      expect(mappedArray.get()).toHaveLength(6);

      // Remove users
      userSignal.set(sampleUsers.slice(0, 3));
      expect(mappedArray.get()).toHaveLength(3);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid source types gracefully', () => {
      // Create a mock context that doesn't have the expected property
      const mockElement = {
        // Missing the expected property, so resolution will fail
      };

      // Suppress expected warning for this test
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      expect(() => {
        const arrayNamespace = createArrayNamespace({
          prototype: 'Array',
          items: 'nonexistent.property'
        }, 'testKey', mockElement);

        // Try to get the result - this should trigger the error
        arrayNamespace.get();
      }).not.toThrow(); // Should not throw, but should warn and return empty array
      
      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ArrayNamespace: Source signal does not contain an array:',
        expect.anything()
      );
      
      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });

    it('should handle function references that return non-arrays', () => {
      const parentElement = {
        $badFunction: function () {
          return "not an array"; // Returns non-array
        }
      };

      // Suppress expected warning for this test
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: 'this.$badFunction'
      }, 'testKey', parentElement);

      // Should return empty array and warn
      const result = arrayNamespace.get();
      expect(result).toEqual([]);
      
      // Verify warning was logged
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'ArrayNamespace: Source signal does not contain an array:',
        expect.anything()
      );
      
      // Restore console.warn
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Resource Management', () => {
    it('should allow setting new array values on Signal.State sources', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: userSignal,
        map: { name: 'item.name' }
      }, 'testKey', document.body);

      const newUsers = sampleUsers.slice(0, 2);
      // Directly update the source signal
      userSignal.set(newUsers);

      expect(mappedArray.get()).toHaveLength(2);
    });

    it('should accept static array items', () => {
      const mappedArray = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers, // Static array, not a signal
        map: { name: 'item.name' }
      }, 'testKey', document.body);

      const result = mappedArray.get();
      expect(result).toHaveLength(6);
      expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank']);
    });
  });

  describe('Unshift and Concat', () => {
    it('should prepend items to the array using unshift', () => {
      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers.slice(0, 2),
        map: { name: 'item.name' },
        unshift: [{ name: 'FIRST' }, { name: 'SECOND' }],
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['FIRST', 'SECOND', 'Alice', 'Bob']);
    });

    it('should append items to the array using concat', () => {
      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers.slice(0, 2),
        map: { name: 'item.name' },
        concat: [{ name: 'LAST' }, { name: 'FINAL' }],
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'LAST', 'FINAL']);
    });

    it('should support both unshift and concat', () => {
      const arrayNamespace = createArrayNamespace({
        prototype: 'Array',
        items: sampleUsers.slice(0, 2),
        map: { name: 'item.name' },
        unshift: [{ name: 'FIRST' }],
        concat: [{ name: 'LAST' }],
      }, 'testKey', document.body);

      const result = arrayNamespace.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['FIRST', 'Alice', 'Bob', 'LAST']);
    });
  });
});