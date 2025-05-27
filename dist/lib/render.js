export function render(desc, element) {
    const el = element || (() => {
        if ('tagName' in desc && desc.tagName) {
            return document.createElement(desc.tagName);
        }
        return null;
    })();
    if (!el)
        return null;
    for (const [key, value] of Object.entries(desc)) {
        switch (key) {
            case 'tagName':
                // Skip - already used for createElement
                break;
            case 'children':
                if (Array.isArray(value)) {
                    for (const child of value) {
                        const childNode = render(child);
                        if (childNode && 'appendChild' in el) {
                            el.appendChild(childNode);
                        }
                    }
                }
                break;
            case 'attributes':
                if (value && typeof value === 'object') {
                    for (const [attrName, attrValue] of Object.entries(value)) {
                        if (attrValue && typeof attrValue === 'string') {
                            el.setAttribute(attrName, attrValue);
                        }
                    }
                }
                break;
            case 'style':
                if (value && typeof value === 'object') {
                    Object.assign(el.style, value);
                }
                break;
            case 'document':
                if (value && el === window) {
                    render(value, document);
                }
                break;
            case 'body':
                if (value && (el === document || 'documentElement' in el)) {
                    render(value, document.body);
                }
                break;
            case 'head':
                if (value && (el === document || 'documentElement' in el)) {
                    render(value, document.head);
                }
                break;
            case 'customElements':
                if (value) {
                    registerCustomElements(value);
                }
                break;
            default:
                // Handle event listeners (properties starting with 'on')
                if (key.startsWith('on') && typeof value === 'function') {
                    const eventName = key.slice(2).toLowerCase();
                    el.addEventListener(eventName, value);
                }
                else {
                    // Set all other properties directly on the element
                    el[key] = value;
                }
                break;
        }
    }
    return el;
}
export function registerCustomElements(elements) {
    const unregisteredElements = elements.filter(element => !customElements.get(element.tagName));
    for (const def of unregisteredElements) {
        console.log(`Registering custom element: ${def.tagName}`);
        // Handle global document modifications from custom element
        if (def.document) {
            render(def.document, document);
        }
        customElements.define(def.tagName, class extends HTMLElement {
            constructor() {
                super();
            }
            connectedCallback() {
                // Check for existing shadow root (declarative or programmatic)
                const supportsDeclarative = HTMLElement.prototype.hasOwnProperty("attachInternals");
                const internals = supportsDeclarative ? this.attachInternals() : undefined;
                // Check for a Declarative Shadow Root or existing shadow root
                let container = internals?.shadowRoot || this.shadowRoot || this;
                // Clear any existing content
                container.innerHTML = '';
                // Apply the definition to the container
                for (const [key, value] of Object.entries(def)) {
                    switch (key) {
                        case 'tagName':
                        case 'document':
                        case 'connectedCallback':
                        case 'disconnectedCallback':
                        case 'attributeChangedCallback':
                        case 'adoptedCallback':
                        case 'observedAttributes':
                            // Skip these - handled separately
                            break;
                        case 'children':
                            if (Array.isArray(value)) {
                                for (const child of value) {
                                    const childNode = render(child);
                                    if (childNode && 'appendChild' in container) {
                                        container.appendChild(childNode);
                                    }
                                }
                            }
                            break;
                        case 'attributes':
                            if (value && typeof value === 'object') {
                                for (const [attrName, attrValue] of Object.entries(value)) {
                                    if (attrValue && typeof attrValue === 'string') {
                                        this.setAttribute(attrName, attrValue);
                                    }
                                }
                            }
                            break;
                        case 'style':
                            if (value && typeof value === 'object') {
                                Object.assign(this.style, value);
                            }
                            break;
                        default:
                            // Handle event listeners (properties starting with 'on')
                            if (key.startsWith('on') && typeof value === 'function') {
                                const eventName = key.slice(2).toLowerCase();
                                this.addEventListener(eventName, value);
                            }
                            else {
                                // Set all other properties directly on this element
                                this[key] = value;
                            }
                            break;
                    }
                }
                // Call custom connectedCallback if defined
                if (def.connectedCallback) {
                    def.connectedCallback(this);
                }
            }
            disconnectedCallback() {
                if (def.disconnectedCallback) {
                    def.disconnectedCallback(this);
                }
            }
            attributeChangedCallback(name, oldValue, newValue) {
                if (def.attributeChangedCallback) {
                    def.attributeChangedCallback(this, name, oldValue, newValue);
                }
            }
            adoptedCallback() {
                if (def.adoptedCallback) {
                    def.adoptedCallback(this);
                }
            }
            static get observedAttributes() {
                return def.observedAttributes || [];
            }
        });
    }
}
/**
 * Reference implementation of rendering a DeclarativeWindow object to a real DOM.
 * This is not part of the DeclarativeDOM spec itself—only a demonstration.
 */
export function renderWindow(desc) {
    render(desc, window);
}
// Auto-expose DDOM namespace globally
if (typeof window !== 'undefined') {
    window.DDOM = {
        renderWindow,
        render,
        registerCustomElements
    };
}
