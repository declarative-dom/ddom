import { describe, test, expect } from 'vitest';
import { isMappedArrayExpr } from '../lib/dist/index.js';

describe('isMappedArrayExpr function test', () => {
  test('should correctly identify MappedArrayExpr', () => {
    // Test cases that should return true
    const mappedArrayExpr = {
      items: ['Item 1', 'Item 2'],
      map: (item) => ({ tagName: 'span', textContent: item })
    };
    
    expect(isMappedArrayExpr(mappedArrayExpr)).toBe(true);
    
    // Test cases that should return false
    const htmlElementSpec = { tagName: 'p', textContent: 'Static paragraph' };
    expect(isMappedArrayExpr(htmlElementSpec)).toBe(false);
    
    const mixedArray = [
      { tagName: 'p', textContent: 'Static paragraph' },
      { items: ['Item 1', 'Item 2'], map: (item) => ({ tagName: 'span', textContent: item }) }
    ];
    expect(isMappedArrayExpr(mixedArray)).toBe(false);
    
    // Test individual elements from mixed array
    expect(isMappedArrayExpr(mixedArray[0])).toBe(false);
    expect(isMappedArrayExpr(mixedArray[1])).toBe(true);
  });
});