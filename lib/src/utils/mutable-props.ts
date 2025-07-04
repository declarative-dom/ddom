/**
 * Mutable Props Detection Utilities
 * 
 * Detects which properties in an array mapping configuration reference
 * 'item.' or 'index' and need surgical updates when array data changes.
 */

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
 * Gets a nested property from an object using dot notation
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => {
    return current && current[prop] !== undefined ? current[prop] : undefined;
  }, obj);
}
