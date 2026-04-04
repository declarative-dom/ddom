/**
 * Object Namespace Handler
 * 
 * Handler for Object prototype that supports declarative key-value pair resolution.
 * Useful for dynamic style objects and other property expansion scenarios.
 */

import { Signal } from '../core/signals';
import { resolveOperand, getValue } from '../core/evaluation';
import { isSignal } from '../utils/detection';
import { PrototypeConfig } from './types';

/**
 * ObjectConfig Type Definition
 * Configuration interface for Object namespace
 */
export interface ObjectConfig extends PrototypeConfig {
  prototype: 'Object';
  entries: string | object; // Property accessor or static object
}

/**
 * Resolves source signal/value from different input types
 */
function resolveSourceValue(entries: ObjectConfig["entries"], parentElement?: Element): any | Signal.State<any> | Signal.Computed<any> {
  if (typeof entries === 'string') {
    // Handle property accessor resolution
    const resolved = resolveOperand(entries, parentElement || document.body);
    
    if (typeof resolved === 'function') {
      return new Signal.Computed(resolved as () => any);
    }
    return resolved;
  } else if (isSignal(entries)) {
    // If it's already a signal, return it directly
    return entries;
  } else if (typeof entries === 'object' && entries !== null) {
    // Static object
    return entries;
  } else {
    throw new Error('ObjectNamespace entries must be an object, Signal, or property accessor string');
  }
}

/**
 * Creates a reactive Object with dynamic key-value pairs
 */
export const createObjectNamespace = (
  config: ObjectConfig,
  _key: string,
  element: any
): Signal.Computed<any> | any => {
  // Resolve the source value
  const sourceValue = resolveSourceValue(config.entries, element);
  
  // If it's already a static object, return it directly
  if (!isSignal(sourceValue)) {
    return sourceValue || {};
  }
  
  // Create computed signal that processes the object
  return new Signal.Computed(() => {
    const source = getValue(sourceValue);
    
    if (!source || typeof source !== 'object') {
      console.warn('ObjectNamespace: Source does not contain an object:', source);
      return {};
    }
    
    // Return a shallow copy to prevent mutations
    return { ...source };
  });
};
