/**
 * FormData Namespace Handler
 * 
 * Creates reactive FormData objects from declarative configuration with automatic
 * rebuilding when form field values change. Enables dynamic form data management
 * with full integration into DDOM's reactive property system.
 * 
 * @example
 * ```typescript
 * // Create reactive form data
 * const userName = new Signal.State('');
 * const userEmail = new Signal.State('');
 * adoptNode({
 *   formData: {
 *     prototype: 'FormData',
 *     name: '${this.userName}',
 *     email: '${this.userEmail}',
 *     timestamp: new Date().toISOString()
 *   },
 *   userName: userName,
 *   userEmail: userEmail
 * }, element);
 * 
 * // FormData automatically updates when signals change
 * userName.set('john_doe');
 * ```
 * 
 * @module namespaces/form-data
 */

import { Signal } from '../core/signals';
import { processProperty } from '../core/properties';
import { PrototypeConfig } from './types';

/**
 * FormDataConfig Type Definition
 * Local configuration interface for FormData namespace
 */
export interface FormDataConfig extends PrototypeConfig {
  prototype: 'FormData';
  [key: string]: any; // Form field values
}

/**
 * FormDataSignal Type Definition
 * A Signal.Computed for reactive FormData objects.
 * Automatically rebuilds FormData when source properties change.
 */
export interface FormDataSignal extends Signal.Computed<FormData> {
  // Inherits all Signal.Computed methods
}

/**
 * Creates a reactive FormData namespace that rebuilds when configuration changes.
 * Processes all form field values through the DDOM property system, enabling
 * reactive form data that automatically updates when dependencies change.
 * 
 * @param config - The validated FormData configuration object
 * @param key - The property name being processed (for debugging)
 * @param element - The element context for property resolution
 * @returns A computed signal containing the reactive FormData object
 * 
 * @example
 * ```typescript
 * const formSignal = createFormDataNamespace({
 *   prototype: 'FormData',
 *   username: '${this.user}',
 *   action: 'submit'
 * }, 'submitData', element);
 * 
 * const formData = formSignal.get();
 * console.log(formData.get('username'));
 * ```
 */
export const createFormDataNamespace = (
  config: FormDataConfig,
  key: string,
  element: any
): FormDataSignal => {
  // Config is already validated by the main namespace index

  // Create computed signal that builds the FormData
  const computedFormData = new Signal.Computed(() => {
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
};
