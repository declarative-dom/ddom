export { Signal } from 'signal-polyfill';
import { Signal } from 'signal-polyfill';

/**
 * Union type for all signal node types
 */
export type SignalNode<T = any> = Signal.State<T> | Signal.Computed<T>;

/**
 * Global signal watcher system following the recommended pattern from the Signal polyfill examples.
 * This creates a single global watcher that processes all signal effects efficiently.
 */
let needsEnqueue = true;

const processPending = () => {
	needsEnqueue = true;

	for (const computedSignal of globalSignalWatcher.getPending()) {
		computedSignal.get();
	}

	globalSignalWatcher.watch();
};

export const globalSignalWatcher = new Signal.subtle.Watcher(() => {
	if (needsEnqueue) {
		needsEnqueue = false;
		queueMicrotask(processPending);
	}
});

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