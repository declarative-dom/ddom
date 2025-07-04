/**
 * Serialization Utilities
 * 
 * Handles safe serialization and deserialization for localStorage, sessionStorage,
 * and other persistence mechanisms. Provides consistent error handling and
 * fallback behavior across all namespaces.
 */

/**
 * Safely serializes a value to JSON string
 */
export function safeSerialize(value: any): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    console.warn('Serialization failed, falling back to string conversion:', error);
    return String(value);
  }
}

/**
 * Safely deserializes a JSON string back to its original value
 */
export function safeDeserialize<T = any>(jsonString: string, fallbackValue: T): T {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallbackValue;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Deserialization failed, using fallback value:', error);
    return fallbackValue;
  }
}

/**
 * Checks if a value can be safely serialized
 */
export function isSerializable(value: any): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely converts a value for storage (handles complex types)
 */
export function prepareForStorage(value: any): string {
  // Handle already-string values
  if (typeof value === 'string') {
    return value;
  }
  
  // Handle primitive types that can be safely converted
  if (value === null || value === undefined) {
    return JSON.stringify(value);
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  
  // Handle arrays and objects
  if (Array.isArray(value) || (typeof value === 'object')) {
    return safeSerialize(value);
  }
  
  // Handle functions and other complex types
  if (typeof value === 'function') {
    console.warn('Cannot serialize function, converting to string');
    return String(value);
  }
  
  // Fallback to string conversion
  return String(value);
}

/**
 * Safely restores a value from storage
 */
export function restoreFromStorage<T = any>(storedValue: string | null, fallbackValue: T = null as T): T {
  if (storedValue === null || storedValue === undefined) {
    return fallbackValue;
  }
  
  // Try to parse as JSON first
  const deserialized = safeDeserialize(storedValue, null);
  
  if (deserialized !== null) {
    return deserialized;
  }
  
  // If JSON parsing failed, try type-specific restoration
  if (typeof fallbackValue === 'number') {
    const num = Number(storedValue);
    return isNaN(num) ? fallbackValue : num as T;
  }
  
  if (typeof fallbackValue === 'boolean') {
    return (storedValue === 'true') as T;
  }
  
  if (Array.isArray(fallbackValue)) {
    // Try to parse as array, fallback to original array
    return safeDeserialize(storedValue, fallbackValue);
  }
  
  // For strings and objects, return the deserialized value or fallback
  return deserialized ?? fallbackValue;
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
export function isValidStorageKey(key: any): key is string {
  return typeof key === 'string' && key.length > 0 && key.trim() === key;
}
