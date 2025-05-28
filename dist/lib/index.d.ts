import { render, renderWindow, registerCustomElements } from './render';
import { clearDDOMStyles, getDDOMStyleSheet } from './css';
export { render, renderWindow, registerCustomElements } from './render';
export { addElementStyles, clearDDOMStyles } from './css';
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
