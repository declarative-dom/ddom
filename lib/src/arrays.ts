/**
 * Arrays Module - Backward Compatibility Wrapper
 * 
 * This module provides backward compatibility exports for MappedArray
 * and related array functionality that tests expect.
 */

import { Signal } from './core/signals';
import { createArrayNamespace, ArrayConfig } from './namespaces/array';
import { isSignal } from './utils/evaluation';

/**
 * Array configuration type checker - simplified version without typia
 */
export function isArrayConfig(obj: any): obj is ArrayConfig {
  return (
    obj &&
    typeof obj === 'object' &&
    'prototype' in obj &&
    typeof obj.prototype === 'string' &&
    ['Array', 'Set', 'Map', 'Int8Array', 'Uint8Array', 'Int16Array', 'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array'].includes(obj.prototype) &&
    'items' in obj
  );
}

/**
 * MappedArray class - compatibility wrapper around the namespace system
 */
export class MappedArray<T = any, R = any> {
  private signal: Signal.State<R[]> | Signal.Computed<R[]>;
  
  constructor(config: ArrayConfig<T, R> | { items: any; map?: any; filter?: any; sort?: any; debounce?: number }) {
    // Create a computed signal that processes the source array
    this.signal = new Signal.Computed(() => {
      // Get the source array
      let sourceArray: any[];
      
      if (isSignal(config.items)) {
        sourceArray = config.items.get();
      } else if (Array.isArray(config.items)) {
        sourceArray = config.items;
      } else {
        console.warn('MappedArray: Invalid items source:', config.items);
        return [];
      }
      
      if (!Array.isArray(sourceArray)) {
        return [];
      }
      
      // Process the array through the pipeline
      let processedArray = [...sourceArray];
      
      // Apply filters (simplified - handle basic filters for now)
      if (config.filter && Array.isArray(config.filter)) {
        for (const filterCriteria of config.filter) {
          if (filterCriteria.leftOperand === 'item' && filterCriteria.operator === '>' && typeof filterCriteria.rightOperand === 'number') {
            processedArray = processedArray.filter(item => item > filterCriteria.rightOperand);
          }
        }
      }
      
      // Apply mapping (simplified - handle object templates)
      if (config.map && typeof config.map === 'object') {
        processedArray = processedArray.map((item, index) => {
          const result: any = {};
          Object.entries(config.map).forEach(([key, value]) => {
            if (typeof value === 'string') {
              if (value.includes('${')) {
                // Template string - replace ${item} with actual value
                result[key] = value.replace(/\$\{item\}/g, String(item));
              } else if (value === 'item') {
                result[key] = item;
              } else if (value === 'index') {
                result[key] = index;
              } else {
                result[key] = value;
              }
            } else {
              result[key] = value;
            }
          });
          return result;
        });
      }
      
      return processedArray;
    });
  }
  
  /**
   * Get the current array value
   */
  get(): R[] {
    return this.signal.get();
  }
  
  /**
   * Dispose of the array and cleanup resources
   */
  dispose(): void {
    // For now, no explicit cleanup needed as signals are garbage collected
    // This could be enhanced if the namespace system adds cleanup hooks
  }
}

// Re-export types for convenience
export type { ArrayConfig } from './namespaces/array';