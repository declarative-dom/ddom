import { adoptDocument, adoptNode, adoptWindow, appendChild, createElement } from './elements/elements';
import { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
import { define } from './customElements/customElements';
import { MappedArray } from './arrays/arrays';
import { createEffect } from './events/Signal';
import { Signal } from 'signal-polyfill';
import { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, bindReactiveProperty, bindReactiveAttribute, createReactiveProperty } from './templates/templates';
export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements/elements';
export { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
export { define } from './customElements/customElements';
export { createEffect } from './events/Signal';
export { createReactiveProperty } from './templates/templates';
export { Signal } from 'signal-polyfill';
export { MappedArray } from './arrays/arrays';
export { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, bindReactiveProperty, bindReactiveAttribute } from './templates/templates';
declare const DDOM: {
    adoptDocument: typeof adoptDocument;
    adoptNode: typeof adoptNode;
    adoptStyleSheet: typeof adoptStyleSheet;
    adoptWindow: typeof adoptWindow;
    appendChild: typeof appendChild;
    clearStyleSheet: typeof clearStyleSheet;
    createElement: typeof createElement;
    customElements: {
        define: typeof define;
    };
    createEffect: typeof createEffect;
    createReactiveProperty: typeof createReactiveProperty;
    MappedArray: typeof MappedArray;
    Signal: typeof Signal;
    parseTemplateLiteral: typeof parseTemplateLiteral;
    bindTemplate: (template: string) => (context: any) => any;
    computedTemplate: typeof computedTemplate;
    isTemplateLiteral: typeof isTemplateLiteral;
    bindReactiveProperty: typeof bindReactiveProperty;
    bindReactiveAttribute: typeof bindReactiveAttribute;
};
export default DDOM;
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
