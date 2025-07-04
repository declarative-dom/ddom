/**
 * General Helper Utilities
 * 
 * Miscellaneous utility functions used across the codebase.
 */

/**
 * Creates a debounced version of a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: any;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Safely converts a value to a string
 */
export function safeString(value: any): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Safely converts a value to a number
 */
export function safeNumber(value: any): number {
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Creates a shallow clone of an object
 */
export function shallowClone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return [...obj] as T;
  }
  if (obj && typeof obj === 'object') {
    return { ...obj as any } as T;
  }
  return obj;
}

/**
 * Checks if two values are equal using shallow comparison
 */
export function shallowEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }
  
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => a[key] === b[key]);
  }
  
  return false;
}

/**
 * Analyzes a template to detect mutable properties that reference item or index.
 * Used for surgical DOM updates when array data changes.
 * 
 * @param template - The template object to analyze
 * @returns Array of property names that contain item/index references
 */
export function analyzeMutableProperties(template: any): string[] {
  const mutableProps: string[] = [];

  function analyze(obj: any, propPath: string = ''): void {
    if (typeof obj === 'string') {
      // Check for template literals containing item or index
      if (containsItemOrIndexReference(obj)) {
        if (propPath) {
          mutableProps.push(propPath);
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        analyze(item, propPath ? `${propPath}[${index}]` : `[${index}]`);
      });
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const newPropPath = propPath ? `${propPath}.${key}` : key;
        analyze(value, newPropPath);
      });
    }
  }

  analyze(template);
  return mutableProps;
}

/**
 * Checks if a string contains references to item or index
 */
export function containsItemOrIndexReference(str: string): boolean {
  if (typeof str !== 'string') return false;
  
  // Check for property accessor patterns
  if (str.startsWith('item.') || str === 'item' || str === 'index') {
    return true;
  }
  
  // Check for template literal patterns
  if (str.includes('${item.') || str.includes('${index}') || str.includes('${item}')) {
    return true;
  }
  
  return false;
}

/**
 * Extracts the actual property path from an item reference string
 * 
 * @param reference - The reference string (e.g., 'item.name', '${item.id}')
 * @returns The property path or null if not an item reference
 */
export function extractItemPropertyPath(reference: string): string | null {
  if (typeof reference !== 'string') return null;
  
  // Handle direct property accessor: 'item.name' -> 'name'
  if (reference.startsWith('item.')) {
    return reference.substring(5); // Remove 'item.'
  }
  
  // Handle template literal: '${item.name}' -> 'name'
  const templateMatch = reference.match(/\$\{item\.([^}]+)\}/);
  if (templateMatch) {
    return templateMatch[1];
  }
  
  // Handle direct item reference
  if (reference === 'item' || reference === '${item}') {
    return '';
  }
  
  return null;
}
