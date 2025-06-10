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
/**
 * Creates a reactive property using a direct Signal.State object.
 * This ensures proper dependency tracking with the TC39 Signals polyfill.
 *
 * @param el - The element to attach the property to
 * @param property - The property name
 * @param initialValue - The initial value for the property
 * @returns The Signal.State instance
 */
export declare function createReactiveProperty(el: any, property: string, initialValue: any): Signal.State<any>;
