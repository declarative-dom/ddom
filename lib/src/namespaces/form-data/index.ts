/**
 * FormData Namespace Handler
 * 
 * Creates reactive FormData objects from configuration.
 * Focused solely on FormData - each Web API gets its own namespace.
 */

import { Signal } from '../../core/signals';
import { resolvePropertyValue, evaluatePropertyValue } from '../../core/properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';

/**
 * Configuration interface for FormData
 */
interface FormDataConfig extends PrototypeConfig {
  prototype: 'FormData';
  [key: string]: any; // Form field values
}

/**
 * Creates reactive FormData objects
 */
export const createFormDataNamespace = createNamespaceHandler(
  (config: any, key: string): config is FormDataConfig =>
    validateNamespaceConfig(config, key) &&
    config.prototype === 'FormData',
  
  (config: FormDataConfig, key: string, element: any) => {
    // Create computed signal that builds the FormData
    const computedFormData = new Signal.Computed(() => {
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
      
      // Build FormData directly
      const formData = new FormData();
      
      Object.entries(resolvedConfig).forEach(([key, value]) => {
        if (key === 'prototype') return; // Skip prototype property
        
        if (value != null) {
          if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });
      
      return formData;
    });
    
    return computedFormData;
  }
);
