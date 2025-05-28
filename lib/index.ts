import { render, renderWindow, registerCustomElements } from './render'
import { clearDDOMStyles, getDDOMStyleSheet } from './css'

export { render, renderWindow, registerCustomElements } from './render'
export { addElementStyles, clearDDOMStyles } from './css'
export { generateElementSelector } from './utils'



// Create global DDOM namespace when script loads
declare global {
	interface Window {
		DDOM: {
			clearDDOMStyles: typeof clearDDOMStyles;
			getDDOMStyleSheet: typeof getDDOMStyleSheet;
			registerCustomElements: typeof registerCustomElements;
			render: typeof render;
			renderWindow: typeof renderWindow;
		};
	}
}

// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
	window.DDOM = {
		clearDDOMStyles,
		getDDOMStyleSheet,
		registerCustomElements,
		render,
		renderWindow,
	};
}