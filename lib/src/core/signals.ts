/**
 * DDOM Signal Management System
 * 
 * This module provides comprehensive signal management for reactive programming in DDOM.
 * It includes both component-level and global signal watchers for efficient reactive updates,
 * following TC39 signal specification patterns for modern JavaScript applications.
 * 
 * Key Features:
 * - Component-level signal isolation with explicit resource management
 * - Global signal watcher for simple use cases
 * - Automatic effect creation and cleanup
 * - Memory leak prevention with proper disposal patterns
 * - Integration with TC39 signal polyfill
 * 
 * @example
 * ```typescript
 * // Component-level signal watcher (recommended)
 * const watcher = new ComponentSignalWatcher();
 * const count = new Signal.State(0);
 * const cleanup = createEffect(() => {
 *   console.log('Count:', count.get());
 * }, watcher);
 * 
 * // Clean up when component unmounts
 * watcher.dispose();
 * ```
 * 
 * @module core/signals
 * @version 0.4.1
 * @author Declarative DOM Working Group
 */

export { Signal } from 'signal-polyfill';
import { Signal } from 'signal-polyfill';

/**
 * Union type for all signal node types
 */
export type SignalNode<T = unknown> = Signal.State<T> | Signal.Computed<T>;

/**
 * Component-level signal watcher with explicit resource management.
 * Each component and MappedArray gets its own isolated watcher that can be automatically disposed.
 */
export class ComponentSignalWatcher {
	private watcher: Signal.subtle.Watcher;
	private needsEnqueue = true;
	private disposed = false;
	
	constructor() {
		this.watcher = new Signal.subtle.Watcher(() => {
			if (!this.disposed && this.needsEnqueue) {
				this.needsEnqueue = false;
				queueMicrotask(() => this.processPending());
			}
		});
	}
	
	private processPending() {
		if (this.disposed) return;
		
		this.needsEnqueue = true;
		
		for (const computedSignal of this.watcher.getPending()) {
			if (!this.disposed) {
				computedSignal.get();
			}
		}
		
		if (!this.disposed) {
			this.watcher.watch();
		}
	}
	
	/**
	 * Watch a computed signal for changes
	 */
	watch(computed: Signal.Computed<any>): void {
		if (!this.disposed) {
			this.watcher.watch(computed);
		}
	}
	
	/**
	 * Stop watching a computed signal
	 */
	unwatch(computed: Signal.Computed<any>): void {
		if (!this.disposed) {
			this.watcher.unwatch(computed);
		}
	}
	
	/**
	 * Get pending signals
	 */
	getPending(): Signal.Computed<any>[] {
		return this.disposed ? [] : Array.from(this.watcher.getPending());
	}
	
	/**
	 * Dispose of this watcher and all its resources.
	 * This provides explicit resource management for automatic cleanup.
	 */
	dispose(): void {
		if (!this.disposed) {
			this.disposed = true;
			// Unwatch all pending signals to prevent memory leaks
			for (const computed of this.watcher.getPending()) {
				this.watcher.unwatch(computed);
			}
		}
	}
}

/**
 * Global signal watcher system following the recommended pattern from the Signal polyfill examples.
 * This creates a single global watcher that processes all signal effects efficiently.
 * @deprecated Use ComponentSignalWatcher for better isolation
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
 * Creates a reactive effect that integrates with the signal watcher system.
 * Can use either a component-specific watcher or fall back to the global watcher.
 * 
 * @param callback The effect callback function
 * @param watcher Optional component-specific watcher to use instead of global
 * @returns A cleanup function to dispose of the effect
 */
export function createEffect(
	callback: () => void | (() => void), 
	watcher?: ComponentSignalWatcher
): () => void {
  let cleanup: (() => void) | void;

  const computed = new Signal.Computed(() => {
	cleanup?.();
	cleanup = callback();
  });

  const targetWatcher = watcher || globalSignalWatcher;
  targetWatcher.watch(computed);
  computed.get();

  return () => {
	targetWatcher.unwatch(computed);
	cleanup?.();
  };
}