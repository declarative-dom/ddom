/**
 * LocalStorage Namespace Handler
 * 
 * Creates reactive localStorage management with automatic serialization.
 * Supports both reading from and writing to localStorage with reactive updates.
 */

import { Signal } from '../../signals';
import { resolvePropertyValue, evaluatePropertyValue } from '../../properties';
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
    const resolvedKey = resolvePropertyValue('key', config.key, element);
    const resolvedValue = config.value ? resolvePropertyValue('value', config.value, element) : null;
    
    // Create a reactive signal that manages localStorage
    const localStorageSignal = new Signal.State((() => {
      try {
        const { value: finalKey, isValid: keyValid } = evaluatePropertyValue(resolvedKey);
        if (!keyValid || !finalKey) {
          console.warn(`Invalid localStorage key for ${key}`);
          return null;
        }

        // Get existing value from localStorage
        const existingValue = localStorage.getItem(finalKey);
        
        if (existingValue !== null) {
          // Parse existing value
          return restoreFromStorage(existingValue);
        } else if (resolvedValue) {
          // Use initial value if provided
          const { value: initialValue, isValid: valueValid } = evaluatePropertyValue(resolvedValue);
          if (valueValid) {
            // Store the initial value
            localStorage.setItem(finalKey, prepareForStorage(initialValue));
            return initialValue;
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
        const { value: finalKey, isValid } = evaluatePropertyValue(resolvedKey);
        if (isValid && finalKey) {
          // Save to localStorage
          localStorage.setItem(finalKey, prepareForStorage(newValue));
          
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
        const { value: finalKey, isValid } = evaluatePropertyValue(resolvedKey);
        if (isValid && finalKey) {
          localStorage.removeItem(finalKey);
          originalSet(null);
        }
      } catch (error) {
        console.warn(`LocalStorage clear failed for ${key}:`, error);
      }
    };

    // Add a refresh method to reload from localStorage
    (localStorageSignal as any).refresh = () => {
      try {
        const { value: finalKey, isValid } = evaluatePropertyValue(resolvedKey);
        if (isValid && finalKey) {
          const currentValue = localStorage.getItem(finalKey);
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
