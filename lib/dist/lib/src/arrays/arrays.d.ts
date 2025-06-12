import { MappedArrayExpr } from '../../../types/src';
import { Signal } from '../events';
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
export declare function isMappedArrayExpr<T>(value: any): value is MappedArrayExpr<T, any>;
/**
 * Reactive array implementation that integrates with the Signal system.
 * Processes arrays through a complete pipeline of filtering, sorting, mapping, and composition.
 * Automatically re-renders when source data changes through Signal reactivity.
 *
 * @template T - The type of items in the source array
 * @template U - The type of items after mapping transformation
 * @example
 * ```typescript
 * const reactiveArray = new MappedArray({
 *   items: userSignal,
 *   filter: [{ leftOperand: 'active', operator: '===', rightOperand: true }],
 *   sort: [{ sortBy: 'name', direction: 'asc' }],
 *   map: (user) => ({ tagName: 'div', textContent: user.name })
 * });
 * ```
 */
export declare class MappedArray<T, U = any> {
    private expr;
    private parentElement?;
    private sourceSignal;
    private computed;
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
    constructor(expr: MappedArrayExpr<T, U>, parentElement?: Element | undefined);
    /**
     * Get the current processed array value.
     * Executes the complete processing pipeline and returns the final array.
     *
     * @returns The processed array with all transformations applied
     */
    get(): U[];
    /**
     * Get the underlying signal for direct access.
     * Useful for integrating with other reactive systems or debugging.
     *
     * @returns The computed signal that processes the array
     */
    getSignal(): Signal.Computed<U[]>; /**
     * Update the source array (only works if source is a Signal.State).
     * Triggers reactive updates throughout the system when called.
     *
     * @param newArray - The new array to set as the source
     * @throws Error if the source is not a Signal.State
     */
    set(newArray: T[]): void;
}
