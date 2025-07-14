/**
 * General Helper Utilities
 * 
 * Miscellaneous utility functions used across the codebase.
 */

/**
 * Creates a debounced version of a function that delays execution until after
 * the specified delay has passed since the last invocation. Useful for optimizing
 * performance with frequently called functions like input handlers or API calls.
 * 
 * @param func - The function to debounce
 * @param delay - The delay in milliseconds
 * @returns A debounced version of the original function
 * 
 * @example
 * ```typescript
 * const search = debounce((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * // Multiple rapid calls
 * search('a');
 * search('ab');  
 * search('abc'); // Only this will execute after 300ms
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Safely converts any value to a string with intelligent fallback handling.
 * Handles null/undefined, primitives, and complex objects with JSON serialization
 * fallback to String() for non-serializable values.
 * 
 * @param value - The value to convert to string
 * @returns A string representation of the value
 * 
 * @example
 * ```typescript
 * safeString(null); // ''
 * safeString(123); // '123'
 * safeString({a: 1}); // '{"a":1}'
 * safeString(function() {}); // '[object Function]'
 * ```
 */
export function safeString(value: unknown): string {
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
 * Safely converts any value to a number with fallback to zero for invalid values.
 * Useful for ensuring numeric operations don't fail with NaN values.
 * 
 * @param value - The value to convert to number
 * @returns A valid number (0 if conversion fails)
 * 
 * @example
 * ```typescript
 * safeNumber('123'); // 123
 * safeNumber('abc'); // 0
 * safeNumber(null); // 0
 * safeNumber(true); // 1
 * ```
 */
export function safeNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

/**
 * Creates a shallow clone of an object or array preserving the original type.
 * Uses spread syntax for optimal performance with arrays and objects.
 * 
 * @param obj - The object to clone
 * @returns A shallow copy of the original object
 * 
 * @example
 * ```typescript
 * const original = { a: 1, b: { c: 2 } };
 * const clone = shallowClone(original);
 * clone.a = 3; // original.a is still 1
 * clone.b.c = 4; // original.b.c is also 4 (shallow)
 * ```
 */
export function shallowClone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return [...obj] as T;
  }
  if (obj && typeof obj === 'object') {
    return { ...obj as object } as T;
  }
  return obj;
}

/**
 * Checks if two values are equal using shallow comparison
 */
export function shallowEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }
  
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => (a as any)[key] === (b as any)[key]);
  }
  
  return false;
}

/**
 * Checks if a value references item or index data
 */
export function isMutableProp(value: unknown): boolean {
  if (typeof value === 'string') {
    // Check for property accessor patterns like 'item.id', 'item.name', 'index'
    return (
      value === 'item' ||
      value.includes('item.') || 
      value === 'index' ||
      value.includes('index.') ||
      // Also check template literals like '${item.name}'
      (value.includes('${') && (value.includes('item')) || value.includes('index'))
    );
  }
  return false;
}

/**
 * Analyzes a mapping configuration object and returns the properties
 * that reference item or index data and need surgical updates
 */
export function detectMutableProps(mapConfig: Record<string, unknown>): string[] {
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
export function analyzeMutableProperties(template: unknown): string[] {
  const mutableProps: string[] = [];

  function analyze(obj: unknown, propPath: string = ''): void {
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
