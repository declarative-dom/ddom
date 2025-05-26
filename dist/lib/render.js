function buildElementTree(desc, element) {
    const el = element || document.createElement(desc.tagName);
    for (const [key, value] of Object.entries(desc)) {
        if (key === 'tagName' || key === 'children')
            continue;
        switch (key) {
            case 'style':
                Object.assign(el.style, value);
                break;
            case 'attributes':
                if (Array.isArray(value)) {
                    for (const attr of value) {
                        if (attr && typeof attr === 'object' && 'name' in attr && 'value' in attr) {
                            el.setAttribute(attr.name, attr.value);
                        }
                    }
                }
                break;
            default:
                el[key] = value;
                break;
        }
    }
    if (Array.isArray(desc.children)) {
        for (const child of desc.children) {
            el.appendChild(buildElementTree(child));
        }
    }
    return el;
}
function registerCustomElements(map) {
    for (const [tag, def] of Object.entries(map)) {
        class DeclarativeComponent extends HTMLElement {
            constructor() {
                super();
                const el = buildElementTree(def);
                this.appendChild(el);
            }
        }
        if (!customElements.get(tag)) {
            customElements.define(tag, DeclarativeComponent);
        }
    }
}
/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
export function renderDeclarativeDOM(window) {
    if (window.customElements) {
        registerCustomElements(window.customElements);
    }
    const containers = [
        { source: window.document?.body, target: document.body },
        { source: window.document?.head, target: document.head }
    ];
    for (const { source, target } of containers) {
        if (source)
            buildElementTree(source, target);
    }
}
