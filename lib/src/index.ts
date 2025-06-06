import { adoptDocument, adoptNode, adoptWindow, appendChild, createElement } from './elements/elements';
import { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
import { define } from './customElements/customElements';
import { DeclarativeArray } from './arrays/arrays';
import { createEffect, createReactiveProperty } from './events/Signal';
import { Signal } from 'signal-polyfill';
import { evalTemplate, bindTemplate, computedTemplate, hasReactiveExpressions, bindReactiveProperty, bindReactiveAttribute } from './templates/templates';

// Named exports for compatibility
export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements/elements';
export { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
export { define } from './customElements/customElements';
export { createEffect, createReactiveProperty } from './events/Signal';
export { Signal } from 'signal-polyfill';
export { DeclarativeArray } from './arrays/arrays';
export { evalTemplate, bindTemplate, computedTemplate, hasReactiveExpressions, bindReactiveProperty, bindReactiveAttribute } from './templates/templates';

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
	DeclarativeArray,
	Signal,
	evalTemplate,
	bindTemplate,
	computedTemplate,
	hasReactiveExpressions,
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
			evalTemplate: typeof evalTemplate;
			bindTemplate: typeof bindTemplate;
			computedTemplate: typeof computedTemplate;
			hasReactiveExpressions: typeof hasReactiveExpressions;
			bindReactiveProperty: typeof bindReactiveProperty;
			bindReactiveAttribute: typeof bindReactiveAttribute;
			customElements: {
				define: typeof define;
			};
		};
		DeclarativeArray: typeof DeclarativeArray;
		Signal: typeof Signal;
	}
}

// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
	window.DDOM = DDOM;
	window.DeclarativeArray = DeclarativeArray;
	window.Signal = Signal;
}