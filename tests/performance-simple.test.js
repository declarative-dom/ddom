import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement, Signal } from '../lib/dist/index.js';

describe('Performance Test Example', () => {
  beforeEach(() => {
    // Clean up any global variables
    const testProps = ['count', 'randomValue', 'counter', 'value'];
    testProps.forEach(prop => {
      delete window[prop];
    });
  });

  test('should handle basic performance test with window properties', () => {
    DDOM({
      count: 0,
      randomValue: 0
    });

    const startTime = performance.now();
    const iterations = 100;

    // Test direct property updates on window
    for (let i = 0; i < iterations; i++) {
      if (typeof window.count === 'object' && window.count.set) {
        window.count.set(i);
      } else {
        window.count = i;
      }
      
      if (typeof window.randomValue === 'object' && window.randomValue.set) {
        window.randomValue.set(Math.random() * 1000);
      } else {
        window.randomValue = Math.random() * 1000;
      }
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Performance should be reasonable
    expect(duration).toBeLessThan(200); // Less than 200ms for 100 updates
    
    const finalCount = getSignalValue(window.count);
    expect(finalCount).toBe(iterations - 1);
    expect(typeof getSignalValue(window.randomValue)).toBe('number');
  });

  test('should handle signal creation performance', () => {
    const startTime = performance.now();
    
    // Create multiple signals
    const signals = [];
    for (let i = 0; i < 100; i++) {
      signals.push(new Signal.State(i));
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should create 100 signals quickly
    expect(duration).toBeLessThan(100); // Less than 100ms
    expect(signals.length).toBe(100);
    expect(signals[0].get()).toBe(0);
    expect(signals[99].get()).toBe(99);
  });

  test('should handle signal updates performance', () => {
    const signal = new Signal.State(0);
    
    const startTime = performance.now();
    const iterations = 1000;

    // Test signal updates
    for (let i = 0; i < iterations; i++) {
      signal.set(i);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Signal updates should be fast
    expect(duration).toBeLessThan(50); // Less than 50ms for 1000 updates
    expect(signal.get()).toBe(iterations - 1);
  });

  test('should handle element creation performance', () => {
    const startTime = performance.now();
    
    // Create multiple elements
    const elements = [];
    for (let i = 0; i < 50; i++) {
      elements.push(createElement({
        tagName: 'div',
        textContent: `Element ${i}`,
        id: `element-${i}`
      }));
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Should create 50 elements quickly
    expect(duration).toBeLessThan(200); // Less than 200ms
    expect(elements.length).toBe(50);
    expect(elements[0].tagName.toLowerCase()).toBe('div');
    expect(elements[49].id).toBe('element-49');
  });

  test('should handle computed property performance', () => {
    DDOM({
      width: 100,
      height: 200,
      get area() {
        const w = getSignalValue(this.width);
        const h = getSignalValue(this.height);
        return w * h;
      }
    });

    expect(window.area).toBe(20000);

    const startTime = performance.now();
    const iterations = 100;

    // Test computed property updates
    for (let i = 0; i < iterations; i++) {
      if (typeof window.width === 'object' && window.width.set) {
        window.width.set(100 + i);
        window.height.set(200 + i);
      } else {
        window.width = 100 + i;
        window.height = 200 + i;
      }
      // Access computed property
      const area = window.area;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Computed property updates should be reasonable
    expect(duration).toBeLessThan(100); // Less than 100ms for 100 updates
    
    const finalWidth = getSignalValue(window.width);
    const finalHeight = getSignalValue(window.height);
    expect(finalWidth).toBe(100 + iterations - 1);
    expect(finalHeight).toBe(200 + iterations - 1);
  });
});