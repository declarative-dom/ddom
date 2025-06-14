import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Performance Test Example', () => {
  let app;

  beforeEach(() => {
    app = null;
  });

  test('should handle basic performance test', () => {
    const testConfig = {
      count: 0,
      randomValue: 0
    };

    app = DDOM(testConfig);

    const startTime = performance.now();
    const iterations = 100;

    // Test direct property updates
    for (let i = 0; i < iterations; i++) {
      app.count = i;
      app.randomValue = Math.random() * 1000;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Performance should be reasonable
    expect(duration).toBeLessThan(100); // Less than 100ms for 100 updates
    expect(app.count).toBe(iterations - 1);
    expect(typeof app.randomValue).toBe('number');
  });

  test('should handle stress test with many updates', () => {
    const testConfig = {
      counter: 0,
      value: 'initial',
      nested: {
        prop1: 0,
        prop2: 'test'
      }
    };

    app = DDOM(testConfig);

    const startTime = performance.now();
    const iterations = 1000;

    // Stress test with multiple property updates
    for (let i = 0; i < iterations; i++) {
      app.counter = i;
      app.value = `iteration-${i}`;
      app.nested.prop1 = i * 2;
      app.nested.prop2 = `nested-${i}`;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should complete stress test in reasonable time
    expect(duration).toBeLessThan(1000); // Less than 1 second for 1000 iterations
    expect(app.counter).toBe(iterations - 1);
    expect(app.value).toBe(`iteration-${iterations - 1}`);
    expect(app.nested.prop1).toBe((iterations - 1) * 2);
    expect(app.nested.prop2).toBe(`nested-${iterations - 1}`);
  });

  test('should measure reactive property creation performance', () => {
    const startTime = performance.now();
    
    // Create multiple reactive objects
    const apps = [];
    for (let i = 0; i < 100; i++) {
      apps.push(DDOM({
        id: i,
        name: `App ${i}`,
        data: {
          value: i * 10,
          items: [`item-${i}-1`, `item-${i}-2`]
        }
      }));
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should create 100 reactive objects quickly
    expect(duration).toBeLessThan(500); // Less than 500ms
    expect(apps.length).toBe(100);
    expect(apps[0].id).toBe(0);
    expect(apps[99].id).toBe(99);
    expect(apps[50].data.value).toBe(500);
  });

  test('should measure property access performance', () => {
    app = DDOM({
      prop1: 'value1',
      prop2: 42,
      prop3: { nested: 'nested value' },
      prop4: [1, 2, 3, 4, 5]
    });

    const startTime = performance.now();
    const iterations = 10000;

    // Test property access performance
    for (let i = 0; i < iterations; i++) {
      const _ = app.prop1;
      const __ = app.prop2; 
      const ___ = app.prop3.nested;
      const ____ = app.prop4[0];
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Property access should be very fast
    expect(duration).toBeLessThan(100); // Less than 100ms for 10k accesses
  });

  test('should measure computed property performance', () => {
    app = DDOM({
      width: 100,
      height: 200,
      get area() {
        return this.width * this.height;
      },
      get perimeter() {
        return 2 * (this.width + this.height);
      }
    });

    expect(app.area).toBe(20000);
    expect(app.perimeter).toBe(600);

    const startTime = performance.now();
    const iterations = 1000;

    // Test computed property updates
    for (let i = 0; i < iterations; i++) {
      app.width = 100 + i;
      app.height = 200 + i;
      // Access computed properties
      const area = app.area;
      const perimeter = app.perimeter;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Computed property updates should be reasonable
    expect(duration).toBeLessThan(200); // Less than 200ms for 1k updates
    expect(app.width).toBe(100 + iterations - 1);
    expect(app.height).toBe(200 + iterations - 1);
  });

  test('should handle memory efficiency with many objects', () => {
    const objects = [];
    const objectCount = 1000;

    const startTime = performance.now();

    // Create many small reactive objects
    for (let i = 0; i < objectCount; i++) {
      objects.push(DDOM({
        id: i,
        active: i % 2 === 0,
        data: `data-${i}`
      }));
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should create many objects efficiently
    expect(duration).toBeLessThan(1000); // Less than 1 second
    expect(objects.length).toBe(objectCount);

    // Verify objects are working correctly
    expect(objects[0].id).toBe(0);
    expect(objects[0].active).toBe(true);
    expect(objects[1].active).toBe(false);
    expect(objects[999].id).toBe(999);
    expect(objects[500].data).toBe('data-500');
  });

  test('should benchmark template literal processing', () => {
    app = DDOM({
      name: 'Test App',
      version: '1.0.0',
      status: 'active',
      document: {
        body: {
          children: Array.from({ length: 50 }, (_, i) => ({
            tagName: 'div',
            id: `item-${i}`,
            textContent: 'Item ${this.parentNode.name} v${this.parentNode.version} - ${this.parentNode.status}',
            className: 'item-${this.parentNode.status}'
          }))
        }
      }
    });

    const startTime = performance.now();
    const iterations = 100;

    // Update properties that affect many template literals
    for (let i = 0; i < iterations; i++) {
      app.name = `App ${i}`;
      app.version = `${1}.${i}.0`;
      app.status = i % 2 === 0 ? 'active' : 'inactive';
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Template literal updates should be efficient
    expect(duration).toBeLessThan(300); // Less than 300ms
    expect(app.name).toBe(`App ${iterations - 1}`);
    expect(app.version).toBe(`1.${iterations - 1}.0`);
  });
});