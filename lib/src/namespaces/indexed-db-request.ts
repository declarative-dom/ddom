/**
 * IDBRequest Namespace Handler
 * 
 * Creates reactive signals for IndexedDB query operations.
 * Works like the Request namespace but for local database operations.
 * References IDBObjectStore instances created by the IndexedDB namespace.
 */

import { Signal, createEffect, ComponentSignalWatcher } from '../core/signals';
import { resolveConfig } from '.';
import { PrototypeConfig, FilterCriteria, SortCriteria } from '../types';
import { resolveExpression, resolveOperand, evaluateComparison } from '../core/evaluation';
import { IndexedDBStoreFactory } from './indexed-db';

/**
 * IDBRequestConfig Type Definition
 * Configuration for IDBRequest namespace - reactive query operations
 */
export interface IDBRequestConfig extends PrototypeConfig {
  prototype: 'IDBRequest';
  objectStore: string;          // Reference to IndexedDBStoreFactory signal (e.g., "this.$allProducts")
  operation?: 'getAll' | 'get' | 'count' | 'getAllKeys' | 'getKey' | 'add' | 'put' | 'delete' | 'clear';
  index?: string;              // Index name to use for the operation
  query?: any;                 // IDBKeyRange, key value, or function that returns them
  key?: any;                   // Key for delete operations
  value?: any;                 // Value for add/put operations
  debounce?: number;           // Debounce delay in milliseconds (like Request namespace)
  filter?: FilterCriteria<any>[]; // Client-side filtering after database query
  sort?: SortCriteria<any>[];     // Client-side sorting after filtering
  limit?: number;              // Limit results (applied after filtering/sorting)
  manual?: boolean;            // Manual refresh control (default: false)
  isValid?: () => boolean;     // Validation function to determine when to execute
  onsuccess?: () => void;      // Callback after successful operation
  onerror?: (error: any) => void; // Callback after failed operation
}

/**
 * Enhanced signal interface for IDBRequest with loading states
 */
export interface IDBRequestSignal<T = any> extends Signal.State<T[]> {
  refresh(): Promise<void>;
  readonly loading: Signal.State<boolean>;
  readonly error: Signal.State<string | null>;
}

/**
 * Creates IDBRequest namespace - Returns reactive Signal for database queries
 * Works like Request namespace but for IndexedDB operations
 */
export const createIDBRequestNamespace = (
  config: IDBRequestConfig,
  key: string,
  element: any
): IDBRequestSignal => {
  // Check if IndexedDB is available
  if (typeof indexedDB === 'undefined') {
    console.warn(`IndexedDB not available for ${key}`);
    const emptySignal = new Signal.State<any[]>([]);
    const loadingSignal = new Signal.State<boolean>(false);
    const errorSignal = new Signal.State<string | null>('IndexedDB not available');
    
    return Object.assign(emptySignal, {
      refresh: async () => {},
      loading: loadingSignal,
      error: errorSignal
    }) as IDBRequestSignal;
  }

  const dataSignal = new Signal.State<any[]>([]);
  const loadingSignal = new Signal.State<boolean>(false);
  const errorSignal = new Signal.State<string | null>(null);
  
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  
  const context = {
    window: globalThis.window,
    document: globalThis.document,
    this: element
  };

  // Enhanced signal with refresh method and loading/error states
  const enhancedSignal = Object.assign(dataSignal, {
    refresh: refreshData,
    loading: loadingSignal,
    error: errorSignal
  }) as IDBRequestSignal;

  // Determine if this is a write operation
  const isWriteOperation = ['add', 'put', 'delete', 'clear'].includes(config.operation || 'getAll');
  
  async function refreshData(): Promise<void> {
    try {
      loadingSignal.set(true);
      errorSignal.set(null);
      
      // Use resolveConfig to handle validation and reactive dependencies
      const { value: resolvedConfig, isValid } = resolveConfig(config, element);
      
      if (!resolvedConfig || !isValid) {
        loadingSignal.set(false);
        return; // Don't execute if config is invalid
      }
      
      // Check validation function if provided (additional validation)
      if (resolvedConfig.isValid && !resolvedConfig.isValid.call(element)) {
        loadingSignal.set(false);
        return; // Don't execute if not valid
      }
      
      // Resolve objectStore reference using evaluation system
      const objectStoreSignal = resolveOperand(resolvedConfig.objectStore, element, context);
      
      // Extract the store factory from the signal
      let storeFactory: IndexedDBStoreFactory;
      if (objectStoreSignal && typeof objectStoreSignal.get === 'function') {
        // It's a Signal containing the store factory
        storeFactory = objectStoreSignal.get();
      } else {
        // It might be the store factory directly
        storeFactory = objectStoreSignal;
      }
      
      if (!storeFactory) {
        throw new Error(`ObjectStore reference not found: ${resolvedConfig.objectStore}`);
      }
      
      // Check if we have a valid store factory
      if (!storeFactory.getStore || typeof storeFactory.getStore !== 'function') {
        throw new Error(`Invalid store factory. Expected IndexedDBStoreFactory with getStore method.`);
      }
      
      // Get a fresh store with appropriate transaction mode
      const mode = isWriteOperation ? 'readwrite' : 'readonly';
      const store = await storeFactory.getStore(mode);
      
      // Execute database operation
      const results = await executeOperation(store, resolvedConfig, context);
      
      // For read operations, apply client-side filtering and sorting
      if (!isWriteOperation) {
        const processedResults = await processResults(results, resolvedConfig, context);
        dataSignal.set(processedResults);
      } else {
        // For write operations, call success callback
        if (resolvedConfig.onsuccess) {
          resolvedConfig.onsuccess.call(element);
        }
      }
    } catch (error) {
      console.error(`IDBRequest ${key} failed:`, error);
      errorSignal.set(error instanceof Error ? error.message : String(error));
      
      if (!isWriteOperation) {
        dataSignal.set([]);
      }
      
      // Call error callback if provided
      if (config.onerror) {
        config.onerror.call(element, error);
      }
    } finally {
      loadingSignal.set(false);
    }
  }

  function debouncedRefresh(): void {
    if (config.debounce && config.debounce > 0) {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(refreshData, config.debounce);
    } else {
      refreshData();
    }
  }

  // Auto-refresh setup (similar to Request namespace)
  if (!config.manual) {
    // Use createEffect like Request namespace to handle reactive dependencies
    const componentWatcher = (globalThis as any).__ddom_component_watcher as
      | ComponentSignalWatcher
      | undefined;

    const cleanup = createEffect(() => {
      try {
        // Reactively resolve config - this will create dependencies on signals
        const { value: resolvedConfig, isValid } = resolveConfig(config, element);

        if (!resolvedConfig || !isValid) {
          // Don't execute if config is invalid
          return;
        }

        // Clear existing debounce timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Execute with debounce if specified
        if (resolvedConfig.debounce && resolvedConfig.debounce > 0) {
          debounceTimer = setTimeout(() => {
            refreshData();
          }, resolvedConfig.debounce);
        } else {
          refreshData();
        }
      } catch {
        // If there's an error resolving config, don't execute
        return;
      }
    }, componentWatcher);

    // Auto-cleanup with AbortController if available
    const signal = (globalThis as any).__ddom_abort_signal;
    if (signal && !signal.aborted) {
      signal.addEventListener('abort', cleanup, { once: true });
    }
  }

  // Initial load
  debouncedRefresh();
  
  return enhancedSignal;
};

/**
 * Execute database operation on the IDBObjectStore
 */
async function executeOperation(store: IDBObjectStore, config: IDBRequestConfig, context: any): Promise<any[]> {
  return new Promise((resolve, reject) => {
    let request: IDBRequest;
    
    // Get the source (store or index) for read operations
    const source = config.index ? store.index(config.index) : store;
    
    // Resolve parameters
    let query = config.query;
    if (typeof config.query === 'function') {
      query = config.query();
    } else if (typeof config.query === 'string') {
      query = resolveExpression(config.query, context);
    }
    
    let key = config.key;
    if (typeof config.key === 'function') {
      key = config.key();
    } else if (typeof config.key === 'string') {
      key = resolveExpression(config.key, context);
    }
    
    let value = config.value;
    if (typeof config.value === 'function') {
      value = config.value();
    } else if (typeof config.value === 'string') {
      value = resolveExpression(config.value, context);
    }
    
    // Execute the operation
    switch (config.operation || 'getAll') {
      // Read operations
      case 'getAll':
        request = source.getAll(query);
        break;
      case 'get':
        request = source.get(query);
        break;
      case 'count':
        request = source.count(query);
        break;
      case 'getAllKeys':
        request = source.getAllKeys(query);
        break;
      case 'getKey':
        request = source.getKey(query);
        break;
      
      // Write operations (use store directly, not index)
      case 'add':
        if (value === null || value === undefined) {
          reject(new Error('Value is required for add operation'));
          return;
        }
        request = store.add(value, key);
        break;
      case 'put':
        if (value === null || value === undefined) {
          reject(new Error('Value is required for put operation'));
          return;
        }
        request = store.put(value, key);
        break;
      case 'delete':
        if (key === null || key === undefined) {
          reject(new Error('Key is required for delete operation'));
          return;
        }
        request = store.delete(key);
        break;
      case 'clear':
        request = store.clear();
        break;
        
      default:
        throw new Error(`Unsupported operation: ${config.operation}`);
    }
    
    request.onsuccess = () => {
      const result = request.result;
      
      // For write operations, return empty array (they don't return data)
      if (['add', 'put', 'delete', 'clear'].includes(config.operation || 'getAll')) {
        resolve([]);
        return;
      }
      
      // For read operations, ensure we always return an array for consistency
      if (config.operation === 'count') {
        resolve([{ count: result }]);
      } else if (Array.isArray(result)) {
        resolve(result);
      } else if (result !== undefined && result !== null) {
        resolve([result]);
      } else {
        resolve([]);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

/**
 * Process results with client-side filtering and sorting using evaluation module
 */
async function processResults(results: any[], config: IDBRequestConfig, context: any): Promise<any[]> {
  let processedResults = [...results];
  
  // Apply client-side filtering using evaluation module
  if (config.filter && config.filter.length > 0) {
    processedResults = processedResults.filter(item => {
      return config.filter!.every(filterConfig => {
        try {
          // Create item context for evaluation
          const itemContext = {
            ...context,
            item
          };
          
          // Resolve operands using evaluation module
          const leftValue = resolveOperand(filterConfig.leftOperand, item, itemContext);
          const rightValue = resolveOperand(filterConfig.rightOperand, item, itemContext);
          
          // Create comparison expression and evaluate
          const comparisonExpr = `leftValue ${filterConfig.operator} rightValue`;
          const comparisonContext = { leftValue, rightValue };
          
          return evaluateComparison(comparisonExpr, comparisonContext) === true;
        } catch (error) {
          console.warn('Filter evaluation failed:', error);
          return false;
        }
      });
    });
  }
  
  // Apply client-side sorting using evaluation module
  if (config.sort && config.sort.length > 0) {
    processedResults = processedResults.sort((a, b) => {
      for (const sortConfig of config.sort!) {
        try {
          // Create contexts for both items
          const contextA = { ...context, item: a };
          const contextB = { ...context, item: b };
          
          // Resolve sort field values - support multiple property name formats
          const fieldName = (sortConfig as any).field || (sortConfig as any).property || (sortConfig as any).key;
          const valueA = resolveOperand(fieldName, a, contextA);
          const valueB = resolveOperand(fieldName, b, contextB);
          
          // Compare values
          let comparison = 0;
          if (valueA < valueB) comparison = -1;
          else if (valueA > valueB) comparison = 1;
          
          // Apply sort direction
          if (sortConfig.direction === 'desc') comparison *= -1;
          
          // Return first non-zero comparison
          if (comparison !== 0) return comparison;
        } catch (error) {
          console.warn('Sort evaluation failed:', error);
        }
      }
      
      return 0;
    });
  }
  
  // Apply limit if specified
  if (config.limit && config.limit > 0) {
    processedResults = processedResults.slice(0, config.limit);
  }
  
  return processedResults;
}