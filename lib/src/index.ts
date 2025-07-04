import { adoptDocument, adoptNode, adoptWindow, appendChild, createElement } from './dom/element';
import { adoptStyleSheet, clearStyleSheet } from './dom/style-sheets';
import { define } from './dom/custom-elements';
import { bindReactiveArray } from './dom/binding';
import { createEffect, ComponentSignalWatcher } from './core/signals';
import { Signal } from 'signal-polyfill';
import { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral } from './core/properties';
import { isNamespacedProperty, processNamespacedProperty } from './namespaces';

// Named exports for compatibility
export { adoptDocument, adoptNode, adoptWindow, createElement } from './dom/element';
export type { DOMSpecOptions, ReactiveProperties } from './dom/element';
export { adoptStyleSheet, clearStyleSheet } from './dom/style-sheets';
export { define } from './dom/custom-elements';
export { bindReactiveArray } from './dom/binding';
export { createEffect, ComponentSignalWatcher } from './core/signals';
export { Signal } from 'signal-polyfill';
export { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, isPropertyAccessor, resolvePropertyAccessor } from './core/properties';
export { isNamespacedProperty, processNamespacedProperty } from './namespaces';
export type { RequestConfig } from './types';

// Default export: DDOM function with namespace properties
function DDOM(spec: any) {
	adoptWindow(spec);
}

// Add all methods as properties on the DDOM function
Object.assign(DDOM, {
	adoptDocument,
	adoptNode,
	bindReactiveArray,
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
	parseTemplateLiteral,
	bindTemplate,
	computedTemplate,
	isTemplateLiteral,
	isNamespacedProperty,
	processNamespacedProperty,
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