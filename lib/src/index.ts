import { adoptDocument, adoptNode, adoptWindow, appendChild, createElement } from './elements';
import { adoptStyleSheet, clearStyleSheet } from './dom/style-sheets';
import { define } from './dom/custom-elements';
import { createEffect, ComponentSignalWatcher } from './signals';
import { Signal } from 'signal-polyfill';
import { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, bindPropertyTemplate, bindAttributeTemplate, createReactiveProperty } from './properties';
import { isNamespacedProperty, processNamespacedProperty } from './namespaces';

// Named exports for compatibility
export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements';
export type { DOMSpecOptions, ReactiveProperties } from './elements';
export { adoptStyleSheet, clearStyleSheet } from './dom/style-sheets';
export { define } from './dom/custom-elements';
export { createEffect, ComponentSignalWatcher } from './signals';
export { Signal } from 'signal-polyfill';
export { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, bindPropertyTemplate, bindAttributeTemplate, isPropertyAccessor, resolvePropertyAccessor, createReactiveProperty } from './properties';
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
	adoptStyleSheet,
	adoptWindow,
	appendChild,
	clearStyleSheet,
	createElement,
	customElements: {
		define
	},
	createEffect,
	createReactiveProperty,
	ComponentSignalWatcher,
	Signal,
	parseTemplateLiteral,
	bindTemplate,
	computedTemplate,
	isTemplateLiteral,
	bindPropertyTemplate,
	bindAttributeTemplate,
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