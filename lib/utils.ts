import {
	DeclarativeCustomElement,
	DeclarativeHTMLBodyElement,
	DeclarativeHTMLElement,
	DeclarativeHTMLHeadElement,
	DeclarativeWindow,
	DeclarativeDocument,
} from './../types';

// Utility to get a unique selector for a DOM element or DDOM object
export function getSelector(element: Element | DeclarativeHTMLElement, parentSelector?: string, childIndex?: number): string {
	// If the id is defined, use it directly with parent context
	if (element.id) {
		const idSelector = `#${element.id}`;
		return parentSelector ? `${parentSelector} ${idSelector}` : idSelector;
	}
	
	// If the childIndex is defined, use nth-child directly
	if (childIndex !== undefined && parentSelector) {
		const tagName = 'tagName' in element ? element.tagName : (element as Element).nodeName;
		return `${parentSelector}>${tagName.toLowerCase()}:nth-child(${childIndex})`;
	}

	// Only proceed if we have an actual DOM element
	if (!(element instanceof Element)) {
		const tagName = (element as DeclarativeHTMLElement).tagName?.toLowerCase() || '';
		return parentSelector ? `${parentSelector} ${tagName}` : tagName;
	}

	// Build a selector based on the element's tag name and its position in the DOM tree
	let path: string[] = [];
	let currentElement: Element = element;

	while (currentElement && currentElement.nodeType === Node.ELEMENT_NODE) {
		let selector = currentElement.nodeName.toLowerCase();

		// Add nth-child if needed for uniqueness
		let siblings = Array.from(currentElement.parentNode?.children || []);
		let sameTagSiblings = siblings.filter(s => s.nodeName === currentElement.nodeName);

		if (sameTagSiblings.length > 1) {
			let index = sameTagSiblings.indexOf(currentElement) + 1;
			selector += `:nth-child(${index})`;
		}

		path.unshift(selector);
		currentElement = currentElement.parentNode as Element;
	}

	return path.join('>');
}

/**
 * Generate a CSS selector for a rendered element based on its position in the document
 */
export function generateElementSelector(element: HTMLElement): string {
	if (element.id) {
		return `#${element.id}`;
	}

	let path: string[] = [];
	let currentElement: Element | null = element;

	while (currentElement && currentElement !== document.body && currentElement !== document.documentElement) {
		let selector = currentElement.nodeName.toLowerCase();

		// Add nth-child for specificity
		if (currentElement.parentElement) {
			const siblings = Array.from(currentElement.parentElement.children);
			const sameTagSiblings = siblings.filter(s => s.nodeName === currentElement!.nodeName);
			
			if (sameTagSiblings.length > 1) {
				const index = sameTagSiblings.indexOf(currentElement) + 1;
				selector += `:nth-child(${index})`;
			}
		}

		path.unshift(selector);
		currentElement = currentElement.parentElement;
	}

	// Prepend body if element is in body
	if (element.closest('body')) {
		path.unshift('body');
	}

	return path.join('>');
}