export { Signal } from 'signal-polyfill';
import { Signal } from 'signal-polyfill';

/**
 * Union type for all signal node types
 */
export type SignalNode<T = any> = Signal.State<T> | Signal.Computed<T>;

/**
 * Global Signal Watcher for tracking all signal effects.
 * This is primarily used for debugging and development purposes.
 */
export const globalSignalWatcher = new Signal.subtle.Watcher(() => {
	// Global watcher for debugging - logs all signal changes
	// console.debug('Signal changed', arguments);
});

/**
 * Creates an effect that runs when its signal dependencies change.
 * This is the core reactivity primitive for DDOM.
 * 
 * @param callback The effect callback function
 * @returns A cleanup function to dispose of the effect
 */
export function createEffect(callback: () => void | (() => void)): () => void {
  const watcher = new Signal.subtle.Watcher(callback);
  watcher.watch();
  
  // Return cleanup function
  return () => {
    watcher.unwatch();
  };
}