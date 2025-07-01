/**
 * Comprehensive test suite for MappedArray functionality
 * Tests all pipeline operations: filter, sort, groupBy, map, prepend, append
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MappedArray, isMappedArrayExpr } from '../lib/src/arrays';
import { Signal } from '../lib/src/signals';
import { MappedArrayExpr } from '../types/src';

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

describe('MappedArray', () => {
  let userSignal: Signal.State<User[]>;

  beforeEach(() => {
    userSignal = new Signal.State(sampleUsers);
  });

  describe('Type Guards', () => {
    it('should correctly identify MappedArrayExpr objects', () => {
      expect(isMappedArrayExpr({ items: [] })).toBe(true);
      expect(isMappedArrayExpr({ items: 'window.data' })).toBe(true);
      expect(isMappedArrayExpr({ notItems: [] })).toBe(false);
      expect(isMappedArrayExpr(null)).toBe(false);
      expect(isMappedArrayExpr(undefined)).toBe(false);
      expect(isMappedArrayExpr('string')).toBe(false);
    });
  });

  describe('Basic Array Sources', () => {
    it('should work with static arrays', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        map: { name: (user: User) => user.name.toUpperCase() }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({ name: 'ALICE' });
    });

    it('should work with Signal.State arrays', () => {
      const mappedArray = new MappedArray({
        items: userSignal,
        map: { id: (user: User) => user.id, name: (user: User) => user.name }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(6);
      expect(result[0]).toEqual({ id: 1, name: 'Alice' });
    });

    it('should work with function sources', () => {
      const mappedArray = new MappedArray({
        items: () => sampleUsers.slice(0, 3),
        map: { name: (user: User) => user.name }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(3);
      expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });
  });

  describe('Filtering', () => {
    it('should filter items based on property values', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        filter: [
          { leftOperand: 'active', operator: '===', rightOperand: true }
        ],
        map: { name: (user: User) => user.name }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'Diana', 'Eve']);
    });

    it('should filter with function operands', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        filter: [
          { leftOperand: (user: User) => user.age, operator: '>=', rightOperand: 30 }
        ],
        map: { name: (user: User) => user.name }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['Alice', 'Charlie', 'Eve', 'Frank']);
    });

    it('should support multiple filters (AND logic)', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        filter: [
          { leftOperand: 'active', operator: '===', rightOperand: true },
          { leftOperand: 'department', operator: '===', rightOperand: 'Engineering' }
        ],
        map: { name: (user: User) => user.name }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });

    it('should support string method filters', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        filter: [
          { leftOperand: 'name', operator: 'startsWith', rightOperand: 'A' }
        ],
        map: { name: (user: User) => user.name }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Alice');
    });
  });

  describe('Sorting', () => {
    it('should sort by property name ascending', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        sort: [
          { sortBy: 'name', direction: 'asc' }
        ],
        map: { name: (user: User) => user.name }
      });

      const result = mappedArray.get();
      expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank']);
    });

    it('should sort by property name descending', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        sort: [
          { sortBy: 'age', direction: 'desc' }
        ],
        map: { name: (user: User) => user.name, age: (user: User) => user.age }
      });

      const result = mappedArray.get();
      expect(result.map(r => r.name)).toEqual(['Frank', 'Charlie', 'Eve', 'Alice', 'Diana', 'Bob']);
    });

    it('should sort with function sortBy', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        sort: [
          { sortBy: (user: User) => user.salary, direction: 'asc' }
        ],
        map: { name: (user: User) => user.name, salary: (user: User) => user.salary }
      });

      const result = mappedArray.get();
      expect(result.map(r => r.name)).toEqual(['Bob', 'Diana', 'Eve', 'Alice', 'Charlie', 'Frank']);
    });

    it('should support multiple sort criteria', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        sort: [
          { sortBy: 'department', direction: 'asc' },
          { sortBy: 'age', direction: 'asc' }
        ],
        map: { name: (user: User) => user.name, department: (user: User) => user.department }
      });

      const result = mappedArray.get();
      // Engineering: Alice(30), Charlie(35), Frank(40)
      // Marketing: Eve(32)  
      // Sales: Bob(25), Diana(28)
      expect(result.map(r => r.name)).toEqual(['Alice', 'Charlie', 'Frank', 'Eve', 'Bob', 'Diana']);
    });
  });

  describe('Grouping', () => {
    it('should group by property', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        groupBy: (user: User) => user.department,
        map: {
          department: (group: any) => group.key,
          count: (group: any) => group.items.length,
          names: (group: any) => group.items.map((user: User) => user.name)
        }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(3);
      
      // Find by checking the actual department value, not the function
      const engineering = result.find((r: any) => r.department === 'Engineering');
      expect(engineering?.count).toBe(3);
      expect(engineering?.names).toEqual(['Alice', 'Charlie', 'Frank']);

      const sales = result.find((r: any) => r.department === 'Sales');
      expect(sales?.count).toBe(2);
      expect(sales?.names).toEqual(['Bob', 'Diana']);

      const marketing = result.find((r: any) => r.department === 'Marketing');
      expect(marketing?.count).toBe(1);
      expect(marketing?.names).toEqual(['Eve']);
    });

    it('should group by computed value', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        groupBy: (user: User) => user.age >= 30 ? 'senior' : 'junior',
        map: {
          category: (group: any) => group.key,
          count: (group: any) => group.items.length,
          avgAge: (group: any) => group.items.reduce((sum: number, user: User) => sum + user.age, 0) / group.items.length
        }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(2);

      const senior = result.find((r: any) => r.category === 'senior');
      expect(senior?.count).toBe(4);
      expect(senior?.avgAge).toBe(34.25); // (30+35+32+40)/4

      const junior = result.find((r: any) => r.category === 'junior');
      expect(junior?.count).toBe(2);
      expect(junior?.avgAge).toBe(26.5); // (25+28)/2
    });
  });

  describe('Mapping', () => {
    it('should map with object templates', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers.slice(0, 2),
        map: {
          id: (user: User) => user.id,
          displayName: (user: User) => `${user.name} (${user.department})`,
          isActive: (user: User) => user.active,
          static: 'test'
        }
      });

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
      const mappedArray = new MappedArray({
        items: sampleUsers.slice(0, 2),
        map: '${this.name} - ${this.department}'
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Alice - Engineering');
      expect(result[1]).toBe('Bob - Sales');
    });

    it('should map with direct values', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers.slice(0, 3),
        map: 'transformed'
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(3);
      expect(result).toEqual(['transformed', 'transformed', 'transformed']);
    });
  });

  describe('Prepend and Append', () => {
    it('should prepend items to the result', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers.slice(0, 2),
        map: { name: (user: User) => user.name },
        prepend: [{ name: 'FIRST' }, { name: 'SECOND' }]
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['FIRST', 'SECOND', 'Alice', 'Bob']);
    });

    it('should append items to the result', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers.slice(0, 2),
        map: { name: (user: User) => user.name },
        append: [{ name: 'LAST' }, { name: 'FINAL' }]
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'LAST', 'FINAL']);
    });

    it('should support both prepend and append', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers.slice(0, 2),
        map: { name: (user: User) => user.name },
        prepend: [{ name: 'FIRST' }],
        append: [{ name: 'LAST' }]
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(4);
      expect(result.map(r => r.name)).toEqual(['FIRST', 'Alice', 'Bob', 'LAST']);
    });
  });

  describe('Complete Pipeline', () => {
    it('should execute full pipeline: filter → sort → groupBy → map → prepend/append', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        filter: [
          { leftOperand: 'active', operator: '===', rightOperand: true }
        ],
        sort: [
          { sortBy: 'department', direction: 'asc' },
          { sortBy: 'age', direction: 'asc' }
        ],
        groupBy: (user: User) => user.department,
        map: {
          department: (group: any) => group.key,
          employees: (group: any) => group.items.map((user: User) => ({
            name: user.name,
            age: user.age
          })),
          avgAge: (group: any) => Math.round(group.items.reduce((sum: number, user: User) => sum + user.age, 0) / group.items.length)
        },
        prepend: [{ department: 'HEADER', employees: [], avgAge: 0 }],
        append: [{ department: 'FOOTER', employees: [], avgAge: 0 }]
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(5); // header + 3 departments + footer

      expect(result[0].department).toBe('HEADER');
      expect(result[4].department).toBe('FOOTER');

      const engineering = result.find((r: any) => r.department === 'Engineering');
      expect(engineering?.employees).toHaveLength(1); // Only Alice is active
      expect(engineering?.employees[0].name).toBe('Alice');
      expect(engineering?.avgAge).toBe(30);

      const sales = result.find((r: any) => r.department === 'Sales');
      expect(sales?.employees).toHaveLength(2); // Bob and Diana are active
      expect(sales?.avgAge).toBe(27); // (25+28)/2 rounded
    });
  });

  describe('Reactivity', () => {
    it('should react to source signal changes', () => {
      const mappedArray = new MappedArray({
        items: userSignal,
        filter: [
          { leftOperand: 'active', operator: '===', rightOperand: true }
        ],
        map: { name: (user: User) => user.name }
      });

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
      const mappedArray = new MappedArray({
        items: userSignal,
        map: { count: () => 1 }
      });

      expect(mappedArray.get()).toHaveLength(6);

      // Remove users
      userSignal.set(sampleUsers.slice(0, 3));
      expect(mappedArray.get()).toHaveLength(3);
    });
  });

  describe('Mutable Properties Analysis', () => {
    it('should identify mutable properties correctly', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        map: {
          staticProp: 'static',
          dynamicProp: (user: User) => user.name,
          anotherStatic: 42,
          anotherDynamic: (user: User) => user.age
        }
      });

      const mutableProps = mappedArray.getMutableProps();
      expect(mutableProps).toContain('dynamicProp');
      expect(mutableProps).toContain('anotherDynamic');
      expect(mutableProps).not.toContain('staticProp');
      expect(mutableProps).not.toContain('anotherStatic');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid source types gracefully', () => {
      expect(() => {
        new MappedArray({
          items: 'invalid' as any
        });
      }).toThrow('Cannot resolve property accessor: invalid');
    });

    it('should handle filter errors gracefully', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        filter: [
          { leftOperand: () => { throw new Error('Filter error'); }, operator: '===', rightOperand: true }
        ]
      });

      // Should return empty array on error
      expect(mappedArray.get()).toEqual([]);
    });

    it('should handle mapping errors gracefully', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers,
        map: {
          name: (user: User) => user.name,
          error: () => { throw new Error('Map error'); }
        }
      });

      // Should return empty array on error
      expect(mappedArray.get()).toEqual([]);
    });
  });

  describe('Resource Management', () => {
    it('should dispose properly', () => {
      const mappedArray = new MappedArray({
        items: userSignal,
        map: { name: (user: User) => user.name }
      });

      expect(() => mappedArray.dispose()).not.toThrow();
    });

    it('should allow setting new array values on Signal.State sources', () => {
      const mappedArray = new MappedArray({
        items: userSignal,
        map: { name: (user: User) => user.name }
      });

      const newUsers = sampleUsers.slice(0, 2);
      mappedArray.set(newUsers);

      expect(mappedArray.get()).toHaveLength(2);
    });

    it('should accept static array items', () => {
      const mappedArray = new MappedArray({
        items: sampleUsers, // Static array, not a signal
        map: { name: (user: User) => user.name }
      });

      const result = mappedArray.get();
      expect(result).toHaveLength(6);
      expect(result.map(r => r.name)).toEqual(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank']);
    });
  });
});