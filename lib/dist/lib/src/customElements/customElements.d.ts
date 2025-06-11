import { CustomElementSpec } from '../../../types/src';
/**
 * Registers an array of custom elements with the browser's CustomElementRegistry.
 * Modern, simplified implementation using latest JavaScript features.
 *
 * Key features:
 * - Single initialization per element
 * - AbortController for automatic cleanup
 * - Simplified container logic
 * - No unnecessary feature detection
 *
 * @param elements Array of declarative custom element definitions to register
 */
export declare function define(elements: CustomElementSpec[]): void;
