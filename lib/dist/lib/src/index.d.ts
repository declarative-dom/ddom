import { adoptDocument, adoptNode, adoptWindow, createElement } from './elements/elements';
import { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
import { define } from './customElements/customElements';
export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements/elements';
export { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
export { define } from './customElements/customElements';
export { Signal } from './events/Signal';
declare global {
    interface Window {
        ddom: {
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
    }
}
