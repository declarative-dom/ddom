import { adoptDocument, adoptNode, adoptWindow, createElement } from './elements';
import { clearStyleSheet, adoptStyleSheet } from './styleSheets';
export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements';
export { clearStyleSheet, adoptStyleSheet } from './styleSheets';
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
