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
export declare const globalSignalWatcher: Signal.subtle.Watcher;
/**
 * Creates an effect that runs when its signal dependencies change.
 * This is the core reactivity primitive for DDOM.
 *
 * @param callback The effect callback function
 * @returns A cleanup function to dispose of the effect
 */
export declare function createEffect(callback: () => void | (() => void)): () => void;
