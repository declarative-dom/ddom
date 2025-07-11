/**
 * Storage Namespace Handler
 * 
 * Unified handler for Web Storage API types including:
 * LocalStorage, SessionStorage
 * 
 * Creates reactive storage management with automatic serialization.
 * Supports both reading from and writing to storage with reactive updates.
 */

import { Signal } from '../core/signals';
import { SerializableValue } from '../utils';
import { processProperty } from '../core/properties';
import type { PrototypeConfig } from './types';
import { 
  serialize, 
  deserialize,
} from '../utils';

/**
 * StorageConfig Type Definition
 * Local configuration interface for Storage namespace
 */
export interface StorageConfig extends PrototypeConfig {
  prototype: 'LocalStorage' | 'SessionStorage';
  key: string;
  value?: any;
  prefix?: string;
}

/**
 * Map of prototype names to their storage implementations
 */
const STORAGE_IMPLEMENTATIONS = {
  'LocalStorage': localStorage,
  'SessionStorage': sessionStorage,
} as const;

/**
 * StorageSignal Type Definition
 * A Signal.State for storage operations (localStorage, sessionStorage, cookies).
 * Contains the deserialized value and automatically syncs with the underlying storage.
 */
export interface StorageSignal<T = SerializableValue> extends Signal.State<T> {
  clear(): void; // Clears the stored value
  get(): T; // Gets the current value from storage
  set(value: T): void; // Sets a new value in storage
  refresh(): void; // Refreshes the value from storage
  prototype: string; // The storage prototype (e.g., 'LocalStorage', 'SessionStorage', 'Cookie')  
}

/**
 * Creates a reactive storage signal with automatic serialization
 */
export const createStorageNamespace = (
  config: StorageConfig,
  key: string,
  element: any
): StorageSignal => {
  // Config is already validated by the main namespace index

  // Get the storage implementation for this prototype
  const storage = STORAGE_IMPLEMENTATIONS[config.prototype];
  
  // Resolve the storage key and initial value
  const processedKey = processProperty('key', config.key, element);
  const processedValue = processProperty('value', config.value, element);
  
  // Create a reactive signal that manages the storage
  const storageSignal = new Signal.State((() => {
    try {
      if (!processedKey.isValid || !processedKey.value) {
        console.warn(`Invalid ${config.prototype} key for ${key}`);
        return null;
      }

      // Get existing value from storage
      const existingValue = storage.getItem(processedKey.value);
      
      if (existingValue !== null) {
        // Parse existing value
        return deserialize(existingValue);
      } else if (processedValue) {
        // Use initial value if provided
        if (processedValue.isValid) {
          // Store the initial value
          storage.setItem(processedKey.value, serialize(processedValue.value));
          return processedValue.value;
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`${config.prototype} initialization failed for ${key}:`, error);
      return null;
    }
  })()) as StorageSignal;

  // Override the set method to automatically save to storage
  const originalSet = storageSignal.set.bind(storageSignal);
  storageSignal.set = (newValue: any) => {
    try {
      if (processedKey.isValid && processedKey.value) {
        // Save to storage
        storage.setItem(processedKey.value, serialize(newValue));
        
        // Update the signal
        originalSet(newValue);
      }
    } catch (error) {
      console.warn(`${config.prototype} save failed for ${key}:`, error);
    }
  };

  // Add a clear method for convenience
  storageSignal.clear = () => {
    try {
      if (processedKey.isValid && processedKey.value) {
        storage.removeItem(processedKey.value);
        originalSet(null);
      }
    } catch (error) {
      console.warn(`${config.prototype} clear failed for ${key}:`, error);
    }
  };

  // Add a refresh method to reload from storage
  storageSignal.refresh = () => {
    try {
      if (processedKey.isValid && processedKey.value) {
        const currentValue = storage.getItem(processedKey.value);
        const parsedValue = currentValue ? deserialize(currentValue) : null;
        originalSet(parsedValue);
      }
    } catch (error) {
      console.warn(`${config.prototype} refresh failed for ${key}:`, error);
    }
  };

  return storageSignal;
};
