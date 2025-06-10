export { Signal } from 'signal-polyfill';
import { Signal } from 'signal-polyfill';
/**
 * Union type for all signal node types
 */
export type SignalNode<T = any> = Signal.State<T> | Signal.Computed<T>;
export declare const globalSignalWatcher: Signal.subtle.Watcher;
/**
 * Creates a reactive effect that integrates with the global signal watcher system.
 * This provides consistent reactive behavior across the entire DDOM system.
 *
 * @param callback The effect callback function
 * @returns A cleanup function to dispose of the effect
 */
export declare function createEffect(callback: () => void | (() => void)): () => void;
