import { MappedArray } from './arrays/arrays';
import { Signal } from 'signal-polyfill';
export { adoptDocument, adoptNode, adoptWindow, createElement } from './elements/elements';
export { adoptStyleSheet, clearStyleSheet } from './styleSheets/styleSheets';
export { define } from './customElements/customElements';
export { createEffect, createReactiveProperty } from './events/Signal';
export { Signal } from 'signal-polyfill';
export { MappedArray } from './arrays/arrays';
export { parseTemplateLiteral, bindTemplate, computedTemplate, isTemplateLiteral, bindPropertyTemplate, bindAttributeTemplate } from './templates/templates';
export { isPropertyAccessor, resolvePropertyAccessor } from './accessors/accessors';
export { isRequest, createFetchSignal, bindRequestProperty } from './requests/requests';
declare function DDOM(spec: any): void;
export default DDOM;
declare global {
    interface Window {
        DDOM: typeof DDOM;
        MappedArray: typeof MappedArray;
        Signal: typeof Signal;
    }
}
