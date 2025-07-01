import { adoptDocument, adoptNode, adoptWindow, appendChild, createElement } from './elements/elements';
import { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
import { define } from './customElements/customElements';
import { MappedArray, isMappedArrayExpr } from './arrays/arrays';
import { createEffect, ComponentSignalWatcher } from './events/Signal';
import { Signal } from 'signal-polyfill';
import { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, bindPropertyTemplate, bindAttributeTemplate, isPropertyAccessor, resolvePropertyAccessor, createReactiveProperty } from './properties';

// Named exports for compatibility
export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements/elements';
export type { DOMSpecOptions, ReactiveProperties } from './elements/elements';
export { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
export { define } from './customElements/customElements';
export { createEffect, ComponentSignalWatcher } from './events/Signal';
export { Signal } from 'signal-polyfill';
export { MappedArray, isMappedArrayExpr } from './arrays/arrays';
export { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, bindPropertyTemplate, bindAttributeTemplate, isPropertyAccessor, resolvePropertyAccessor, createReactiveProperty } from './properties';

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
	MappedArray,
	isMappedArrayExpr,
	Signal,
	parseTemplateLiteral,
	bindTemplate,
	computedTemplate,
	isTemplateLiteral,
	bindPropertyTemplate,
	bindAttributeTemplate
});

export default DDOM;

// Create global DDOM namespace when script loads
declare global {
	interface Window {
		DDOM: typeof DDOM;
		MappedArray: typeof MappedArray;
		Signal: typeof Signal;
	}
}

// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
	window.DDOM = DDOM;
	window.MappedArray = MappedArray;
	window.Signal = Signal;
}