import {
  ArrayExpr,
  FilterExpr,
  SortExpr,
  FilterOper
} from '../../../types/src';

import {
  Signal,
  SignalNode,
  createEffect
} from '../events';

import {
  transform
} from '../xpath';

/**
 * Evaluates a filter expression against an item in an array.
 * Handles both static values and dynamic functions for operands, supporting
 * all operators defined in the FilterExpr specification.
 * 
 * @template T - The type of items being filtered
 * @param item - The current item being evaluated
 * @param index - The index of the current item in the array
 * @param filter - The filter expression to evaluate
 * @returns True if the item passes the filter condition, false otherwise
 * @example
 * ```typescript
 * const passes = evaluateFilter(
 *   { name: 'John', age: 30 },
 *   0,
 *   { leftOperand: 'age', operator: '>=', rightOperand: 18 }
 * ); // returns true
 * ```
 */
function evaluateFilter<T>(item: T, index: number, filter: FilterExpr<T>): boolean {
  // Get left operand value
  let leftValue: any;
  if (typeof filter.leftOperand === 'string') {
    leftValue = (item as any)[filter.leftOperand];
  } else if (typeof filter.leftOperand === 'function') {
    leftValue = filter.leftOperand(item, index);
  } else {
    leftValue = filter.leftOperand;
  }

  // Get right operand value
  let rightValue: any;
  if (typeof filter.rightOperand === 'function') {
    rightValue = filter.rightOperand(item, index);
  } else {
    rightValue = filter.rightOperand;
  }
  // Apply operator
  switch (filter.operator) {
    case '>': return leftValue > rightValue;
    case '<': return leftValue < rightValue;
    case '>=': return leftValue >= rightValue;
    case '<=': return leftValue <= rightValue;
    case '==': return leftValue == rightValue;
    case '!=': return leftValue != rightValue;
    case '===': return leftValue === rightValue;
    case '!==': return leftValue !== rightValue;
    case '&&': return leftValue && rightValue;
    case '||': return leftValue || rightValue;
    case '!': return !leftValue;
    case '?': return leftValue ? rightValue : false;
    case 'includes': return typeof leftValue?.includes === 'function' ? leftValue.includes(rightValue) : false;
    case 'startsWith': return typeof leftValue?.startsWith === 'function' ? leftValue.startsWith(rightValue) : false;
    case 'endsWith': return typeof leftValue?.endsWith === 'function' ? leftValue.endsWith(rightValue) : false;
    default: return false;
  }
}

/**
 * Applies sorting to an array based on sort expressions.
 * Processes multiple sort criteria in order, applying secondary sorts when primary values are equal.
 * Supports both property name strings and custom sort functions with configurable direction.
 * 
 * @template T - The type of items in the array
 * @param array - The array to sort (will be modified in place)
 * @param sortExpressions - Array of sort expressions to apply in order
 * @returns The sorted array (same reference as input)
 * @example
 * ```typescript
 * const sorted = applySorting(users, [
 *   { sortBy: 'lastName', direction: 'asc' },
 *   { sortBy: 'firstName', direction: 'asc' }
 * ]);
 * ```
 */
function applySorting<T>(array: T[], sortExpressions: SortExpr<T>[]): T[] {
  return array.sort((a, b) => {
    for (const sortExpr of sortExpressions) {
      let aValue: any;
      let bValue: any;

      // Get sort values
      if (typeof sortExpr.sortBy === 'string') {
        aValue = (a as any)[sortExpr.sortBy];
        bValue = (b as any)[sortExpr.sortBy];
      } else if (typeof sortExpr.sortBy === 'function') {
        aValue = sortExpr.sortBy(a, 0); // Index not meaningful in sort context
        bValue = sortExpr.sortBy(b, 0);
      } else {
        continue;
      }

      // Compare values
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      else if (aValue > bValue) comparison = 1;

      // Apply direction
      if (sortExpr.direction === 'desc') {
        comparison = -comparison;
      }

      // If not equal, return the comparison result
      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0;
  });
}

/**
 * Type guard to check if a value is an ArrayExpr.
 * Validates that the object has the required 'items' property to be considered an ArrayExpr.
 * 
 * @template T - The type of items in the array
 * @param value - The value to check
 * @returns True if the value is an ArrayExpr, false otherwise
 * @example
 * ```typescript
 * if (isArrayExpr(someValue)) {
 *   // TypeScript now knows someValue is ArrayExpr<T, any>
 *   console.log(someValue.items);
 * }
 * ```
 */
export function isArrayExpr<T>(value: any): value is ArrayExpr<T, any> {
  return value && typeof value === 'object' && 'items' in value;
}

/**
 * Reactive array implementation that integrates with the Signal system.
 * Processes arrays through a complete pipeline of filtering, sorting, mapping, and composition.
 * Automatically re-renders when source data changes through Signal reactivity.
 * 
 * @template T - The type of items in the source array
 * @template U - The type of items after mapping transformation
 * @example
 * ```typescript
 * const reactiveArray = new DeclarativeArray({
 *   items: userSignal,
 *   filter: [{ leftOperand: 'active', operator: '===', rightOperand: true }],
 *   sort: [{ sortBy: 'name', direction: 'asc' }],
 *   map: (user) => ({ tagName: 'div', textContent: user.name })
 * });
 * ```
 */
export class DeclarativeArray<T, U = any> {
  private sourceSignal: SignalNode<T[]>;
  private computed: Signal.Computed<U[]>;
  /**
   * Creates a new DeclarativeArray instance with the specified configuration.
   * Sets up the reactive pipeline for processing array data through filtering,
   * sorting, mapping, and composition operations.
   * 
   * @param config - The ArrayExpr configuration defining the processing pipeline
   * @param parentElement - Optional parent element for context-aware operations
   */
  constructor(
    private config: ArrayExpr<T, U>,
    private parentElement?: Element
  ) {    // Handle different source types
    if (Signal.isState(config.items) || Signal.isComputed(config.items)) {
      this.sourceSignal = config.items;
    } else if (Array.isArray(config.items)) {
      this.sourceSignal = new Signal.State(config.items);    } else if (typeof config.items === 'function') {
      // Handle function that returns array or Signal
      try {
        const functionResult = config.items(parentElement);
        
        // Check if the function returned a Signal
        if (Signal.isState(functionResult) || Signal.isComputed(functionResult)) {
          this.sourceSignal = functionResult;
        } else if (Array.isArray(functionResult)) {
          // Function returned a plain array
          this.sourceSignal = new Signal.State(functionResult);
        } else {
          console.error('DeclarativeArray: Function returned unexpected value:', functionResult);
          throw new Error('Function must return an array or Signal');
        }
      } catch (error) {
        console.error('DeclarativeArray: Error calling items function:', error);
        throw error;
      }
    } else {
      throw new Error('ArrayExpr items must be an array, Signal, or function');
    }    // Create computed that processes the array through the full pipeline
    this.computed = new Signal.Computed(() => {
      try {
        const sourceArray = this.sourceSignal.get();
        
        if (!Array.isArray(sourceArray)) {
          console.error('DeclarativeArray: sourceSignal.get() did not return an array:', sourceArray);
          throw new Error('Source signal must contain an array');
        }
        
        let processedArray = [...sourceArray];

        // Apply filtering
        if (config.filter && config.filter.length > 0) {
          processedArray = processedArray.filter((item, index) => {
            return config.filter!.every(filter => evaluateFilter(item, index, filter));
          });
        }

        // Apply sorting
        if (config.sort && config.sort.length > 0) {
          processedArray = applySorting(processedArray, config.sort);
        }        // Apply mapping
        let mappedArray: U[];
        if (config.map) {
          if (typeof config.map === 'function') {
            mappedArray = processedArray.map(config.map as (item: T, index: number) => U);
          } else if (typeof config.map === 'string') {
            // String template mapping
            mappedArray = processedArray.map((item: any, index) => {
              if (typeof item === 'object' && item !== null) {
                return transform(config.map as string, item);
              }
              return item;
            }) as U[];
          } else {
            // Static object mapping with template support
            mappedArray = processedArray.map((item: any, index) => {
              if (typeof config.map === 'object' && config.map !== null) {
                return transformObjectTemplate(config.map, item, index);
              }
              return config.map;
            }) as U[];
          }
        } else {
          mappedArray = processedArray as any;
        }

        // Apply prepend/append
        const finalArray: U[] = [
          ...(config.prepend || []),
          ...mappedArray,
          ...(config.append || [])
        ];

        return finalArray;
      } catch (error) {
        console.error('DeclarativeArray processing error:', error);
        return [] as U[];
      }
    });
  }
  /**
   * Get the current processed array value.
   * Executes the complete processing pipeline and returns the final array.
   * 
   * @returns The processed array with all transformations applied
   */
  get(): U[] {
    return this.computed.get();
  }

  /**
   * Get the underlying signal for direct access.
   * Useful for integrating with other reactive systems or debugging.
   * 
   * @returns The computed signal that processes the array
   */
  getSignal(): Signal.Computed<U[]> {
    return this.computed;
  }  /**
   * Update the source array (only works if source is a Signal.State).
   * Triggers reactive updates throughout the system when called.
   * 
   * @param newArray - The new array to set as the source
   * @throws Error if the source is not a Signal.State
   */
  set(newArray: T[]): void {
    if (Signal.isState(this.sourceSignal)) {
      (this.sourceSignal as Signal.State<T[]>).set(newArray);
    } else {
      throw new Error('Cannot set array value on non-state source');
    }
  }
}

/**
 * Transforms an object template by replacing template strings within its properties.
 * Recursively processes objects, arrays, and strings to replace template expressions
 * with values from the provided context. Supports function evaluation with item and index.
 * 
 * @param template - The template to transform (object, array, string, or function)
 * @param context - The context object containing values for template substitution
 * @param index - The current index in the array (for function evaluation)
 * @returns The transformed template with all substitutions applied
 * @example
 * ```typescript
 * const result = transformObjectTemplate(
 *   { tagName: 'div', textContent: '{name}', className: (item) => item.active ? 'active' : '' },
 *   { name: 'John', active: true },
 *   0
 * );
 * // Returns: { tagName: 'div', textContent: 'John', className: 'active' }
 * ```
 */
function transformObjectTemplate(template: any, context: any, index: number = 0): any {
  if (typeof template === 'function') {
    // Function values are evaluated immediately with item and index
    return template(context, index);
  } else if (typeof template === 'string') {
    return transform(template, context);
  } else if (Array.isArray(template)) {
    return template.map((item, itemIndex) => transformObjectTemplate(item, context, itemIndex));
  } else if (template && typeof template === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = transformObjectTemplate(value, context, index);
    }
    return result;
  }
  return template;
}