/**
 * SessionStorage Namespace Handler
 * 
 * Creates reactive sessionStorage management with automatic serialization.
 * Supports both reading from and writing to sessionStorage with reactive updates.
 */

import { Signal } from '../../core/signals';
import { processProperty } from '../../core/properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';
import { SessionStorageConfig } from '../../types';
import { 
  prepareForStorage, 
  restoreFromStorage,
  createStorageKey,
  isValidStorageKey 
} from '../../utils';

/**
 * Creates reactive sessionStorage signals
 */
export const createSessionStorageNamespace = createNamespaceHandler(
  (config: any, key: string): config is SessionStorageConfig =>
    validateNamespaceConfig(config, key, ['key']) &&
    config.prototype === 'SessionStorage',
  
  (config: SessionStorageConfig, key: string, element: any) => {
    // Resolve the storage key and initial value
    const processedKey = processProperty('key', config.key, element);
    const processedValue = config.value ? processProperty('value', config.value, element) : null;
    
    // Create a reactive signal that manages sessionStorage
    const sessionStorageSignal = new Signal.State((() => {
      try {
        if (!processedKey.isValid || !processedKey.value) {
          console.warn(`Invalid sessionStorage key for ${key}`);
          return null;
        }

        // Get existing value from sessionStorage
        const existingValue = sessionStorage.getItem(processedKey.value);
        
        if (existingValue !== null) {
          // Parse existing value
          return restoreFromStorage(existingValue);
        } else if (processedValue) {
          // Use initial value if provided
          if (processedValue.isValid) {
            // Store the initial value
            sessionStorage.setItem(processedKey.value, prepareForStorage(processedValue.value));
            return processedValue.value;
          }
        }
        
        return null;
      } catch (error) {
        console.warn(`SessionStorage initialization failed for ${key}:`, error);
        return null;
      }
    })());

    // Override the set method to automatically save to sessionStorage
    const originalSet = sessionStorageSignal.set.bind(sessionStorageSignal);
    sessionStorageSignal.set = (newValue: any) => {
      try {
        if (processedKey.isValid && processedKey.value) {
          // Save to sessionStorage
          sessionStorage.setItem(processedKey.value, prepareForStorage(newValue));
          
          // Update the signal
          originalSet(newValue);
        }
      } catch (error) {
        console.warn(`SessionStorage save failed for ${key}:`, error);
      }
    };

    // Add a clear method for convenience
    (sessionStorageSignal as any).clear = () => {
      try {
        if (processedKey.isValid && processedKey.value) {
          sessionStorage.removeItem(processedKey.value);
          originalSet(null);
        }
      } catch (error) {
        console.warn(`SessionStorage clear failed for ${key}:`, error);
      }
    };

    // Add a refresh method to reload from sessionStorage
    (sessionStorageSignal as any).refresh = () => {
      try {
        if (processedKey.isValid && processedKey.value) {
          const currentValue = sessionStorage.getItem(processedKey.value);
          const parsedValue = restoreFromStorage(currentValue);
          originalSet(parsedValue);
        }
      } catch (error) {
        console.warn(`SessionStorage refresh failed for ${key}:`, error);
      }
    };

    return sessionStorageSignal;
  }
);