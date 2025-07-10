/**
 * IDBRequest Namespace Handler
 * 
 * Creates reactive signals for IndexedDB query operations.
 * Works like the Request namespace but for local database operations.
 * References IDBObjectStore instances created by the IndexedDB namespace.
 */

import { Signal } from '../../core/signals';
import { PrototypeConfig, FilterCriteria, SortCriteria } from '../types';
import { resolveTemplateProperty, resolveOperand, evaluateComparison } from '../../utils/evaluation';
import { IndexedDBStoreFactory } from './index';

/**
 * IDBRequestConfig Type Definition
 * Configuration for IDBRequest namespace - reactive query operations
 */
export interface IDBRequestConfig extends PrototypeConfig {
  prototype: 'IDBRequest';
  objectStore: string;          // Reference to IndexedDBStoreFactory signal (e.g., "this.$allProducts")
  operation?: 'getAll' | 'get' | 'count' | 'getAllKeys' | 'getKey';
  index?: string;              // Index name to use for the operation
  query?: any;                 // IDBKeyRange, key value, or function that returns them
  debounce?: number;           // Debounce delay in milliseconds (like Request namespace)
  filter?: FilterCriteria<any>[]; // Client-side filtering after database query
  sort?: SortCriteria<any>[];     // Client-side sorting after filtering
  limit?: number;              // Limit results (applied after filtering/sorting)
  manual?: boolean;            // Manual refresh control (default: false)
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
  let lastStoreFactory: IndexedDBStoreFactory | null = null;
  
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

  async function refreshData(): Promise<void> {
    try {
      loadingSignal.set(true);
      errorSignal.set(null);
      
      // Resolve objectStore reference using evaluation system
      const objectStoreRef = resolveTemplateProperty(context, config.objectStore);
      const storeFactory = objectStoreRef?.get?.() || objectStoreRef;
      
      if (!storeFactory) {
        throw new Error(`ObjectStore reference not found: ${config.objectStore}`);
      }
      
      // Check if we have a valid store factory
      if (!storeFactory.getStore || typeof storeFactory.getStore !== 'function') {
        throw new Error(`Invalid store factory. Expected IndexedDBStoreFactory with getStore method.`);
      }
      
      // Get a fresh store with appropriate transaction mode
      const store = await storeFactory.getStore('readonly');
      
      // Execute database operation
      const results = await executeOperation(store, config, context);
      
      // Apply client-side filtering and sorting using evaluation module
      const processedResults = await processResults(results, config, context);
      
      dataSignal.set(processedResults);
    } catch (error) {
      console.error(`IDBRequest ${key} failed:`, error);
      errorSignal.set(error instanceof Error ? error.message : String(error));
      dataSignal.set([]);
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
    // Watch for objectStore changes
    new Signal.Computed(() => {
      const objectStoreRef = resolveTemplateProperty(context, config.objectStore);
      const storeFactory = objectStoreRef?.get?.() || objectStoreRef;
      
      if (storeFactory !== lastStoreFactory) {
        lastStoreFactory = storeFactory;
        debouncedRefresh();
      }
    });
    
    // Watch for query parameter changes if query is a string expression
    if (typeof config.query === 'string') {
      new Signal.Computed(() => {
        resolveTemplateProperty(context, config.query as string);
        debouncedRefresh();
      });
    }
    
    // Watch for filter parameter changes
    config.filter?.forEach(filterConfig => {
      if (typeof filterConfig.rightOperand === 'string') {
        new Signal.Computed(() => {
          resolveTemplateProperty(context, filterConfig.rightOperand);
          debouncedRefresh();
        });
      }
    });
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
    
    // Get the source (store or index)
    const source = config.index ? store.index(config.index) : store;
    
    // Resolve query parameter - can be function, string expression, or direct value
    let query = config.query;
    if (typeof config.query === 'function') {
      query = config.query();
    } else if (typeof config.query === 'string') {
      query = resolveTemplateProperty(context, config.query);
    }
    
    // Execute the operation
    switch (config.operation || 'getAll') {
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
      default:
        throw new Error(`Unsupported operation: ${config.operation}`);
    }
    
    request.onsuccess = () => {
      const result = request.result;
      // Ensure we always return an array for consistency
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