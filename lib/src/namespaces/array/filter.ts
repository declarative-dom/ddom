/**
 * Array Filtering Logic
 * 
 * Applies FilterCriteria configurations to arrays with support for:
 * - String expressions that get evaluated as JavaScript
 * - Direct property access
 * - Reactive function calls in expressions
 */

import { FilterCriteria } from '../../types';
import { resolveOperand, isValidOperator } from '../../utils';

/**
 * Valid comparison operators for filtering
 */
const OPERATORS = {
  '===': (a: any, b: any) => a === b,
  '!==': (a: any, b: any) => a !== b,
  '==': (a: any, b: any) => a == b,
  '!=': (a: any, b: any) => a != b,
  '<': (a: any, b: any) => a < b,
  '<=': (a: any, b: any) => a <= b,
  '>': (a: any, b: any) => a > b,
  '>=': (a: any, b: any) => a >= b,
  'includes': (a: any, b: any) => {
    if (typeof a === 'string' && typeof b === 'string') {
      return a.includes(b);
    }
    if (Array.isArray(a)) {
      return a.includes(b);
    }
    return false;
  },
  'startsWith': (a: any, b: any) => typeof a === 'string' && typeof b === 'string' && a.startsWith(b),
  'endsWith': (a: any, b: any) => typeof a === 'string' && typeof b === 'string' && a.endsWith(b),
  'in': (a: any, b: any) => {
    if (Array.isArray(b)) return b.includes(a);
    if (typeof b === 'object' && b !== null) return a in b;
    return false;
  },
  'regex': (a: any, b: any) => {
    if (typeof a !== 'string') return false;
    const regex = b instanceof RegExp ? b : new RegExp(b);
    return regex.test(a);
  }
} as const;

export type Operator = keyof typeof OPERATORS;

/**
 * Applies an array of filter expressions to items
 */
export function applyFilters(items: any[], filters: FilterCriteria[], context: any): any[] {
  return items.filter(item => {
    // All filters must pass (AND logic)
    return filters.every(filter => evaluateFilter(item, filter, context));
  });
}

/**
 * Evaluates a single filter expression against an item
 */
function evaluateFilter(item: any, filter: FilterCriteria, context: any): boolean {
  try {
    const leftValue = resolveOperand(filter.leftOperand, item, context);
    const rightValue = resolveOperand(filter.rightOperand, item, context);
    
    const operator = OPERATORS[filter.operator as Operator];
    if (!operator) {
      console.warn(`Unknown filter operator: ${filter.operator}`);
      return true; // Don't filter out on unknown operators
    }
    
    return operator(leftValue, rightValue);
  } catch (error) {
    console.warn(`Filter evaluation failed:`, error, filter);
    return true; // Don't filter out on errors
  }
}
