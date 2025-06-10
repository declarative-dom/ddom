import { adoptDocument, adoptNode, adoptWindow, appendChild, createElement } from './elements/elements';
import { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
import { define } from './customElements/customElements';
import { MappedArray } from './arrays/arrays';
import { createEffect } from './events/Signal';
import { Signal } from 'signal-polyfill';
import { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, bindReactiveProperty, bindReactiveAttribute, createReactiveProperty } from './templates/templates';

// Named exports for compatibility
export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements/elements';
export { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
export { define } from './customElements/customElements';
export { createEffect } from './events/Signal';
export { createReactiveProperty } from './templates/templates';
export { Signal } from 'signal-polyfill';
export { MappedArray } from './arrays/arrays';
export { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, bindReactiveProperty, bindReactiveAttribute } from './templates/templates';

// Default export with DDOM namespace
const DDOM = {
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
	MappedArray,
	Signal,
	parseTemplateLiteral,
	bindTemplate,
	computedTemplate,
	isTemplateLiteral,
	bindReactiveProperty,
	bindReactiveAttribute
};

export default DDOM;

// Create global DDOM namespace when script loads
declare global {
	interface Window {
		DDOM: {
			adoptDocument: typeof adoptDocument;
			adoptNode: typeof adoptNode;
			adoptStyleSheet: typeof adoptStyleSheet;
			adoptWindow: typeof adoptWindow;
			appendChild: typeof appendChild;
			clearStyleSheet: typeof clearStyleSheet;
			createEffect: typeof createEffect;
			createReactiveProperty: typeof createReactiveProperty;
			createElement: typeof createElement;
			parseTemplateLiteral: typeof parseTemplateLiteral;
			bindTemplate: typeof bindTemplate;
			computedTemplate: typeof computedTemplate;
			isTemplateLiteral: typeof isTemplateLiteral;
			bindReactiveProperty: typeof bindReactiveProperty;
			bindReactiveAttribute: typeof bindReactiveAttribute;
			customElements: {
				define: typeof define;
			};
		};
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