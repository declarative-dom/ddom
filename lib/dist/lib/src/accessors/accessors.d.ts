/**
 * Property Accessor Resolution Module
 *
 * This module provides utilities for detecting and resolving JavaScript property accessor expressions.
 * Property accessors use standard JavaScript dot notation to access object properties and can reference
 * any resolvable value, not just signals.
 *
 * Supports patterns like:
 * - "window.globalData"
 * - "document.settings"
 * - "this.parentNode.items"
 */
/**
 * Detects if a string is a property accessor expression.
 * Property accessors use JavaScript dot notation to access object properties.
 * Supports patterns like "window.data", "document.settings", "this.parentNode.value"
 *
 * @param value - The string to check
 * @returns True if the string appears to be a property accessor
 * @example
 * ```typescript
 * isPropertyAccessor('window.userData'); // true
 * isPropertyAccessor('this.parentNode.signal'); // true
 * isPropertyAccessor('document.title'); // true
 * isPropertyAccessor('hello world'); // false
 * ```
 */
export declare function isPropertyAccessor(value: string): boolean;
/**
 * Resolves a property accessor string to its actual value.
 * Supports any resolvable JavaScript property path, including signals, objects, arrays, functions, etc.
 *
 * @param accessor - The property accessor string
 * @param contextNode - The context node for resolving "this" references
 * @returns The resolved value or null if resolution fails
 * @example
 * ```typescript
 * // Access a signal
 * const signal = resolvePropertyAccessor('this.parentNode.$count', element);
 *
 * // Access any object property
 * const config = resolvePropertyAccessor('window.appConfig', element);
 *
 * // Access nested properties
 * const user = resolvePropertyAccessor('document.currentUser.profile', element);
 *
 * // Access arrays
 * const items = resolvePropertyAccessor('this.parentNode.itemList', element);
 * ```
 */
export declare function resolvePropertyAccessor(accessor: string, contextNode: Node): any;
