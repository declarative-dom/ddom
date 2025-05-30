import { DeclarativeDocument, DeclarativeDOM, DeclarativeHTMLElement, DeclarativeWindow, DOMNode } from '../../../types/src';
/**
 * Adopts a DeclarativeWindow into the current document context.
 */
/**
 * Adopts a DeclarativeDocument into the current document context.
 * This function applies the declarative document properties to the global document object.
 *
 * @param ddom The declarative document object to adopt
 * @example
 * ```typescript
 * adoptDocument({
 *   title: 'My App',
 *   head: { children: [{ tagName: 'meta', attributes: { charset: 'utf-8' } }] }
 * });
 * ```
 */
export declare function adoptDocument(ddom: DeclarativeDocument): void;
/**
 * Adopts a declarative DOM structure into an existing DOM node.
 * This function applies properties from the declarative object to the target element,
 * handling children, attributes, styles, and other properties appropriately.
 *
 * @param ddom The declarative DOM object to adopt
 * @param el The target DOM node to apply properties to
 * @param css Whether to process CSS styles (default: true)
 * @param ignoreKeys Array of property keys to ignore during adoption
 * @example
 * ```typescript
 * adoptNode({
 *   textContent: 'Hello',
 *   style: { color: 'red' }
 * }, myElement);
 * ```
 */
export declare function adoptNode(ddom: DeclarativeDOM, el: DOMNode, css?: boolean, ignoreKeys?: string[]): void;
/**
 * Adopts a DeclarativeWindow into the current window context.
 * This function applies the declarative window properties to the global window object.
 *
 * @param ddom The declarative window object to adopt
 * @example
 * ```typescript
 * adoptWindow({
 *   document: { title: 'My App' },
 *   customElements: [{ tagName: 'my-component' }]
 * });
 * ```
 */
export declare function adoptWindow(ddom: DeclarativeWindow): void;
/**
 * Creates an HTML element from a declarative element definition.
 * This function constructs a real DOM element based on the provided declarative structure,
 * applying all properties, attributes, children, and event handlers.
 *
 * @param ddom The declarative HTML element definition
 * @param css Whether to process CSS styles (default: true)
 * @returns The created HTML element
 * @example
 * ```typescript
 * const button = createElement({
 *   tagName: 'button',
 *   textContent: 'Click me',
 *   onclick: () => alert('Clicked!')
 * });
 * ```
 */
export declare function createElement(ddom: DeclarativeHTMLElement, css?: boolean): HTMLElement;
