import {
  ArrayExpr,
  FilterExpr,
  SortExpr
} from '../../../types/src';

import {
  transform
} from '../xpath';

import {
  Signal,
  SignalNode
} from '../events';

/**
 * A reactive DeclarativeArray class that uses Signal.Computed for real-time updates
 * 
 * This class creates a reactive array that automatically recomputes when any of its
 * dependencies change. It uses Signal.Computed for filtering, sorting, and mapping
 * operations, enabling true reactivity without manual re-evaluation.
 */
export class DeclarativeArray<T = any, R = any> {
  private _items: Signal.Computed<T[]>;
  private _filtered: Signal.Computed<T[]>;
  private _sorted: Signal.Computed<T[]>;
  private _mapped: Signal.Computed<R[]>;
  private _final: Signal.Computed<R[]>;

  constructor(private config: ArrayExpr<T, R>, private contextNode?: Node) {
    // Create reactive items computation
    this._items = new Signal.Computed(() => {
      const { items } = this.config;
      let resolvedItems;

      if (typeof items === 'function') {
        resolvedItems = items(this.contextNode);

        // If the function returns a signal, get its value
        if (typeof resolvedItems === 'object' && (Signal.isState(resolvedItems) || Signal.isComputed(resolvedItems))) {
          resolvedItems = (resolvedItems as SignalNode).get();
        }
      } else {
        resolvedItems = items;
      }

      if (!Array.isArray(resolvedItems)) {
        throw new Error('items must be an array or a function that returns an array');
      }

      return [...resolvedItems];
    });

    // Create reactive filtered computation
    this._filtered = new Signal.Computed(() => {
      const items = this._items.get();
      const { filter } = this.config;

      if (!filter || !Array.isArray(filter)) {
        return items;
      }

      return items.filter((item, index) => {
        return filter.every(filterCondition => {
          const { leftOperand, operator, rightOperand } = filterCondition;
          const leftValue = typeof leftOperand === 'string' ? (item as any)[leftOperand] : leftOperand;
          const rightValue = typeof rightOperand === 'string' ? (item as any)[rightOperand] : rightOperand;

          switch (operator) {
            case '>': return leftValue > rightValue;
            case '<': return leftValue < rightValue;
            case '>=': return leftValue >= rightValue;
            case '<=': return leftValue <= rightValue;
            case '==': return leftValue == rightValue;
            case '===': return leftValue === rightValue;
            case '!=': return leftValue != rightValue;
            case '!==': return leftValue !== rightValue;
            case 'includes': return Array.isArray(leftValue) ? leftValue.includes(rightValue) : String(leftValue).includes(String(rightValue));
            case 'startsWith': return String(leftValue).startsWith(String(rightValue));
            case 'endsWith': return String(leftValue).endsWith(String(rightValue));
            default: return true;
          }
        });
      });
    });

    // Create reactive sorted computation
    this._sorted = new Signal.Computed(() => {
      const filtered = this._filtered.get();
      const { sort } = this.config;

      if (!sort || !Array.isArray(sort)) {
        return filtered;
      }

      return [...filtered].sort((a, b) => {
        for (const sortCondition of sort) {
          const { sortBy, direction = 'asc' } = sortCondition;
          
          let aValue, bValue;
          if (typeof sortBy === 'function') {
            aValue = sortBy(a, filtered.indexOf(a));
            bValue = sortBy(b, filtered.indexOf(b));
          } else {
            aValue = (a as any)[sortBy];
            bValue = (b as any)[sortBy];
          }

          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          else if (aValue > bValue) comparison = 1;

          if (comparison !== 0) {
            return direction === 'desc' ? -comparison : comparison;
          }
        }
        return 0;
      });
    });

    // Create reactive mapped computation
    this._mapped = new Signal.Computed(() => {
      const sorted = this._sorted.get();
      const { map } = this.config;

      return sorted.map((item, index) => {
        if (typeof map === 'function') {
          return (map as (item: T, index: number) => R)(item, index);
        } else if (typeof map === 'object' && map !== null) {
          // Object template - copy all properties from the template, handling reactive properties specially
          const mappedObj: any = {};

          // First, copy all non-reactive properties from the template
          for (const [key, value] of Object.entries(map)) {
            if (typeof value === 'function') {
              // Execute function with item and index
              mappedObj[key] = (value as Function)(item, index);
            } else {
              mappedObj[key] = value;
            }
          }
          return mappedObj;
        } else {
          return map as R;
        }
      });
    });

    // Create final computation with prepend/append
    this._final = new Signal.Computed(() => {
      const mapped = this._mapped.get();
      const { prepend, append } = this.config;

      let final = mapped;
      if (prepend && Array.isArray(prepend)) {
        final = [...prepend, ...final];
      }
      if (append && Array.isArray(append)) {
        final = [...final, ...append];
      }

      return final;
    });
  }

  /**
   * Get the current processed array result
   */
  get(): R[] {
    return this._final.get();
  }

  /**
   * Get the computed signal for the final result
   * This allows external systems to reactively depend on this array
   */
  getSignal(): Signal.Computed<R[]> {
    return this._final;
  }

  /**
   * Update the configuration of this ArrayExpr
   */
  updateConfig(newConfig: Partial<ArrayExpr<T, R>>): void {
    Object.assign(this.config, newConfig);
    // Note: The computations will automatically recompute when accessed next
  }
}

/**
 * Process a ArrayExpr object and render elements directly to a parent container
 * 
 * This function takes a ArrayExpr specification and processes it through
 * a series of transformations: filtering, sorting, mapping, and appending/prepending items.
 * Instead of returning synthesized DDOM objects, it directly creates and manages DOM elements
 * with their reactive properties properly assigned.
 * 
 * @template T - The type of items in the source array
 * @param ArrayExpr - The ArrayExpr specification containing items and transformation rules
 * @param parentElement - The parent DOM element to render the array items into
 * @param contextNode - Optional DOM element context for function evaluation
 * 
 * @throws {Error} When the items property is not an array
 * 
 * @example
 * ```typescript
 * fromArray({
 *   items: [{ name: 'John', age: 30 }, { name: 'Jane', age: 25 }],
 *   filter: [{ leftOperand: 'age', operator: '>', rightOperand: 27 }],
 *   sort: [{ sortBy: 'name', direction: 'asc' }],
 *   map: { tagName: 'todo-item', $item: (item) => item, $index: (item, index) => index }
 * }, containerElement);
 * ```
 */
export function isArrayExpr(value: any): value is ArrayExpr {
  return value && typeof value === 'object' &&
    value.items !== undefined &&
    value.map !== undefined;
}