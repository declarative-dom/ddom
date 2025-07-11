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
 * Serializes a value to JSON string with Date support
 */
export function serialize(value: SerializableValue): string {
  return JSON.stringify(value, replacer);
}

/**
 * Deserializes a JSON string with Date support and fallback
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
 * Validates if a value is serializable using typia
 */
export function isSerializable(value: unknown): value is SerializableValue {
  return typia.is<SerializableValue>(value);
}

/**
 * Creates a storage key with optional prefix
 */
export function createStorageKey(key: string, prefix?: string): string {
  if (prefix) {
    return `${prefix}:${key}`;
  }
  return key;
}

/**
 * Validates that a storage key is safe to use
 */
export function isValidStorageKey(key: JSONValue): key is string {
  return typeof key === 'string' && key.length > 0 && key.trim() === key;
}
