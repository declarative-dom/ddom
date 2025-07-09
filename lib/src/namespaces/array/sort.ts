/**
 * Array Sorting Logic
 * 
 * Applies SortCriteria configurations to arrays with support for:
 * - Multiple sort criteria
 * - Ascending/descending directions
 * - Nested property access
 * - Custom comparison functions
 */

import { SortCriteria } from '../../types';
import { resolveTemplateProperty } from '../../utils/evaluation';

/**
 * Applies an array of sort expressions to items
 */
export function applySorting(items: any[], SortCriterias: SortCriteria[]): any[] {
  if (!SortCriterias.length) return items;
  
  // Create a copy to avoid mutating the original
  const sortedItems = [...items];
  
  // Sort with multiple criteria
  sortedItems.sort((a, b) => {
    for (const SortCriteria of SortCriterias) {
      const comparison = compareItems(a, b, SortCriteria);
      if (comparison !== 0) {
        return comparison;
      }
    }
    return 0; // Items are equal according to all criteria
  });
  
  return sortedItems;
}

/**
 * Compares two items according to a sort expression
 */
function compareItems(a: any, b: any, SortCriteria: SortCriteria): number {
  try {
    // Get the values to compare
    const valueA = getSortValue(a, SortCriteria.sortBy);
    const valueB = getSortValue(b, SortCriteria.sortBy);
    
    // Handle null/undefined values
    if (valueA == null && valueB == null) return 0;
    if (valueA == null) return 1; // null values go to end
    if (valueB == null) return -1;
    
    // Perform comparison
    let comparison: number;
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      // String comparison (case-insensitive by default)
      comparison = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
    } else if (typeof valueA === 'number' && typeof valueB === 'number') {
      // Numeric comparison
      comparison = valueA - valueB;
    } else if (valueA instanceof Date && valueB instanceof Date) {
      // Date comparison
      comparison = valueA.getTime() - valueB.getTime();
    } else {
      // Generic comparison - convert to strings
      const strA = String(valueA);
      const strB = String(valueB);
      comparison = strA.localeCompare(strB);
    }
    
    // Apply direction
    return SortCriteria.direction === 'desc' ? -comparison : comparison;
  } catch (error) {
    console.warn('Sort comparison failed:', error, SortCriteria);
    return 0; // Treat as equal on error
  }
}

/**
 * Extracts the sort value from an item using the sortBy expression
 */
function getSortValue(item: any, sortBy: string | ((item: any) => any)): any {
  if (typeof sortBy === 'function') {
    // Custom function
    return sortBy(item);
  }
  
  if (typeof sortBy === 'string') {
    // Property path (e.g., "name", "user.profile.age")
    return resolveTemplateProperty(item, sortBy);
  }
  
  return item;
}


