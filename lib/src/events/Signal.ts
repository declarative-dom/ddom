// Re-export the standard Signal implementation
import { Signal } from 'signal-polyfill';

/**
 * Type representing a Signal node, which can be either a State or Computed signal.
 * This is used to ensure type safety when working with reactive properties.
 */
export type SignalNode<T = any> = Signal.State<T> | Signal.Computed<T>;

/**
 * Global signal watcher system following the recommended pattern from the Signal polyfill examples.
 * This creates a single global watcher that processes all signal effects efficiently.
 */
let needsEnqueue = true;

const globalSignalWatcher = new Signal.subtle.Watcher(() => {
	if (needsEnqueue) {
		needsEnqueue = false;
		queueMicrotask(processPending);
	}
});

const processPending = () => {
	needsEnqueue = true;

	for (const computedSignal of globalSignalWatcher.getPending()) {
		computedSignal.get();
	}

	globalSignalWatcher.watch();
};

export { globalSignalWatcher };

/**
 * Creates a reactive effect that integrates with the global signal watcher system.
 * This provides consistent reactive behavior across the entire DDOM system.
 * 
 * @param callback The effect callback function
 * @returns A cleanup function to dispose of the effect
 */
export function createEffect(callback: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;

  const computed = new Signal.Computed(() => {
    cleanup?.();
    cleanup = callback();
  });

  globalSignalWatcher.watch(computed);
  computed.get();

  return () => {
    globalSignalWatcher.unwatch(computed);
    cleanup?.();
  };
}

/**
 * Creates a reactive property on an element using the Signal standard.
 * Returns the Signal object directly - no wrapper getters/setters.
 * 
 * @param el The element to add the reactive property to
 * @param key The property name (should start with $)
 * @param initialValue The initial value or a function that returns a Signal.State
 * @returns The Signal.State object for direct .get()/.set() usage
 */
export function createReactiveProperty(
	el: any, 
	key: string, 
	initialValue: any
): Signal.State<any> {
	let signalInstance: any;


	// Check if this is a function that should return a signal object
	if (typeof initialValue === 'function') {
		// Evaluate the function to see what it returns
		const referencedValue = initialValue();
		
		// Use the proper Signal polyfill type checking
		if (Signal.isState(referencedValue) || Signal.isComputed(referencedValue)) {
			// This is already a signal object - use it directly
			signalInstance = referencedValue;
		} else {
			// Function returned a value, create a new signal with that value
			signalInstance = new Signal.State(referencedValue);
		}
	} else if (Signal.isState(initialValue) || Signal.isComputed(initialValue)) {
		// This is already a signal object
		signalInstance = initialValue;
	} else {
		// Regular reactive property - create new signal
		signalInstance = new Signal.State(initialValue);
	}

	// Store the signal directly on the element
	(el as any)[key] = signalInstance;

	return signalInstance;
}