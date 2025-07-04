/**
 * Property Detection Utilities
 * 
 * Utilities for detecting property types, signal patterns, and namespace configurations.
 */

/**
 * Checks if a property key should be treated as a signal
 */
export function shouldBeSignal(key: string, value: any): boolean {
  return (
    key.startsWith('$') &&
    typeof value !== 'function' && 
    !isNamespacedProperty(value) && 
    !(typeof value === 'string' && value.includes('${'))
  );
}

/**
 * Checks if a value is a prototype-based namespace configuration
 * @param value - The value to check
 * @param allowedPrototypes - Optional array of specific prototypes to allow, or single prototype string
 */
export function isNamespacedProperty(
  value: any, 
  allowedPrototypes?: PrototypeName | PrototypeName[]
): boolean {
  if (!(
    value &&
    typeof value === 'object' &&
    typeof value.prototype === 'string' &&
    SUPPORTED_PROTOTYPES.includes(value.prototype)
  )) {
    return false;
  }

  // If no specific prototypes specified, accept any valid namespace
  if (!allowedPrototypes) {
    return true;
  }

  // Check if the prototype matches the allowed types
  const allowed = Array.isArray(allowedPrototypes) ? allowedPrototypes : [allowedPrototypes];
  return allowed.includes(value.prototype as PrototypeName);
}

/**
 * Checks if a string contains template literal expressions
 */
export function hasTemplateExpression(str: string): boolean {
  return typeof str === 'string' && str.includes('${');
}

/**
 * Checks if a property should be reactive (template literal on non-$ property)
 */
export function shouldBeReactive(key: string, value: any): boolean {
  return !key.startsWith('$') && hasTemplateExpression(value);
}

/**
 * All supported prototype names for namespace detection
 */
export const SUPPORTED_PROTOTYPES = [
  // Array-like types
  'Array', 'Set', 'Map',
  'Int8Array', 'Uint8Array', 'Int16Array', 'Uint16Array',
  'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array',
  
  // Web API types
  'Request', 'FormData', 'URLSearchParams', 'Blob', 
  'ArrayBuffer', 'ReadableStream', 'LocalStorage', 'IndexedDB', 'WebSocket'
] as const;

export type PrototypeName = typeof SUPPORTED_PROTOTYPES[number];

/**
 * Array-like prototypes that are valid for children configurations
 */
export const ARRAY_LIKE_PROTOTYPES: PrototypeName[] = [
  'Array', 'Set', 'Map',
  'Int8Array', 'Uint8Array', 'Int16Array', 'Uint16Array',
  'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'
];
