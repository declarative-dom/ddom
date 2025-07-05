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
 * Checks if a value references item or index data
 */
export function isMutableProp(value: any): boolean {
  if (typeof value === 'string') {
    // Check for property accessor patterns like 'item.id', 'item.name', 'index'
    return (
      value.includes('item.') || 
      value === 'index' ||
      value.includes('index.') ||
      // Also check template literals like '${item.name}'
      (value.includes('${') && (value.includes('item.') || value.includes('index')))
    );
  }
  return false;
}

/**
 * Analyzes a mapping configuration object and returns the properties
 * that reference item or index data and need surgical updates
 */
export function detectMutableProps(mapConfig: any): string[] {
  if (!mapConfig || typeof mapConfig !== 'object') {
    return [];
  }

  const mutableProps: string[] = [];

  Object.entries(mapConfig).forEach(([key, value]) => {
    if (isMutableProp(value)) {
      mutableProps.push(key);
    }
  });

  return mutableProps;
}

/**
 * Analyzes a template to detect mutable properties that reference item or index.
 * Used for surgical DOM updates when array data changes.
 * Provides deep recursive analysis of nested objects and arrays.
 * 
 * @param template - The template object to analyze
 * @returns Array of property names that contain item/index references
 */
export function analyzeMutableProperties(template: any): string[] {
  const mutableProps: string[] = [];

  function analyze(obj: any, propPath: string = ''): void {
    if (typeof obj === 'string') {
      // Check for template literals containing item or index
      if (isMutableProp(obj)) {
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

import { getNestedProperty } from './evaluation';

/**
 * Evaluates a property accessor string like 'item.id' or 'index' 
 * with the given item and index values
 */
export function evaluateAccessor(accessor: string, item: any, index: number): any {
  if (accessor === 'index') {
    return index;
  }
  
  if (accessor.startsWith('item.')) {
    const propertyPath = accessor.substring(5); // Remove 'item.'
    return getNestedProperty(item, propertyPath);
  }
  
  // Handle template literals
  if (accessor.includes('${')) {
    try {
      // Simple template evaluation - replace item. and index references
      let evaluated = accessor;
      evaluated = evaluated.replace(/\$\{item\.([^}]+)\}/g, (_, path) => {
        const value = getNestedProperty(item, path);
        return JSON.stringify(value);
      });
      evaluated = evaluated.replace(/\$\{index\}/g, String(index));
      
      // Remove template literal syntax if it was purely templated
      if (evaluated.startsWith('${') && evaluated.endsWith('}')) {
        return JSON.parse(evaluated.slice(2, -1));
      }
      
      return evaluated;
    } catch {
      return accessor; // Fallback to original string
    }
  }
  
  return accessor;
}

/**
 * Generates a path-based CSS selector for an element.
 * Creates a unique selector using element hierarchy and nth-of-type selectors.
 * This function assumes the element exists in the DOM with a parentElement.
 *
 * @param el - The element to generate a selector for (must be in DOM)
 * @returns A unique CSS selector string based on DOM hierarchy
 * @example
 * ```typescript
 * const selector = generatePathSelector(myDiv);
 * // Returns something like: "body > div:nth-of-type(2) > span"
 * ```
 */
export function generatePathSelector(el: Element): string {
  const path: string[] = [];
  let current: Element | null = el;

  while (current && current !== document.documentElement) {
	const tagName = current.tagName.toLowerCase();
	const parent: Element | null = current.parentElement;

	if (parent) {
	  const siblings = Array.from(parent.children).filter(
		(child: Element) => child.tagName.toLowerCase() === tagName
	  );

	  if (siblings.length === 1) {
		path.unshift(tagName);
	  } else {
		const index = siblings.indexOf(current) + 1;
		path.unshift(`${tagName}:nth-of-type(${index})`);
	  }
	} else {
	  path.unshift(tagName);
	}

	current = parent;
  }

  return path.join(' > ');
}
