import { Signal } from 'signal-polyfill';
/**
 * Type representing a Signal node, which can be either a State or Computed signal.
 * This is used to ensure type safety when working with reactive properties.
 */
export type SignalNode<T = any> = Signal.State<T> | Signal.Computed<T>;
declare const globalSignalWatcher: Signal.subtle.Watcher;
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
export declare function createReactiveProperty(el: any, key: string, initialValue: any): Signal.State<any>;
