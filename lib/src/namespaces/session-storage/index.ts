/**
 * SessionStorage Namespace Handler
 * 
 * Creates reactive sessionStorage management with automatic serialization.
 * Supports both reading from and writing to sessionStorage with reactive updates.
 */

import { Signal } from '../../core/signals';
import { resolvePropertyValue, evaluatePropertyValue } from '../../core/properties';
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
    const resolvedKey = resolvePropertyValue('key', config.key, element);
    const resolvedValue = config.value ? resolvePropertyValue('value', config.value, element) : null;
    
    // Create a reactive signal that manages sessionStorage
    const sessionStorageSignal = new Signal.State((() => {
      try {
        const { value: finalKey, isValid: keyValid } = evaluatePropertyValue(resolvedKey);
        if (!keyValid || !finalKey) {
          console.warn(`Invalid sessionStorage key for ${key}`);
          return null;
        }

        // Get existing value from sessionStorage
        const existingValue = sessionStorage.getItem(finalKey);
        
        if (existingValue !== null) {
          // Parse existing value
          return restoreFromStorage(existingValue);
        } else if (resolvedValue) {
          // Use initial value if provided
          const { value: initialValue, isValid: valueValid } = evaluatePropertyValue(resolvedValue);
          if (valueValid) {
            // Store the initial value
            sessionStorage.setItem(finalKey, prepareForStorage(initialValue));
            return initialValue;
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
        const { value: finalKey, isValid } = evaluatePropertyValue(resolvedKey);
        if (isValid && finalKey) {
          // Save to sessionStorage
          sessionStorage.setItem(finalKey, prepareForStorage(newValue));
          
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
        const { value: finalKey, isValid } = evaluatePropertyValue(resolvedKey);
        if (isValid && finalKey) {
          sessionStorage.removeItem(finalKey);
          originalSet(null);
        }
      } catch (error) {
        console.warn(`SessionStorage clear failed for ${key}:`, error);
      }
    };

    // Add a refresh method to reload from sessionStorage
    (sessionStorageSignal as any).refresh = () => {
      try {
        const { value: finalKey, isValid } = evaluatePropertyValue(resolvedKey);
        if (isValid && finalKey) {
          const currentValue = sessionStorage.getItem(finalKey);
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