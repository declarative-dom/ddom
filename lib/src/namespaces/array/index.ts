/**
 * Array Namespace Handler
 * 
 * Unified handler for all Array-like prototypes including:
 * Array, Set, Map, TypedArrays (Int8Array, Uint8Array, etc.)
 * 
 * Supports the same filter/map/sort operations across all types.
 */

import { Signal } from '../../core/signals';
import { processProperty } from '../../core/properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';
import { ArrayConfig, FilterCriteria, SortCriteria } from '../../types';
import { detectMutableProps } from '../../utils';
import { applyFilters } from './filter';
import { applyMapping } from './map';
import { applySorting } from './sort';

/**
 * Map of prototype names to their constructors
 */
const ARRAY_CONSTRUCTORS = {
  'Array': Array,
  'Set': Set,
  'Map': Map,
  'Int8Array': Int8Array,
  'Uint8Array': Uint8Array,
  'Int16Array': Int16Array,
  'Uint16Array': Uint16Array,
  'Int32Array': Int32Array,
  'Uint32Array': Uint32Array,
  'Float32Array': Float32Array,
  'Float64Array': Float64Array,
} as const;

/**
 * Creates a reactive Array-like collection with filtering, mapping, and sorting
 */
export const createArrayNamespace = createNamespaceHandler(
  (config: any, key: string): config is ArrayConfig =>
    validateNamespaceConfig(config, key, ['items']) &&
    config.prototype in ARRAY_CONSTRUCTORS,
  
  (config: ArrayConfig, key: string, element: any) => {
    // Detect mutable properties from the map template
    const mutableProps = config.map ? detectMutableProps(config.map) : [];
    
    // Create computed signal that processes the array
    const computedArray = new Signal.Computed(() => {
      // Resolve the source items
      const processed = processProperty('items', config.items, element);
      
      if (!processed.isValid || !Array.isArray(processed.value)) {
        // Return empty array of the appropriate type
        return createEmptyCollection(config.prototype);
      }
      
      // Process the array through the pipeline
      let processedArray = [...processed.value];
      
      // Apply filters
      if (config.filter && config.filter.length > 0) {
        processedArray = applyFilters(processedArray, config.filter, element);
      }
      
      // Apply mapping
      if (config.map) {
        processedArray = applyMapping(processedArray, config.map);
      }
      
      // Apply sorting
      if (config.sort && config.sort.length > 0) {
        processedArray = applySorting(processedArray, config.sort);
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
  }
);

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
