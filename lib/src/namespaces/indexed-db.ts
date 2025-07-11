/**
 * IndexedDB Namespace Handler
 * 
 * Creates IDBObjectStore for direct database operations.
 * This is SETUP MODE only - initializes the database and returns the store.
 * For reactive queries, use the IDBRequest namespace.
 */

import { Signal } from '../core/signals';
import { processProperty } from '../core/properties';
import { PrototypeConfig } from '../types';

/**
 * IndexedDBIndexConfig Type Definition
 * Configuration for creating indexes on IndexedDB object stores.
 */
export interface IndexedDBIndexConfig extends IDBIndexParameters {
  name: string;
  keyPath: string | string[];
}

/**
 * IndexedDBConfig Type Definition
 * Local configuration interface for IndexedDB namespace - SETUP MODE ONLY
 */
export interface IndexedDBConfig extends PrototypeConfig {
  prototype: 'IndexedDB';
  database: string;
  store: string;
  version?: number;
  keyPath?: string | string[];
  autoIncrement?: boolean;
  indexes?: IndexedDBIndexConfig[];
  value?: any[]; // Initial data to populate
}

/**
 * IndexedDBStoreFactory - Interface for creating fresh database transactions
 */
export interface IndexedDBStoreFactory {
  getStore(mode?: IDBTransactionMode): Promise<IDBObjectStore>;
  database: string;
  store: string;
  version: number;
  isReady: boolean;
}

/**
 * Creates IndexedDB namespace - Returns store factory for database operations
 * This is SETUP MODE only - creates and initializes the database
 */
export const createIndexedDBNamespace = (
  config: IndexedDBConfig,
  key: string,
  _element: any
): Signal.State<IndexedDBStoreFactory | null> => {
  // Check if IndexedDB is available
  if (typeof indexedDB === 'undefined') {
    console.warn(`IndexedDB not available for ${key}`);
    return new Signal.State<IndexedDBStoreFactory | null>(null);
  }

  const signal = new Signal.State<IndexedDBStoreFactory | null>(null);
  
  // Initialize database and set up the store factory
  initializeDatabase(config, key).then(factory => {
    signal.set(factory);
  }).catch(error => {
    console.error(`IndexedDB setup failed for ${key}:`, error);
    signal.set(null);
  });
  
  return signal;
};

/**
 * Helper function to initialize database with initial data and return store factory
 */
async function initializeDatabase(config: IndexedDBConfig, key: string): Promise<IndexedDBStoreFactory> {
  const processedDatabase = processProperty('database', config.database, null);
  const processedStore = processProperty('store', config.store, null);
  
  if (!processedDatabase.isValid || !processedStore.isValid || !processedDatabase.value || !processedStore.value) {
    throw new Error(`Invalid IndexedDB configuration for ${key}`);
  }

  const dbName = processedDatabase.value;
  const storeName = processedStore.value;
  const version = config.version || 1;

  // Open/create the database
  const db = await openDatabase(dbName, version, config);
  
  // Populate initial data if provided and store is empty
  if (config.value && Array.isArray(config.value)) {
    const writeTransaction = db.transaction([storeName], 'readwrite');
    const writeStore = writeTransaction.objectStore(storeName);
    
    // Check if store is empty
    const countRequest = writeStore.count();
    const count = await new Promise<number>((resolve, reject) => {
      countRequest.onsuccess = () => resolve(countRequest.result);
      countRequest.onerror = () => reject(countRequest.error);
    });

    // Only populate if store is empty
    if (count === 0) {
      for (const item of config.value) {
        const addRequest = writeStore.add(item);
        await new Promise((resolve, reject) => {
          addRequest.onsuccess = () => resolve(addRequest.result);
          addRequest.onerror = () => reject(addRequest.error);
        });
      }
      
      // Wait for transaction to complete
      await new Promise((resolve, reject) => {
        writeTransaction.oncomplete = () => resolve(undefined);
        writeTransaction.onerror = () => reject(writeTransaction.error);
      });
    }
  }
  
  // Close the initialization database connection
  db.close();
  
  // Return factory that creates fresh connections on-demand
  return {
    getStore: async (mode: IDBTransactionMode = 'readonly') => {
      const freshDb = await openDatabase(dbName, version, config);
      const transaction = freshDb.transaction([storeName], mode);
      return transaction.objectStore(storeName);
    },
    database: dbName,
    store: storeName,
    version: version,
    isReady: true
  };
}

/**
 * Helper function to open IndexedDB database
 */
async function openDatabase(dbName: string, version: number, config: IndexedDBConfig): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(config.store)) {
        const storeOptions: IDBObjectStoreParameters = {};
        if (config.keyPath) storeOptions.keyPath = config.keyPath;
        if (config.autoIncrement !== undefined) storeOptions.autoIncrement = config.autoIncrement;
        
        const store = db.createObjectStore(config.store, storeOptions);
        
        // Create indexes if specified
        if (config.indexes) {
          for (const indexConfig of config.indexes) {
            const indexOptions: IDBIndexParameters = {};
            if (indexConfig.unique !== undefined) indexOptions.unique = indexConfig.unique;
            if (indexConfig.multiEntry !== undefined) indexOptions.multiEntry = indexConfig.multiEntry;
            
            store.createIndex(indexConfig.name, indexConfig.keyPath, indexOptions);
          }
        }
      }
    };
  });
}
