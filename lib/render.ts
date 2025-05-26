import { DeclarativeHTMLElement, DeclarativeWindow } from './types';

export function buildElementTree(desc: DeclarativeHTMLElement, element?: HTMLBodyElement | HTMLElement | HTMLHeadElement): HTMLBodyElement | HTMLElement | HTMLHeadElement {
	const el = element || document.createElement(desc.tagName);

	for (const [key, value] of Object.entries(desc)) {
		if (key === 'tagName' || key === 'children') continue;

		switch (key) {
			case 'style':
				Object.assign(el.style, value);
				break;
			case 'attributes':
				el.setAttribute(attr.name, attr.value);
				break;
			default:
				(el as any)[key] = value;
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

export function registerCustomElements(map: Record<string, DeclarativeHTMLElement>) {
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
export function renderDeclarativeDOM(desc: DeclarativeWindow) {
	if (desc.customElements) {
		registerCustomElements(desc.customElements);
	}

	const containers = [
		{ source: desc.document?.body, target: document.body },
		{ source: desc.document?.head, target: document.head }
	];

	for (const { source, target } of containers) {
		if (source) buildElementTree(source as DeclarativeHTMLElement, target);
	}
}