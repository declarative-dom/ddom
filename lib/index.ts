
import { adoptDocument, adoptNode, adoptWindow, createElement } from './elements'
import { clearStyleSheet, adoptStyleSheet } from './styleSheets'

export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements'
export { clearStyleSheet, adoptStyleSheet } from './styleSheets'



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
		};
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
	};
}