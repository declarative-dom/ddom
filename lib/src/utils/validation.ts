/**
 * Validation Utilities
 * 
 * Common validation functions for namespace configurations and property values.
 */

/**
 * Validates that a namespace configuration has required properties
 */
export function validateNamespaceConfig(
  config: any,
  key: string,
  requiredProperties: string[] = []
): boolean {
  if (!config || typeof config !== 'object') {
    console.warn(`Invalid namespace config for ${key}: must be an object`);
    return false;
  }

  if (!config.prototype || typeof config.prototype !== 'string') {
    console.warn(`Invalid namespace config for ${key}: missing or invalid prototype`);
    return false;
  }

  // Check required properties
  for (const prop of requiredProperties) {
    if (!(prop in config)) {
      console.warn(`Invalid namespace config for ${key}: missing required property '${prop}'`);
      return false;
    }
  }

  return true;
}

/**
 * Validates that a value is a valid operator
 */
export function isValidOperator(operator: string): boolean {
  const validOperators = [
    '===', '!==', '==', '!=', '<', '<=', '>', '>=',
    'includes', 'startsWith', 'endsWith', 'in', 'regex'
  ];
  return validOperators.includes(operator);
}

/**
 * Validates that a sort direction is valid
 */
export function isValidSortDirection(direction: string): boolean {
  return direction === 'asc' || direction === 'desc';
}

/**
 * Safely checks if a value is valid (not null/undefined)
 */
export function isValidValue(value: any): boolean {
  return value != null;
}

/**
 * Validates that an array items source is valid
 */
export function validateArraySource(items: any): boolean {
  return Array.isArray(items) || typeof items === 'string';
}
