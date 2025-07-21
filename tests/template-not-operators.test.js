import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Template NOT Operators', () => {
  beforeEach(() => {
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      Object.keys(window).forEach(key => {
        if (key.startsWith('$') || key.startsWith('negative') || key.startsWith('boolean') || key.startsWith('complex')) {
          delete window[key];
        }
      });
    }
  });

  test('should support single NOT operator (!) in templates', () => {
    const spec = {
      $isActive: true,
      $isEmpty: false,
      $nullValue: null,
      $undefinedValue: undefined,
      $zeroValue: 0,
      $emptyString: '',
      
      // Test single NOT operator with various values
      negativeActive: '${!this.$isActive}',         // should be 'false'
      negativeEmpty: '${!this.$isEmpty}',           // should be 'true' 
      negativeNull: '${!this.$nullValue}',          // should be 'true'
      negativeUndefined: '${!this.$undefinedValue}', // should be 'true'
      negativeZero: '${!this.$zeroValue}',          // should be 'true'
      negativeEmptyString: '${!this.$emptyString}', // should be 'true'
    };

    DDOM(spec);
    
    expect(window.negativeActive).toBe('false');
    expect(window.negativeEmpty).toBe('true');
    expect(window.negativeNull).toBe('true');
    expect(window.negativeUndefined).toBe('true');
    expect(window.negativeZero).toBe('true');
    expect(window.negativeEmptyString).toBe('true');
  });

  test('should support double NOT operator (!!) in templates', () => {
    const spec = {
      $isActive: true,
      $isEmpty: false,
      $nullValue: null,
      $undefinedValue: undefined,
      $zeroValue: 0,
      $emptyString: '',
      $nonEmptyString: 'hello',
      $positiveNumber: 42,
      
      // Test double NOT operator with various values
      booleanActive: '${!!this.$isActive}',         // should be 'true'
      booleanEmpty: '${!!this.$isEmpty}',           // should be 'false' 
      booleanNull: '${!!this.$nullValue}',          // should be 'false'
      booleanUndefined: '${!!this.$undefinedValue}', // should be 'false'
      booleanZero: '${!!this.$zeroValue}',          // should be 'false'
      booleanEmptyString: '${!!this.$emptyString}', // should be 'false'
      booleanNonEmptyString: '${!!this.$nonEmptyString}', // should be 'true'
      booleanPositiveNumber: '${!!this.$positiveNumber}', // should be 'true'
    };

    DDOM(spec);
    
    expect(window.booleanActive).toBe('true');
    expect(window.booleanEmpty).toBe('false');
    expect(window.booleanNull).toBe('false');
    expect(window.booleanUndefined).toBe('false');
    expect(window.booleanZero).toBe('false');
    expect(window.booleanEmptyString).toBe('false');
    expect(window.booleanNonEmptyString).toBe('true');
    expect(window.booleanPositiveNumber).toBe('true');
  });

  test('should work with complex expressions including NOT operators', () => {
    const spec = {
      $isActive: true,
      $count: 5,
      
      // Complex expressions with NOT operators
      complexExpression1: '${!this.$isActive ? "inactive" : "active"}',
      complexExpression2: '${!!this.$count ? "has items" : "empty"}',
      complexExpression3: '${!this.$count ? "zero" : "non-zero"}',
    };

    DDOM(spec);
    
    expect(window.complexExpression1).toBe('active');
    expect(window.complexExpression2).toBe('has items');
    expect(window.complexExpression3).toBe('non-zero');
  });

  test('should work with NOT operators in DOM elements', () => {
    const spec = {
      document: {
        body: {
          children: [{
            tagName: 'div',
            $isVisible: true,
            textContent: '${!!this.$isVisible}',
            className: '${!this.$isVisible ? "hidden" : "visible"}',
          }]
        }
      }
    };

    expect(() => DDOM(spec)).not.toThrow();
    DDOM(spec);
    const divElement = document.body.children[0];
    
    expect(divElement.textContent).toBe('true');
    expect(divElement.className).toBe('visible');
  });
});