import { adoptDocument, adoptNode, adoptWindow, createElement } from './elements/elements';
import { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
import { define } from './customElements/customElements';
import { DeclarativeArray } from './arrays/arrays';
import { Signal } from 'signal-polyfill';

export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements/elements';
export { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
export { define } from './customElements/customElements';
export { createReactiveProperty } from './events/Signal';
export { Signal } from 'signal-polyfill';

// Create global DDOM namespace when script loads
declare global {
	interface Window {
		DDOM: {
			adoptDocument: typeof adoptDocument;
			adoptNode: typeof adoptNode;
			adoptStyleSheet: typeof adoptStyleSheet;
			adoptWindow: typeof adoptWindow;
			clearStyleSheet: typeof clearStyleSheet;
			createElement: typeof createElement;
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
	window.DDOM = {
		adoptDocument,
		adoptNode,
		adoptStyleSheet,
		adoptWindow,
		clearStyleSheet,
		createElement,
		customElements: {
			define
		},
	};
	DeclarativeArray;
	Signal;
}