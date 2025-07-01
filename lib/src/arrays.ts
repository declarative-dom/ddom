import {
  MappedArrayExpr,
  FilterExpr,
  SortExpr,
} from '../../types/src';

import {
  Signal,
  SignalNode,
  ComponentSignalWatcher
} from './signals';

import {
  isPropertyAccessor,
  parseTemplateLiteral,
  resolvePropertyAccessor
} from './properties';


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
 * Type guard to check if a value is an MappedArrayExpr.
 * Validates that the object has the required 'items' property to be considered an MappedArrayExpr.
 * 
 * @template T - The type of items in the array
 * @param value - The value to check
 * @returns True if the value is an MappedArrayExpr, false otherwise
 * @example
 * ```typescript
 * if (isMappedArrayExpr(someValue)) {
 *   // TypeScript now knows someValue is MappedArrayExpr<T, any>
 *   console.log(someValue.items);
 * }
 * ```
 */
export function isMappedArrayExpr<T>(value: any): value is MappedArrayExpr<T, any> {
  return value && typeof value === 'object' && 'items' in value;
}

/**
 * Reactive array implementation that integrates with the Signal system.
 * Processes arrays through a complete pipeline of filtering, sorting, mapping, and composition.
 * Automatically re-renders when source data changes through Signal reactivity.
 * Each MappedArray instance has its own isolated signal watcher for better resource management.
 * 
 * @template T - The type of items in the source array
 * @template U - The type of items after mapping transformation
 * @example
 * ```typescript
 * const reactiveArray = new MappedArray({
 *   items: 'this.$userSignal',
 *   filter: [{ leftOperand: 'active', operator: '===', rightOperand: true }],
 *   sort: [{ sortBy: 'name', direction: 'asc' }],
 *   map: { tagName: 'div', textContent: (item) => item.name }
 * });
 * ```
 */
export class MappedArray<T, U = any> {
  private sourceSignal: SignalNode<T[]>;
  private computed: Signal.Computed<U[]>;
  private signalWatcher: ComponentSignalWatcher;
  private mutableProps: string[] | null = null;

  /**
   * Creates a new MappedArray instance with the specified configuration.
   * Sets up the reactive pipeline for processing array data through filtering,
   * sorting, mapping, and composition operations.
   * 
   * Supports property accessors like "window.todos" or "this.parentNode.items" for value resolution.
   * 
   * @param expr - The MappedArrayExpr configuration defining the processing pipeline
   * @param parentElement - Optional parent element for context-aware operations
   */
  constructor(
    private expr: MappedArrayExpr<T, U>,
    private parentElement?: Element
  ) {
    // Initialize isolated signal watcher for this MappedArray
    this.signalWatcher = new ComponentSignalWatcher();
    
    // Analyze mutable properties once during construction
    if (expr.map && typeof expr.map === 'object' && expr.map !== null) {
      this.mutableProps = analyzeMutableProperties(expr.map);
    }

    // Handle different source types
    if (Signal.isState(expr.items) || Signal.isComputed(expr.items)) {
      this.sourceSignal = expr.items;
    } else if (Array.isArray(expr.items)) {
      this.sourceSignal = new Signal.State(expr.items);
    } else if (typeof expr.items === 'string') {
      // Handle property accessor resolution
      const resolved = resolvePropertyAccessor(expr.items, parentElement || document.body);
      if (resolved !== null) {
        // Check if it's a signal
        if (Signal.isState(resolved) || Signal.isComputed(resolved)) {
          this.sourceSignal = resolved;
        } else if (Array.isArray(resolved)) {
          // Static array - wrap in a signal
          this.sourceSignal = new Signal.State(resolved);
        } else {
          console.error('MappedArray: Property accessor resolved to non-array value:', resolved);
          throw new Error(`Property accessor "${expr.items}" must resolve to an array or Signal containing an array`);
        }
      } else {
        console.error('MappedArray: Failed to resolve property accessor:', expr.items);
        throw new Error(`Cannot resolve property accessor: ${expr.items}`);
      }
    } else if (typeof expr.items === 'function') {
      // Handle function that returns array or Signal
      try {
        const functionResult = expr.items(parentElement);

        // Check if the function returned a Signal
        if (Signal.isState(functionResult) || Signal.isComputed(functionResult)) {
          this.sourceSignal = functionResult;
        } else if (Array.isArray(functionResult)) {
          // Function returned a plain array
          this.sourceSignal = new Signal.State(functionResult);
        } else {
          console.error('MappedArray: Function returned unexpected value:', functionResult);
          throw new Error('Function must return an array or Signal');
        }
      } catch (error) {
        console.error('MappedArray: Error calling items function:', error);
        throw error;
      }
    } else {
      throw new Error('MappedArrayExpr items must be an array, Signal, property accessor string, or function');
    }    // Create computed that processes the array through the full pipeline
    this.computed = new Signal.Computed(() => {
      try {
        const sourceArray = this.sourceSignal.get();

        if (!Array.isArray(sourceArray)) {
          console.error('MappedArray: sourceSignal.get() did not return an array:', sourceArray);
          throw new Error('Source signal must contain an array');
        }

        let processedArray = [...sourceArray];

        // Apply filtering
        if (expr.filter && expr.filter.length > 0) {
          processedArray = processedArray.filter((item, index) => {
            return expr.filter!.every(filter => evaluateFilter(item, index, filter));
          });
        }

        // Apply sorting
        if (expr.sort && expr.sort.length > 0) {
          processedArray = applySorting(processedArray, expr.sort);
        }
        
        // Apply mapping
        let mappedArray: U[];
        if (expr.map) {
          mappedArray = applyMap(expr.map, processedArray, (parentElement || document.body) as Node) as U[];
        } else {
          mappedArray = processedArray as any;
        }

        // Apply prepend/append
        const finalArray: U[] = [
          ...(expr.prepend || []),
          ...mappedArray,
          ...(expr.append || [])
        ];

        return finalArray;
      } catch (error) {
        console.error('MappedArray processing error:', error);
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
   * Get the list of mutable properties from the map template.
   * These are properties that can change and need to be updated when items change.
   * 
   * @returns Array of property names that are mutable (function values)
   */
  getMutableProps(): string[] {
    return this.mutableProps || [];
  }

  /**
   * Get the underlying signal for direct access.
   * Useful for integrating with other reactive systems or debugging.
   * 
   * @returns The computed signal that processes the array
   */
  getSignal(): Signal.Computed<U[]> {
    return this.computed;
  }

  /**
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

  /**
   * Dispose of this MappedArray and all its resources.
   * Implements explicit resource management for automatic cleanup.
   */
  dispose(): void {
    this.signalWatcher.dispose();
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
 * @param el - The element context for resolving property accessors
 * @returns Object with transformed template value
 */
function transformObjectTemplate(template: any, context: any, index: number = 0, el: Node): { value: any } {
  function transform(template: any): any {
    if (typeof template === 'function') {
      // Function values are evaluated immediately with item and index
      return template(context, index);
    } else if (typeof template === 'string') {
      if (isPropertyAccessor(template)) {
        // Resolve property accessors
        return resolvePropertyAccessor(template, el);
      }
      return template;
    } else if (Array.isArray(template)) {
      return template.map((item) => transform(item));
    } else if (template && typeof template === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = transform(value);
      }
      return result;
    }
    return template;
  }

  return { value: transform(template) };
}

/**
 * Applies mapping transformation to an array using either object or string templates.
 * Handles function evaluation within templates and supports all mapping types.
 * 
 * @param mapTemplate - Either an object template, string template, or direct value to apply
 * @param processedArray - The array of items to map
 * @param el - The element context for resolving property accessors
 * @returns The mapped array with all transformations applied
 */
function applyMap(mapTemplate: any, processedArray: any[], el: Node): any[] {
  if (typeof mapTemplate === 'string') {
    // String template mapping
    return processedArray.map((item: any, _index) => {
      if (typeof item === 'object' && item !== null) {
        return parseTemplateLiteral(mapTemplate, item);
      }
      return item;
    });
  } else if (typeof mapTemplate === 'object' && mapTemplate !== null) {
    // Object template mapping
    return processedArray.map((item: any, index) => {
      const result = transformObjectTemplate(mapTemplate, item, index, el);
      return result.value;
    });
  } else {
    // Direct value mapping (no transformation)
    return processedArray.map(() => mapTemplate);
  }
}

/**
 * Analyzes a map template to collect all mutable properties (function values).
 * This is done once during construction to optimize runtime performance.
 * 
 * @param mapTemplate - The template to analyze
 * @returns Array of property names that have function values
 */
function analyzeMutableProperties(mapTemplate: any): string[] {
  const mutableProps: string[] = [];

  function analyze(template: any, prop: string = ''): void {
    if (typeof template === 'function') {
      if (prop) {
        mutableProps.push(prop);
      }
    } else if (Array.isArray(template)) {
      template.forEach((item) => analyze(item, prop));
    } else if (template && typeof template === 'object') {
      for (const [key, value] of Object.entries(template)) {
        analyze(value, key);
      }
    }
  }

  analyze(mapTemplate);
  return mutableProps;
}