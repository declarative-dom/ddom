import { CustomElementSpec } from '../../../types/src';
/**
 * Registers an array of custom elements with the browser's CustomElementRegistry.
 * This function creates new custom element classes that extend HTMLElement and
 * implement the declarative DOM structure and behavior specified in the definitions.
 *
 * Uses the new reactivity model:
 * - Template literals with ${...} get computed signals + effects automatically
 * - Non-function, non-templated properties get transparent signal proxies
 * - No component-level reactivity - only property-level reactivity
 *
 * @param elements Array of declarative custom element definitions to register
 * @example
 * ```typescript
 * define([{
 *   tagName: 'my-component',
 *   textContent: 'Hello ${this.name}', // Template literal - automatic reactivity
 *   count: 0, // Non-templated - gets transparent signal proxy
 *   children: [{ tagName: 'p', textContent: 'Content' }],
 *   connectedCallback: (el) => console.log('Component connected')
 * }]);
 * ```
 */
export declare function define(elements: CustomElementSpec[]): void;
