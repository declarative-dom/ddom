/**
 * DDOM (Declarative DOM) - Main Entry Point
 * 
 * A lightweight, reactive DOM library that bridges the gap between declarative specifications
 * and imperative DOM operations. DDOM enables you to define your UI declaratively using
 * plain JavaScript objects, while providing reactive updates through TC39 signals.
 * 
 * Key Features:
 * - Declarative DOM element creation and management
 * - Reactive property binding with automatic updates
 * - Template literal support with embedded expressions
 * - Custom element registration and lifecycle management
 * - CSS stylesheet management and dynamic styling
 * - Namespace handlers for complex data types (arrays, requests, storage, etc.)
 * - Component-level signal isolation for better performance
 * 
 * @example
 * ```typescript
 * // Create a reactive button with dynamic text
 * const count = 0;
 * const button = createElement({
 *   tagName: 'button',
 *   textContent: 'Count: ${this.count}',
 *   count: count,
 *   onclick: () => count.set(count.get() + 1)
 * });
 * 
 * // Adopt a declarative specification onto an existing element
 * adoptNode({
 *   $message: 'Hello World',
 *   textContent: '${this.$message}',
 *   style: { color: 'blue' }
 * }, document.getElementById('app'));
 * 
 * // Define custom elements
 * DDOM.customElements.define([{
 *   tagName: 'my-component',
 *   template: { tagName: 'div', textContent: 'Component content' }
 * }]);
 * ```
 * 
 * @module ddom
 * @version 0.4.1
 * @author Declarative DOM Working Group
 * @license MIT
 */

import { adoptDocument, adoptNode, adoptWindow, appendChild, createElement } from './dom/element';
import { adoptStyleSheet, clearStyleSheet } from './dom/style-sheets';
import { define } from './dom/custom-elements';
import { createEffect, ComponentSignalWatcher } from './core/signals';
import { Signal } from 'signal-polyfill';

// Named exports for compatibility
export { adoptDocument, adoptNode, adoptWindow, createElement } from './dom/element';
export { adoptStyleSheet, clearStyleSheet } from './dom/style-sheets';
export { define } from './dom/custom-elements';
export { createEffect, ComponentSignalWatcher } from './core/signals';
export { Signal } from 'signal-polyfill';

// Export property utilities that tests expect
export { processProperty as createReactiveProperty } from './core/properties';
export { getPropertyValue as resolvePropertyAccessor } from './core/evaluation';

/**
 * Main DDOM function for adopting window-level specifications.
 * This function serves as the primary entry point for applying declarative
 * specifications to the global window object.
 * 
 * @param spec - The declarative window specification to adopt
 * @example
 * ```typescript
 * // Apply global window configuration
 * DDOM({
 *   document: { title: 'My App' },
 *   $globalState: { theme: 'dark' },
 *   customElements: [{ tagName: 'my-component' }]
 * });
 * ```
 */
function DDOM(spec: any) {
	adoptWindow(spec);
}

/**
 * Enhanced DDOM object with all library methods attached.
 * This allows for both functional usage (DDOM(spec)) and method access (DDOM.createElement()).
 */
Object.assign(DDOM, {
	adoptDocument,
	adoptNode,
	adoptStyleSheet,
	adoptWindow,
	appendChild,
	clearStyleSheet,
	createElement,
	customElements: {
		define
	},
	createEffect,
	ComponentSignalWatcher,
	Signal,
});

export default DDOM;

/**
 * Global type declarations for window namespace.
 * Extends the global Window interface to include DDOM and Signal types
 * for convenient access in browser environments.
 */
declare global {
	interface Window {
		/** Global DDOM instance for imperative access */
		DDOM: typeof DDOM;
		/** Global Signal constructor for reactive state */
		Signal: typeof Signal;
	}
}

/**
 * Auto-expose DDOM and Signal to global namespace in browser environments.
 * This enables usage without imports: window.DDOM and window.Signal.
 * Only executes in browser environments where window is defined.
 */
if (typeof window !== 'undefined') {
	window.DDOM = DDOM;
	window.Signal = Signal;
}