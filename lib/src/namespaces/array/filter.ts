/**
 * Array Filtering Logic
 * 
 * Applies FilterCriteria configurations to arrays with support for:
 * - String expressions that get evaluated as JavaScript
 * - Direct property access
 * - Reactive function calls in expressions
 */

import { FilterCriteria } from '../../types';
import { resolveOperand, evaluateComparison, type Operator } from '../../utils/evaluation';

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
    // Construct expression from filter criteria
    const leftValue = resolveOperand(filter.leftOperand, item, context);
    const rightValue = resolveOperand(filter.rightOperand, item, context);
    
    // Create a comparison expression string for the shared evaluator
    const expr = `${leftValue} ${filter.operator} ${rightValue}`;
    const result = evaluateComparison(expr, { leftValue, rightValue });
    
    if (result !== null) {
      return result;
    }
    
    console.warn(`Unknown filter operator: ${filter.operator}`);
    return true; // Don't filter out on unknown operators
  } catch (error) {
    console.warn(`Filter evaluation failed:`, error, filter);
    return true; // Don't filter out on errors
  }
}
