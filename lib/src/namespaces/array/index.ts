/**
 * Array Namespace Handler
 * 
 * Unified handler for all Array-like prototypes including:
 * Array, Set, Map, TypedArrays (Int8Array, Uint8Array, etc.)
 * 
 * Supports the same filter/map/sort operations across all types.
 */

import { Signal } from '../../core/signals';
import { isSignal, resolveOperand } from '../../utils/evaluation';
import { PrototypeConfig, FilterCriteria, SortCriteria } from '../types';
import { detectMutableProps } from '../../utils';
import { applyFilters } from './filter';
import { applyMapping } from './map';
import { applySorting } from './sort';

/**
 * ArrayConfig Type Definition
 * Local configuration interface for Array namespace
 */
export interface ArrayConfig<T = any, R = any> extends PrototypeConfig {
  prototype: 'Array' | 'Set' | 'Map' | 'Int8Array' | 'Uint8Array' | 'Int16Array' | 'Uint16Array' | 'Int32Array' | 'Uint32Array' | 'Float32Array' | 'Float64Array';
  items: string | T[];
  map?: R;
  filter?: FilterCriteria<T>[];
  sort?: SortCriteria<T>[];
  debounce?: number;
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
function resolveSourceSignal(items: string | any[], parentElement?: Element): Signal.State<any[]> | Signal.Computed<any[]> {
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
  } else {
    throw new Error('ArrayNamespace items must be an array, or property accessor string');
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
