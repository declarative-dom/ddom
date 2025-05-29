export class Signal<T> {
	#value: T;
	#subscribers = new Set<(value: T) => void>();

	constructor(initialValue: T) {
		this.#value = initialValue;
	}

	get value(): T {
		return this.#value;
	}

	set value(newValue: T) {
		if (!Object.is(this.#value, newValue)) {
			this.#value = newValue;
			this.#subscribers.forEach(fn => fn(newValue));
		}
	}

	subscribe(fn: (value: T) => void): () => boolean {
		this.#subscribers.add(fn);
		return () => this.#subscribers.delete(fn);
	}
}