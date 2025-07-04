/**
 * URLSearchParams Namespace Handler
 * 
 * Creates reactive URLSearchParams objects from configuration.
 */

import { Signal } from '../../core/signals';
import { resolvePropertyValue, evaluatePropertyValue } from '../../core/properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';

/**
 * URLSearchParams configuration interface
 */
interface URLSearchParamsConfig extends PrototypeConfig {
  prototype: 'URLSearchParams';
  [key: string]: any;
}
import { buildURLSearchParams } from './builder';

/**
 * Creates reactive URLSearchParams objects
 */
export const createURLSearchParamsNamespace = createNamespaceHandler(
  (config: any, key: string): config is URLSearchParamsConfig =>
    validateNamespaceConfig(config, key),
  
  (config: URLSearchParamsConfig, key: string, element: any) => {
    // Create computed signal that builds the URLSearchParams
    const computedParams = new Signal.Computed(() => {
      // Resolve all config properties
      const resolvedConfig: any = {};
      
      Object.entries(config).forEach(([configKey, configValue]) => {
        if (configKey === 'prototype') {
          resolvedConfig[configKey] = configValue;
          return;
        }
        
        const resolved = resolvePropertyValue(configKey, configValue, element);
        const { value, isValid } = evaluatePropertyValue(resolved);
        
        if (isValid) {
          resolvedConfig[configKey] = value;
        }
      });
      
      return buildURLSearchParams(resolvedConfig);
    });
    
    return computedParams;
  }
);
