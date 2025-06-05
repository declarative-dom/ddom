import { ArrayExpr } from '../../../types/src';
import { Signal } from '../events';
/**
 * A reactive DeclarativeArray class that uses Signal.Computed for real-time updates
 *
 * This class creates a reactive array that automatically recomputes when any of its
 * dependencies change. It uses Signal.Computed for filtering, sorting, and mapping
 * operations, enabling true reactivity without manual re-evaluation.
 */
export declare class DeclarativeArray<T = any, R = any> {
    private expression;
    private contextNode?;
    private _items;
    private _filtered;
    private _sorted;
    private _mapped;
    private _final;
    constructor(expression: ArrayExpr<T, R>, contextNode?: Node | undefined);
    /**
     * Get the current processed array result
     */
    get(): R[];
    /**
     * Get the computed signal for the final result
     * This allows external systems to reactively depend on this array
     */
    getSignal(): Signal.Computed<R[]>;
    /**
     * Update the expressionuration of this ArrayExpr
     */
    updateexpression(newexpression: Partial<ArrayExpr<T, R>>): void;
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
export declare function isArrayExpr(value: any): value is ArrayExpr;
