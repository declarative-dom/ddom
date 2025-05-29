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
export class Signal<T> {
	#value: T;
	#subscribers = new Set<(value: T) => void>();

	/**
	 * Creates a new Signal with the given initial value.
	 * 
	 * @param initialValue The initial value for the signal
	 */
	constructor(initialValue: T) {
		this.#value = initialValue;
	}

	/**
	 * Gets the current value of the signal.
	 * 
	 * @returns The current value
	 */
	get value(): T {
		return this.#value;
	}

	/**
	 * Sets a new value for the signal. If the new value is different from the current value
	 * (using Object.is comparison), all subscribers will be notified.
	 * 
	 * @param newValue The new value to set
	 */
	set value(newValue: T) {
		if (!Object.is(this.#value, newValue)) {
			this.#value = newValue;
			this.#subscribers.forEach(fn => fn(newValue));
		}
	}

	/**
	 * Subscribes to value changes on this signal.
	 * 
	 * @param fn The function to call when the signal value changes
	 * @returns A function that when called, unsubscribes the callback
	 */
	subscribe(fn: (value: T) => void): () => boolean {
		this.#subscribers.add(fn);
		return () => this.#subscribers.delete(fn);
	}
}