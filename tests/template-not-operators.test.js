import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Template NOT Operators', () => {
  beforeEach(() => {
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      delete window.$testValue;
      delete window.$isActive;
      delete window.$isEmpty;
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

    const app = DDOM(spec);
    
    expect(app.negativeActive).toBe('false');
    expect(app.negativeEmpty).toBe('true');
    expect(app.negativeNull).toBe('true');
    expect(app.negativeUndefined).toBe('true');
    expect(app.negativeZero).toBe('true');
    expect(app.negativeEmptyString).toBe('true');
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

    const app = DDOM(spec);
    
    expect(app.booleanActive).toBe('true');
    expect(app.booleanEmpty).toBe('false');
    expect(app.booleanNull).toBe('false');
    expect(app.booleanUndefined).toBe('false');
    expect(app.booleanZero).toBe('false');
    expect(app.booleanEmptyString).toBe('false');
    expect(app.booleanNonEmptyString).toBe('true');
    expect(app.booleanPositiveNumber).toBe('true');
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

    const app = DDOM(spec);
    
    expect(app.complexExpression1).toBe('active');
    expect(app.complexExpression2).toBe('has items');
    expect(app.complexExpression3).toBe('non-zero');
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
    const app = DDOM(spec);
    const divElement = app.document.body.children[0];
    
    expect(divElement.textContent).toBe('true');
    expect(divElement.className).toBe('visible');
  });
});