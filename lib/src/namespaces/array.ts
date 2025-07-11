/**
 * Array Namespace Handler
 * 
 * Unified handler for all Array-like prototypes including:
 * Array, Set, Map, TypedArrays (Int8Array, Uint8Array, etc.)
 * 
 * Supports the same filter/map/sort operations across all types.
 */

import { Signal } from '../core/signals';
import { evaluateFilter, isSignal, resolveAccessor, resolveOperand, resolveTemplate } from '../utils/evaluation';
import { PrototypeConfig, FilterCriteria, SortCriteria } from './types';
import { detectMutableProps } from '../utils';

/**
 * ArrayConfig Type Definition
 * Local configuration interface for Array namespace
 */
export interface ArrayConfig<T = any, R = any> extends PrototypeConfig {
  prototype: 'Array' | 'Set' | 'Map' | 'Int8Array' | 'Uint8Array' | 'Int16Array' | 'Uint16Array' | 'Int32Array' | 'Uint32Array' | 'Float32Array' | 'Float64Array';
  items: string | T[] | Object; // Source array or signal
  map?: R;
  filter?: FilterCriteria<T>[];
  sort?: SortCriteria<T>[];
  debounce?: number;
  unshift?: T[]; // Items to prepend to the array
  concat?: T[]; // Items to append to the array
}

/**
 * Array Signal - Signal.Computed for processed arrays  
 */
export interface ArraySignal<T = any[]> extends Signal.Computed<T> {
  // Enhanced signal that includes mutable props metadata
  getMutableProps?(): string[];
}

/**
 * Resolves source signal from different input types with comprehensive support.
 * Handles arrays, signals, property accessors, expressions, and functions from production code.
 */
function resolveSourceSignal(items: ArrayConfig["items"], parentElement?: Element): Signal.State<any[]> | Signal.Computed<any[]> {
  // Handle different source types
  if (Array.isArray(items)) {
    return new Signal.State(items);
  } else if (typeof items === 'string') {
    // Handle property accessor resolution and expression evaluation
    const resolved = resolveOperand(items, parentElement || document.body);
    if (resolved !== null) {
      // Check if it's a signal
      if (isSignal(resolved)) {
        return resolved;
      } else if (Array.isArray(resolved)) {
        // Static array - wrap in a signal
        return new Signal.State(resolved);
      } else {
        console.error('ArrayNamespace: Property accessor resolved to non-array value:', resolved);
        throw new Error(`Property accessor "${items}" must resolve to an array or Signal containing an array`);
      }
    } else {
      console.error('ArrayNamespace: Failed to resolve property accessor:', items);
      throw new Error(`Cannot resolve property accessor: ${items}`);
    }
  } else if (isSignal(items)) {
    // If it's already a signal, return it directly
    return items as Signal.State<any[]>;
  } else {
    throw new Error('ArrayNamespace items must be an array, Signal, or property accessor string');
  }
}

/**
 * Creates a reactive Array-like collection with filtering, mapping, and sorting
 */
export const createArrayNamespace = (
  config: ArrayConfig,
  key: string,
  element: any
): ArraySignal => {
  // Config is already validated by the main namespace index

  // Detect mutable properties from the map template
  const mutableProps = config.map ? detectMutableProps(config.map) : [];

  // Resolve the source signal with comprehensive property accessor support
  const sourceSignal = resolveSourceSignal(config.items, element);

  // Create computed signal that processes the array
  const computedArray = new Signal.Computed(() => {
    // Get the source array from the resolved signal
    const sourceArray = sourceSignal.get();

    if (!Array.isArray(sourceArray)) {
      console.warn('ArrayNamespace: Source signal does not contain an array:', sourceArray);
      return createEmptyCollection(config.prototype);
    }

    // Process the array through the pipeline
    let processedArray = [...sourceArray];

    // Apply filters
    if (config.filter && config.filter.length > 0) {
      processedArray = applyFilters(processedArray, config.filter, element);
    }

    // Apply sorting
    if (config.sort && config.sort.length > 0) {
      processedArray = applySorting(processedArray, config.sort);
    }

    // Apply mapping
    if (config.map) {
      processedArray = applyMapping(processedArray, config.map);
    }

    // Apply unshift (prepend items to the array)
    if (config.unshift && config.unshift.length > 0) {
      processedArray = [...config.unshift, ...processedArray];
    }

    // Apply concat (append items to the array)
    if (config.concat && config.concat.length > 0) {
      processedArray = [...processedArray, ...config.concat];
    }

    // Convert to the target type
    return convertToTargetType(processedArray, config.prototype);
  });

  // Return an object with both the signal and mutable props info
  // This preserves the Signal interface while adding metadata
  const result = computedArray as any;
  result.getMutableProps = () => mutableProps;
  result.getSignal = () => computedArray;

  return result;
};

/**
 * Creates an empty collection of the specified type
 */
function createEmptyCollection(prototype: ArrayConfig['prototype']): any {
  switch (prototype) {
    case 'Set':
      return new Set();
    case 'Map':
      return new Map();
    case 'Array':
      return [];
    case 'Int8Array':
      return new Int8Array(0);
    case 'Uint8Array':
      return new Uint8Array(0);
    case 'Int16Array':
      return new Int16Array(0);
    case 'Uint16Array':
      return new Uint16Array(0);
    case 'Int32Array':
      return new Int32Array(0);
    case 'Uint32Array':
      return new Uint32Array(0);
    case 'Float32Array':
      return new Float32Array(0);
    case 'Float64Array':
      return new Float64Array(0);
    default:
      return [];
  }
}

/**
 * Converts a processed array to the target collection type
 */
function convertToTargetType(items: any[], prototype: ArrayConfig['prototype']): any {
  switch (prototype) {
    case 'Set':
      return new Set(items);

    case 'Map':
      // Items should be [key, value] pairs for Map
      return new Map(items);

    case 'Array':
      return items;

    case 'Int8Array':
      return new Int8Array(items.map(item => Number(item)).filter(n => !isNaN(n)));
    case 'Uint8Array':
      return new Uint8Array(items.map(item => Number(item)).filter(n => !isNaN(n)));
    case 'Int16Array':
      return new Int16Array(items.map(item => Number(item)).filter(n => !isNaN(n)));
    case 'Uint16Array':
      return new Uint16Array(items.map(item => Number(item)).filter(n => !isNaN(n)));
    case 'Int32Array':
      return new Int32Array(items.map(item => Number(item)).filter(n => !isNaN(n)));
    case 'Uint32Array':
      return new Uint32Array(items.map(item => Number(item)).filter(n => !isNaN(n)));
    case 'Float32Array':
      return new Float32Array(items.map(item => Number(item)).filter(n => !isNaN(n)));
    case 'Float64Array':
      return new Float64Array(items.map(item => Number(item)).filter(n => !isNaN(n)));

    default:
      return items;
  }
}

/**
 * Applies an array of filter expressions to items
 */
export function applyFilters(items: any[], filters: FilterCriteria[], el: any): any[] {
  const context = {
    item: null, // Current item being processed
    index: 0, // Current index in the array
    this: el, // Reference to the context for reactive expressions
    window: globalThis.window, // Global window object
    document: globalThis.document // Global document object
  };
  return items.filter((item, index) => {
    // All filters must pass (AND logic)
    context.item = item;
    context.index = index;
    const result = filters.every(filter => evaluateFilter(filter, item, context));
    return result;
  });
}



/**
 * Applies an array of sort criteria to items using modern stable sorting
 */
export function applySorting(items: any[], sortCriteria: SortCriteria[]): any[] {
  if (!sortCriteria || sortCriteria.length === 0) return items;
  
  // Create a copy to avoid mutating the original
  const sortedItems = [...items];
  
  // Pre-compute sort values for all items to avoid redundant calculations
  const sortKeys = sortedItems.map((item, index) => ({
    item,
    originalIndex: index, // For stable sorting
    keys: sortCriteria.map(criteria => getSortValue(item, criteria.sortBy))
  }));
  
  // Perform the sort using a multi-criteria comparator
  sortKeys.sort((a, b) => {
    for (let i = 0; i < sortCriteria.length; i++) {
      const criteria = sortCriteria[i];
      const comparison = compareValues(a.keys[i], b.keys[i], criteria.direction || 'asc');
      
      if (comparison !== 0) {
        return comparison;
      }
    }
    
    // Stable sort: maintain original order for equal items
    return a.originalIndex - b.originalIndex;
  });
  
  // Extract the sorted items
  return sortKeys.map(entry => entry.item);
}

/**
 * Type-aware value comparison with optimized performance
 */
function compareValues(valueA: any, valueB: any, direction: 'asc' | 'desc'): number {
  // Handle null/undefined values (null values go to end by default)
  if (valueA == null && valueB == null) return 0;
  if (valueA == null) return 1;
  if (valueB == null) return -1;
  
  let comparison: number = 0;
  
  // Get types for optimized comparison
  const typeA = typeof valueA;
  const typeB = typeof valueB;
  
  try {
    if (typeA === typeB) {
      // Same types - use optimized comparison
      switch (typeA) {
        case 'number':
          // Handle NaN values
          if (isNaN(valueA) && isNaN(valueB)) return 0;
          if (isNaN(valueA)) return 1;
          if (isNaN(valueB)) return -1;
          comparison = valueA - valueB;
          break;
          
        case 'string':
          // Use locale-aware comparison for proper unicode handling
          comparison = valueA.localeCompare(valueB, undefined, {
            numeric: true,      // "item2" < "item10"
            sensitivity: 'base', // Case-insensitive
            ignorePunctuation: false
          });
          break;
          
        case 'boolean':
          // false < true
          comparison = valueA === valueB ? 0 : (valueA ? 1 : -1);
          break;
          
        case 'bigint':
          comparison = valueA < valueB ? -1 : (valueA > valueB ? 1 : 0);
          break;
          
        default:
          // For objects, check if they're dates
          if (valueA instanceof Date && valueB instanceof Date) {
            comparison = valueA.getTime() - valueB.getTime();
          } else {
            // Fallback to string comparison
            const strA = String(valueA);
            const strB = String(valueB);
            comparison = strA.localeCompare(strB);
          }
      }
    } else {
      // Different types - convert to strings for comparison
      const strA = String(valueA);
      const strB = String(valueB);
      comparison = strA.localeCompare(strB);
    }
  } catch (error) {
    // Fallback to basic comparison on error
    comparison = valueA < valueB ? -1 : (valueA > valueB ? 1 : 0);
  }
  
  // Apply direction multiplier
  return direction === 'desc' ? -comparison : comparison;
}

/**
 * Extracts the sort value from an item using property path resolution
 */
function getSortValue(item: any, sortBy: string | ((item: any) => any)): any {
  try {
    if (typeof sortBy === 'function') {
      // Function-based sorting (for backward compatibility)
      return sortBy(item);
    }
    
    if (typeof sortBy === 'string') {
      // Property path resolution using the evaluation system
      // This handles: 'item.name', 'item.user.profile.age', etc.
      return resolveAccessor({item}, sortBy);
    }
    
    // Direct value
    return sortBy;
  } catch (error) {
    console.warn('Sort value extraction failed:', error, { item, sortBy });
    return null; // Return null for failed extractions
  }
}


const ACCESSOR_REGEX = /^(item|index|window|document)/;

/**
 * Applies a mapping template to items
 * Supports only declarative templates: object templates and string templates
 */
export function applyMapping(items: any[], mapTemplate: any): any[] {
  try {
    if (typeof mapTemplate === 'string') {
      // String template mapping
      return items.map((item, index) => transformTemplate(mapTemplate, item, index));
    } else if (typeof mapTemplate === 'object' && mapTemplate !== null) {
      // Object template mapping
      return items.map((item, index) => transformObject(mapTemplate, item, index));
    } else {
      // Direct value mapping (primitive values)
      return items.map(() => mapTemplate);
    }
  } catch (error) {
    console.warn('Mapping template failed:', error);
    return items; // Return original items on error
  }
}

/**
 * Transforms a string template with item context
 */
function transformTemplate(template: string, item: any, index: number): string {
  try {
    // Create evaluation context with item, index, and common globals
    const context = {
      item: item,
      index: index,
      window: globalThis.window,
      document: globalThis.document
    };

    // Use shared evaluation function for consistency
    return resolveTemplate(template, context);
  } catch (error) {
    console.warn(`String template evaluation failed: "${template}"`, error);
    return String(template);
  }
}

/**
 * Transforms an object template with item context
 */
function transformObject(template: object, item: any, index: number): any {
  if (Array.isArray(template)) {
    // Handle arrays recursively
    return template.map(element => transformObject(element, item, index));
  }

  if (typeof template !== 'object' || template === null) {
    // Handle primitive values
    return template;
  }

  // Transform object properties
  const result: any = {};

  Object.entries(template).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (value.includes('${')) {
        // String template properties - evaluate with item context
        result[key] = transformTemplate(value, item, index);
      } else if (ACCESSOR_REGEX.test(value)) {
        // Use shared operand resolution for property accessors like 'item[0]', 'item[1].name'
        const resolved = evaluateAccessor(value, item, index);
        result[key] = resolved;
      } else {
        // Direct value string
        result[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Nested objects - recurse
      result[key] = transformObject(value, item, index);
    } else {
      // Direct values (strings, numbers, booleans, etc.)
      result[key] = value;
    }
  });

  return result;
}


/**
 * Evaluates a property accessor string like 'item.id' or 'index' 
 * with the given item and index values
 */
export function evaluateAccessor(accessor: string, item: any, index: number): any {
  // Special cases for array mapping context
  if (accessor === 'item') return item;
  if (accessor === 'index') return index;

  const context = {
    item: item,
    index: index,
    window: globalThis.window,
    document: globalThis.document
  };

  return resolveAccessor(context, accessor, accessor);
}
