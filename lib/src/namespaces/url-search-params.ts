/**
 * URLSearchParams Namespace Handler
 * 
 * Creates reactive URLSearchParams objects from declarative configuration with automatic
 * rebuilding when query parameters change. Enables dynamic URL parameter management
 * with full integration into DDOM's reactive property system.
 * 
 * @example
 * ```typescript
 * // Create reactive URL parameters
 * const searchTerm = new Signal.State('');
 * adoptNode({
 *   urlParams: {
 *     prototype: 'URLSearchParams',
 *     q: '${this.searchTerm}',
 *     page: 1,
 *     limit: 10
 *   },
 *   searchTerm: searchTerm
 * }, element);
 * 
 * // URLSearchParams automatically updates when searchTerm changes
 * searchTerm.set('new search');
 * ```
 * 
 * @module namespaces/url-search-params
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
 * Creates a reactive URLSearchParams namespace that rebuilds when configuration changes.
 * Processes all configuration properties through the DDOM property system, enabling
 * reactive query parameters that automatically update the URLSearchParams object.
 * 
 * @param config - The validated URLSearchParams configuration object
 * @param key - The property name being processed (for debugging)
 * @param element - The element context for property resolution
 * @returns A computed signal containing the reactive URLSearchParams object
 * 
 * @example
 * ```typescript
 * const paramsSignal = createURLSearchParamsNamespace({
 *   prototype: 'URLSearchParams',
 *   search: '${this.searchQuery}',
 *   category: 'products'
 * }, 'queryParams', element);
 * 
 * console.log(paramsSignal.get().toString()); // "search=...&category=products"
 * ```
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
