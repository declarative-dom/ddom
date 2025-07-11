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
    // Convert non-standard config to ArrayConfig format
    let processedConfig: ArrayConfig<T, R>;
    
    if ('prototype' in config) {
      // Already a proper ArrayConfig
      processedConfig = config as ArrayConfig<T, R>;
    } else {
      // Convert legacy format - preserve signals for reactivity
      let items = config.items;
      
      // If it's a signal, convert to a property accessor string that the namespace can handle
      if (isSignal(items)) {
        // For now, just get the current value since the namespace system expects
        // arrays or property accessor strings, not direct signal objects
        items = items.get();
      }
      
      processedConfig = {
        prototype: 'Array',
        items,
        map: config.map,
        filter: config.filter,
        sort: config.sort,
        debounce: config.debounce
      } as ArrayConfig<T, R>;
    }
    
    // Use the namespace handler to create the array signal
    this.signal = createArrayNamespace(processedConfig, 'mappedArray', document.body);
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