/**
 * A reactive signal that notifies subscribers when its value changes.
 * Signals provide a simple way to implement reactive programming patterns.
 *
 * @template T The type of value stored in the signal
 * @example
 * ```typescript
 * const count = new Signal(0);
 * const unsubscribe = count.subscribe(value => console.log('Count:', value));
 * count.value = 5; // Logs: "Count: 5"
 * unsubscribe();
 * ```
 */
export declare class Signal<T> {
    #private;
    /**
     * Creates a new Signal with the given initial value.
     *
     * @param initialValue The initial value for the signal
     */
    constructor(initialValue: T);
    /**
     * Gets the current value of the signal.
     *
     * @returns The current value
     */
    get value(): T;
    /**
     * Sets a new value for the signal. If the new value is different from the current value
     * (using Object.is comparison), all subscribers will be notified.
     *
     * @param newValue The new value to set
     */
    set value(newValue: T);
    /**
     * Subscribes to value changes on this signal.
     *
     * @param fn The function to call when the signal value changes
     * @returns A function that when called, unsubscribes the callback
     */
    subscribe(fn: (value: T) => void): () => boolean;
}
