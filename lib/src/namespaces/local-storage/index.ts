/**
 * LocalStorage Namespace Handler
 * 
 * Creates reactive localStorage management with automatic serialization.
 * Supports both reading from and writing to localStorage with reactive updates.
 */

import { Signal } from '../../core/signals';
import { processProperty } from '../../core/properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';
import { LocalStorageConfig } from '../../types';
import { 
  prepareForStorage, 
  restoreFromStorage,
  createStorageKey,
  isValidStorageKey 
} from '../../utils';

/**
 * Creates reactive localStorage signals
 */
export const createLocalStorageNamespace = createNamespaceHandler(
  (config: any, key: string): config is LocalStorageConfig =>
    validateNamespaceConfig(config, key, ['key']) &&
    config.prototype === 'LocalStorage',
  
  (config: LocalStorageConfig, key: string, element: any) => {
    // Resolve the storage key and initial value
    const processedKey = processProperty('key', config.key, element);
    const processedValue = config.value ? processProperty('value', config.value, element) : null;
    
    // Create a reactive signal that manages localStorage
    const localStorageSignal = new Signal.State((() => {
      try {
        if (!processedKey.isValid || !processedKey.value) {
          console.warn(`Invalid localStorage key for ${key}`);
          return null;
        }

        // Get existing value from localStorage
        const existingValue = localStorage.getItem(processedKey.value);
        
        if (existingValue !== null) {
          // Parse existing value
          return restoreFromStorage(existingValue);
        } else if (processedValue) {
          // Use initial value if provided
          if (processedValue.isValid) {
            // Store the initial value
            localStorage.setItem(processedKey.value, prepareForStorage(processedValue.value));
            return processedValue.value;
          }
        }
        
        return null;
      } catch (error) {
        console.warn(`LocalStorage initialization failed for ${key}:`, error);
        return null;
      }
    })());

    // Override the set method to automatically save to localStorage
    const originalSet = localStorageSignal.set.bind(localStorageSignal);
    localStorageSignal.set = (newValue: any) => {
      try {
        if (processedKey.isValid && processedKey.value) {
          // Save to localStorage
          localStorage.setItem(processedKey.value, prepareForStorage(newValue));
          
          // Update the signal
          originalSet(newValue);
        }
      } catch (error) {
        console.warn(`LocalStorage save failed for ${key}:`, error);
      }
    };

    // Add a clear method for convenience
    (localStorageSignal as any).clear = () => {
      try {
        if (processedKey.isValid && processedKey.value) {
          localStorage.removeItem(processedKey.value);
          originalSet(null);
        }
      } catch (error) {
        console.warn(`LocalStorage clear failed for ${key}:`, error);
      }
    };

    // Add a refresh method to reload from localStorage
    (localStorageSignal as any).refresh = () => {
      try {
        if (processedKey.isValid && processedKey.value) {
          const currentValue = localStorage.getItem(processedKey.value);
          const parsedValue = restoreFromStorage(currentValue);
          originalSet(parsedValue);
        }
      } catch (error) {
        console.warn(`LocalStorage refresh failed for ${key}:`, error);
      }
    };

    return localStorageSignal;
  }
);
