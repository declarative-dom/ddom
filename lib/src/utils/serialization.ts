/**
 * Serialization Utilities
 * 
 * Simplified serialization using typia validation with Date support.
 */

import typia from 'typia';

export type JSONValue = string | number | boolean | null | JSONValue[] | {[key: string]: JSONValue}

export type SerializableValue = JSONValue | Date | SerializableValue[] | {[key: string]: SerializableValue}

// Date marker to identify serialized dates
const DATE_MARKER = '__DATE__';

/**
 * Replacer function for JSON.stringify - converts Date objects to marked format
 */
function replacer(key: string, value: any): any {
  if (value instanceof Date) {
    return { [DATE_MARKER]: value.toISOString() };
  }
  return value;
}

/**
 * Reviver function for JSON.parse - converts marked date strings back to Date objects
 */
function reviver(key: string, value: any): any {
  if (value && typeof value === 'object' && value[DATE_MARKER]) {
    return new Date(value[DATE_MARKER]);
  }
  return value;
}

/**
 * Serializes a value to JSON string with automatic Date object support.
 * Uses a custom replacer function to preserve Date objects during serialization
 * by converting them to a special marked format that can be restored during deserialization.
 * 
 * @param value - The value to serialize (must be SerializableValue type)
 * @returns JSON string representation with Date objects preserved
 * 
 * @example
 * ```typescript
 * const data = {
 *   name: 'John',
 *   createdAt: new Date(),
 *   items: [1, 2, 3]
 * };
 * const jsonString = serialize(data);
 * console.log(jsonString); // JSON with Date preserved as __DATE__ marker
 * ```
 */
export function serialize(value: SerializableValue): string {
  return JSON.stringify(value, replacer);
}

/**
 * Deserializes a JSON string with automatic Date object restoration and error handling.
 * Uses a custom reviver function to restore Date objects from their marked format
 * and provides graceful fallback for malformed JSON.
 * 
 * @param jsonString - The JSON string to deserialize
 * @returns The deserialized value with Date objects restored
 * 
 * @example
 * ```typescript
 * const jsonString = '{"name":"John","createdAt":{"__DATE__":"2023-01-01T00:00:00.000Z"}}';
 * const data = deserialize(jsonString);
 * console.log(data.createdAt instanceof Date); // true
 * ```
 */
export function deserialize<T = SerializableValue>(jsonString: string): T {
  // Use JSON.parse with reviver to handle Date objects
  try {
    return JSON.parse(jsonString, reviver);
  } catch (error) {
    console.error('Deserialization error:', error);
    return {} as T; // Return empty object or handle as needed
  }
}

/**
 * Validates if a value is serializable using typia type checking.
 * Ensures the value conforms to SerializableValue type constraints,
 * which includes JSON-compatible types plus Date objects.
 * 
 * @param value - The value to validate
 * @returns True if the value can be safely serialized
 * 
 * @example
 * ```typescript
 * console.log(isSerializable({ name: 'John', age: 30 })); // true
 * console.log(isSerializable(new Date())); // true
 * console.log(isSerializable(function() {})); // false
 * ```
 */
export function isSerializable(value: unknown): value is SerializableValue {
  return typia.is<SerializableValue>(value);
}

/**
 * Creates a prefixed storage key for namespacing stored values.
 * Useful for organizing storage entries and avoiding key collisions
 * between different parts of an application.
 * 
 * @param key - The base key name
 * @param prefix - Optional prefix to prepend
 * @returns The formatted storage key
 * 
 * @example
 * ```typescript
 * createStorageKey('user', 'myapp'); // 'myapp:user'
 * createStorageKey('settings'); // 'settings'
 * ```
 */
export function createStorageKey(key: string, prefix?: string): string {
  if (prefix) {
    return `${prefix}:${key}`;
  }
  return key;
}

/**
 * Validates that a storage key is safe and valid for use with Web Storage APIs.
 * Ensures the key is a non-empty string without leading/trailing whitespace.
 * 
 * @param key - The key to validate
 * @returns True if the key is valid for storage operations
 * 
 * @example
 * ```typescript
 * console.log(isValidStorageKey('user-data')); // true
 * console.log(isValidStorageKey('')); // false
 * console.log(isValidStorageKey(' key ')); // false
 * ```
 */
export function isValidStorageKey(key: JSONValue): key is string {
  return typeof key === 'string' && key.length > 0 && key.trim() === key;
}
