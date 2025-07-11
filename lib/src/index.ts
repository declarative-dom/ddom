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
export { resolveAccessor as resolvePropertyAccessor } from './utils/evaluation';

// Default export: DDOM function with namespace properties
function DDOM(spec: any) {
	adoptWindow(spec);
}

// Add all methods as properties on the DDOM function
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

// Create global DDOM namespace when script loads
declare global {
	interface Window {
		DDOM: typeof DDOM;
		Signal: typeof Signal;
	}
}

// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
	window.DDOM = DDOM;
	window.Signal = Signal;
}