/**
 * URLSearchParams Namespace Handler
 * 
 * Creates reactive URLSearchParams objects from configuration.
 */

import { Signal } from '../core/signals';
import { processProperty } from '../core/properties';
import { PrototypeConfig } from './types';

/**
 * URLSearchParamsConfig Type Definition
 * Local configuration interface for URLSearchParams namespace
 */
export interface URLSearchParamsConfig extends PrototypeConfig {
  prototype: 'URLSearchParams';
  [key: string]: any;
}

/**
 * URLSearchParamsSignal Type Definition
 * A Signal.Computed for reactive URLSearchParams objects.
 * Automatically rebuilds URLSearchParams when source properties change.
 */
export interface URLSearchParamsSignal extends Signal.Computed<URLSearchParams> {
  // Inherits all Signal.Computed methods
}

/**
 * Creates reactive URLSearchParams objects
 */
export const createURLSearchParamsNamespace = (
  config: URLSearchParamsConfig,
  key: string,
  element: any
): URLSearchParamsSignal => {
  // Config is already validated by the main namespace index

  // Create computed signal that builds the URLSearchParams
  const computedParams = new Signal.Computed(() => {
    // Resolve all config properties
    const resolvedConfig: any = {};
    
    Object.entries(config).forEach(([configKey, configValue]) => {
      if (configKey === 'prototype') {
        resolvedConfig[configKey] = configValue;
        return;
      }
      
      const processed = processProperty(configKey, configValue, element);
      
      if (processed.isValid) {
        resolvedConfig[configKey] = processed.value;
      }
    });
    
    return buildURLSearchParams(resolvedConfig);
  });
  
  return computedParams;
};


/**
 * Builds a URLSearchParams object from configuration
 */
export function buildURLSearchParams(config: any): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(config).forEach(([key, value]) => {
    if (key === 'prototype') return;
    
    if (Array.isArray(value)) {
      // Add multiple values for the same key
      value.forEach(item => {
        if (item != null) {
          params.append(key, String(item));
        }
      });
    } else if (value != null) {
      // Add single value
      params.set(key, String(value));
    }
  });
  
  return params;
}
