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

	console.log(`[createReactiveProperty] Creating signal for ${key} with initial value:`, initialValue);

	// Check if this is a function that should return a signal object
	if (typeof initialValue === 'function') {
		// Evaluate the function to see what it returns
		const referencedValue = initialValue();
		console.log(`[createReactiveProperty] Function evaluated to:`, referencedValue);
		
		// Use the proper Signal polyfill type checking
		if (Signal.isState(referencedValue) || Signal.isComputed(referencedValue)) {
			// This is already a signal object - use it directly
			console.log(`[createReactiveProperty] Function returned a signal object, using directly`);
			signalInstance = referencedValue;
		} else {
			// Function returned a value, create a new signal with that value
			console.log(`[createReactiveProperty] Function returned a value, creating new signal`);
			signalInstance = new Signal.State(referencedValue);
		}
	} else if (Signal.isState(initialValue) || Signal.isComputed(initialValue)) {
		// This is already a signal object
		console.log(`[createReactiveProperty] Using existing signal object for ${key}`);
		signalInstance = initialValue;
	} else {
		// Regular reactive property - create new signal
		console.log(`[createReactiveProperty] Creating new Signal.State for ${key} with value:`, initialValue);
		signalInstance = new Signal.State(initialValue);
	}

	// Store the signal directly on the element
	(el as any)[key] = signalInstance;

	console.log(`[createReactiveProperty] Created signal instance for ${key}:`, signalInstance);
	return signalInstance;
}