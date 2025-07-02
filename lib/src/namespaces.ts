/**
 * Namespaced Properties Module
 *
 * This module provides namespace detection and handling for DDOM properties.
 * Namespaced properties allow declarative access to Web APIs through standardized interfaces.
 * 
 * Current supported namespaces:
 * - Request: Declarative fetch API integration
 *
 * Future namespaces will follow the same pattern:
 * - WebSocket: WebSocket connections
 * - IntersectionObserver: Intersection observation
 * - Geolocation: Location services
 */

import { Signal, createEffect, ComponentSignalWatcher } from './signals';
import { DOMNode, DOMSpec, RequestConfig } from '../../types/src';
import { DOMSpecOptions } from './elements';
import { resolvePropertyValue, evaluatePropertyValue } from './properties';

// === NAMESPACE DETECTION ===

/**
 * Detects if a value is a namespaced property object.
 * A namespaced property must be an object with exactly one key that matches a known namespace.
 *
 * @param value - The value to check
 * @returns True if the value is a namespaced property object
 * @example
 * ```typescript
 * isNamespacedProperty({ Request: { url: '/api/users' } }); // true
 * isNamespacedProperty({ Request: { url: '/api/users' }, other: 'value' }); // false
 * isNamespacedProperty('string'); // false
 * ```
 */
export function isNamespacedProperty(value: any): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  if (keys.length !== 1) {
    return false;
  }

  const namespace = keys[0];
  if (!(namespace in NAMESPACE_HANDLERS)) {
    return false;
  }

  // Additional validation: ensure the config value is an object
  const config = value[namespace];
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return false;
  }

  return true;
}

/**
 * Extracts the namespace and configuration from a namespaced property object.
 *
 * @param value - The namespaced property object
 * @returns Object containing the namespace name and its configuration
 * @example
 * ```typescript
 * extractNamespace({ Request: { url: '/api/users' } });
 * // Returns: { namespace: 'Request', config: { url: '/api/users' } }
 * ```
 */
export function extractNamespace(value: any): { namespace: string; config: any } | null {
  if (!isNamespacedProperty(value)) {
    return null;
  }

  const namespace = Object.keys(value)[0];
  const config = value[namespace];

  return { namespace, config };
}

/**
 * Type definition for namespace handlers.
 * Each handler receives the spec, element, property key, namespace config, and options.
 */
export type NamespaceHandler = (
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  config: any,
  options?: DOMSpecOptions
) => void;

// === REQUEST NAMESPACE IMPLEMENTATION ===

/**
 * Creates a reactive Request signal that stores the actual response data.
 * The signal directly contains the parsed response data (JSON, text, etc.)
 * Uses the `return` config option to determine how to parse the response.
 *
 * @param el - The element to attach the request signal to
 * @param key - The property key
 * @param config - The request configuration
 * @param options - The DOMSpecOptions for property processing
 * @returns The reactive request signal containing the response data
 */
function bindRequest(
  _spec: DOMSpec,
  el: any,
  key: string,
  config: RequestConfig,
  options: DOMSpecOptions = {}
): void {
  if (!config || typeof config !== 'object') {
    console.warn(`Invalid Request configuration for property "${key}"`);
    return;
  }

  if (!config.url) {
    console.warn(`Request configuration missing required "url" property for "${key}"`);
    return;
  }

  try {
    // Initialize with null - will contain the actual response data
    const requestSignal = new Signal.State(null);

    // Process the config once to set up reactive dependencies (template signals)
    const resolvedConfig = resolveConfig(config, el, options);

    // Add fetch method for manual triggering
    (requestSignal as any).fetch = async () => {
      const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
      if (isValid) {
        await executeRequest(requestSignal, finalConfig, config.responseType);
      }
    };

    // Set up auto triggering if not disabled (default mode)
    if (!config.disabled) {
      setupAutoTrigger(requestSignal, resolvedConfig);
    }

    (el as any)[key] = requestSignal;
  } catch (error) {
    console.warn(`Failed to create Request signal for property "${key}":`, error);
  }
}

/**
 * Processes a configuration object recursively using the unified property resolution.
 * Reuses the existing resolvePropertyValue function from properties.ts to avoid duplication.
 *
 * @param config - The configuration object to process
 * @param contextNode - The context node for template evaluation
 * @param options - DOMSpecOptions containing ignoreKeys and other processing options
 * @returns Processed config with template signals
 */
function resolveConfig(config: any, contextNode: any, options: DOMSpecOptions = {}): any {
  const processed: any = { ...config };

  Object.keys(processed).forEach(key => {
    const value = processed[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects (like headers)
      processed[key] = resolveConfig(value, contextNode, options);
    } else {
      // Use the unified property resolution from properties.ts
      processed[key] = resolvePropertyValue(key, value, contextNode, options);
    }
  });

  return processed;
}

/**
 * Sets up automatic request triggering based on reactive dependencies.
 * Uses evaluatePropertyValue to determine validity on each reactive change.
 *
 * @param requestSignal - The request signal to update
 * @param resolvedConfig - The resolved configuration object with template signals
 */
function setupAutoTrigger(
  requestSignal: Signal.State<any>,
  resolvedConfig: RequestConfig,
): void {
  let debounceTimer: any = null;

  const componentWatcher = (globalThis as any).__ddom_component_watcher as
    | ComponentSignalWatcher
    | undefined;

  const cleanup = createEffect(() => {
    try {
      // Evaluate config to trigger reactive dependencies and check validity
      const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);

      if (!isValid) {
        // Don't execute if config is invalid
        return;
      }

      // Clear existing delay timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Execute with delay if specified (matches Web Animations API pattern)
      if (resolvedConfig.delay && resolvedConfig.delay > 0) {
        debounceTimer = setTimeout(() => {
          executeRequest(requestSignal, finalConfig, resolvedConfig.responseType);
        }, resolvedConfig.delay);
      } else {
        executeRequest(requestSignal, finalConfig, resolvedConfig.responseType);
      }
    } catch (error) {
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

/**
 * Executes the actual fetch request and updates the signal with the parsed data.
 * Receives already-evaluated primitive config values.
 *
 * @param requestSignal - The request signal to update with response data
 * @param finalConfig - The final primitive configuration values
 * @param responseType - How to parse the response (json, text, etc.)
 */
async function executeRequest(
  requestSignal: Signal.State<any>,
  finalConfig: any,
  responseType?: string
): Promise<void> {
  try {
    // URL is required and must be a valid URL
    if (!finalConfig.url || finalConfig.url === '' || finalConfig.url === 'undefined') {
      // Don't log an error for empty/undefined URLs - just skip silently
      return;
    }

    // Handle relative URLs
    let url = finalConfig.url;
    if (!url.startsWith('http')) {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      url = new URL(url, base).toString();
    }

    // Create Request instance with the resolved URL
    const requestOptions = { ...finalConfig };
    delete requestOptions.url;
    delete requestOptions.disabled;
    delete requestOptions.delay;
    delete requestOptions.responseType;

    // Handle basic JSON serialization for object bodies
    if (requestOptions.body && typeof requestOptions.body === 'object' &&
      requestOptions.body.constructor === Object) {
      requestOptions.body = JSON.stringify(requestOptions.body);

      // Set Content-Type header if not already specified
      if (!requestOptions.headers) {
        requestOptions.headers = {};
      }
      if (!requestOptions.headers['Content-Type'] && !requestOptions.headers['content-type']) {
        requestOptions.headers['Content-Type'] = 'application/json';
      }
    }

    const request = new Request(url, requestOptions);

    // Execute fetch with clean response handling
    try {
      const response = await fetch(request);
      
      // Check for basic errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse response data based on return format
      let data;
      if (responseType) {
        // Use specified format
        switch (responseType) {
          case 'json':
            data = await response.json();
            break;
          case 'text':
            data = await response.text();
            break;
          case 'arrayBuffer':
            data = await response.arrayBuffer();
            break;
          case 'blob':
            data = await response.blob();
            break;
          case 'formData':
            data = await response.formData();
            break;
          case 'clone':
            data = response.clone();
            break;
          default:
            data = await response.text();
        }
      } else {
        // Auto-detect based on content-type
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('json')) {
          try {
            data = await response.json();
          } catch (e) {
            console.warn(`Failed to parse response as JSON for ${url}:`, e);
            data = null;
          }
        } else {
          data = await response.text();
        }
      }

      // Update signal with parsed data directly
      requestSignal.set(data);
    } catch (error) {
      console.warn(`Request failed for ${url}:`, error);
      // For errors, set null
      requestSignal.set(null);
    }

  } catch (error) {
    console.warn('Request setup failed:', error);
    requestSignal.set(null);
  }
}

// === GENERIC NAMESPACE UTILITIES ===

/**
 * Generic namespace handler factory that reduces boilerplate.
 * Creates consistent handlers with validation, error handling, and reactive config processing.
 *
 * @param validateConfig - Function to validate the configuration object
 * @param createSignal - Function that creates the appropriate signal from resolved config
 * @returns A standardized namespace handler function
 */
function createNamespaceHandler<T>(
  validateConfig: (config: any, key: string) => config is T,
  createSignal: (resolvedConfig: any, key: string) => Signal.State<any> | Signal.Computed<any>
): NamespaceHandler {
  return (_spec: DOMSpec, el: any, key: string, config: any, options: DOMSpecOptions = {}): void => {
    if (!validateConfig(config, key)) {
      return; // Validation handles error logging
    }

    try {
      // Process the config to set up reactive dependencies
      const resolvedConfig = resolveConfig(config, el, options);
      
      // Create the appropriate signal
      const signal = createSignal(resolvedConfig, key);
      
      // Assign to element
      (el as any)[key] = signal;
    } catch (error) {
      console.warn(`Failed to create ${key.split('$')[0]} signal for property "${key}":`, error);
    }
  };
}

/**
 * Standard validation for object-based configurations.
 */
function validateObjectConfig(config: any, key: string, requiredProps: string[] = []): boolean {
  if (!config || typeof config !== 'object') {
    console.warn(`Invalid configuration for property "${key}" - expected object`);
    return false;
  }
  
  for (const prop of requiredProps) {
    if (!(prop in config)) {
      console.warn(`Configuration missing required "${prop}" property for "${key}"`);
      return false;
    }
  }
  
  return true;
}

// === NAMESPACE IMPLEMENTATIONS ===

/**
 * FormData namespace - creates reactive FormData objects
 */
const bindFormData = createNamespaceHandler(
  (config: any, key: string): config is Record<string, any> => 
    validateObjectConfig(config, key),
  (resolvedConfig: any) => new Signal.Computed(() => {
    const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
    if (!isValid) return new FormData();

    const formData = new FormData();
    Object.entries(finalConfig).forEach(([fieldKey, fieldValue]) => {
      if (fieldValue != null) {
        formData.append(fieldKey, fieldValue instanceof File || fieldValue instanceof Blob 
          ? fieldValue : String(fieldValue));
      }
    });
    return formData;
  })
);

/**
 * URLSearchParams namespace - creates reactive URLSearchParams objects
 */
const bindURLSearchParams = createNamespaceHandler(
  (config: any, key: string): config is Record<string, any> => 
    validateObjectConfig(config, key),
  (resolvedConfig: any) => new Signal.Computed(() => {
    const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
    if (!isValid) return new URLSearchParams();

    const params = new URLSearchParams();
    Object.entries(finalConfig).forEach(([paramKey, paramValue]) => {
      if (paramValue != null) {
        if (Array.isArray(paramValue)) {
          paramValue.forEach(value => params.append(paramKey, String(value)));
        } else {
          params.append(paramKey, String(paramValue));
        }
      }
    });
    return params;
  })
);

/**
 * Blob namespace - creates reactive Blob objects
 */
const bindBlob = createNamespaceHandler(
  (config: any, key: string): config is { content: any; type?: string; endings?: string } => 
    validateObjectConfig(config, key, ['content']),
  (resolvedConfig: any) => new Signal.Computed(() => {
    const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
    if (!isValid || !finalConfig.content) return new Blob();

    const content = finalConfig.content;
    const blobParts = Array.isArray(content) ? content : [content];
    const blobOptions: BlobPropertyBag = {};
    if (finalConfig.type) blobOptions.type = finalConfig.type;
    if (finalConfig.endings) blobOptions.endings = finalConfig.endings as EndingType;

    return new Blob(blobParts, blobOptions);
  })
);

/**
 * ArrayBuffer namespace - creates reactive ArrayBuffer objects
 */
const bindArrayBuffer = createNamespaceHandler(
  (config: any, key: string): config is { data: any; encoding?: string } => 
    validateObjectConfig(config, key, ['data']),
  (resolvedConfig: any, key: string) => new Signal.Computed(() => {
    const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
    if (!isValid || !finalConfig.data) return new ArrayBuffer(0);

    const data = finalConfig.data;
    if (data instanceof ArrayBuffer) return data;
    if (data instanceof Uint8Array) return data.buffer;
    if (Array.isArray(data)) return new Uint8Array(data).buffer;
    if (typeof data === 'string') return new TextEncoder().encode(data).buffer;
    
    console.warn(`Unsupported ArrayBuffer data type for property "${key}"`);
    return new ArrayBuffer(0);
  })
);

/**
 * ReadableStream namespace - creates reactive ReadableStream objects
 */
const bindReadableStream = createNamespaceHandler(
  (config: any, key: string): config is { source?: any; strategy?: any; data?: any } => 
    validateObjectConfig(config, key),
  (resolvedConfig: any) => new Signal.Computed(() => {
    const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
    if (!isValid) return new ReadableStream();

    if (finalConfig.source?.start) {
      return new ReadableStream(finalConfig.source, finalConfig.strategy);
    } else if (finalConfig.data) {
      const data = finalConfig.data;
      return new ReadableStream({
        start(controller) {
          if (Array.isArray(data)) {
            data.forEach(chunk => controller.enqueue(chunk));
          } else if (typeof data === 'string') {
            controller.enqueue(new TextEncoder().encode(data));
          } else {
            controller.enqueue(data);
          }
          controller.close();
        }
      }, finalConfig.strategy);
    }
    
    return new ReadableStream({ start: (controller) => controller.close() });
  })
);

/**
 * Cookie namespace - creates reactive cookie management
 */
const bindCookie = createNamespaceHandler(
  (config: any, key: string): config is { name: string; value?: string; domain?: string; path?: string; expires?: Date | string; maxAge?: number; secure?: boolean; sameSite?: string; initialValue?: string } => 
    validateObjectConfig(config, key, ['name']),
  (resolvedConfig: any, key: string) => {
    const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
    if (!isValid || !finalConfig.name) return new Signal.State(null);

    // Determine initial value - check cookie first, then use initialValue/value
    let initialValue = null;
    if (typeof document !== 'undefined') {
      const existingValue = getCookieValue(finalConfig.name);
      if (existingValue !== null) {
        initialValue = existingValue;
      } else {
        initialValue = finalConfig.initialValue !== undefined ? finalConfig.initialValue : finalConfig.value;
        // Set the cookie if we have an initial value
        if (initialValue !== undefined) {
          setCookie(finalConfig.name, String(initialValue), finalConfig);
        }
      }
    } else {
      initialValue = finalConfig.initialValue !== undefined ? finalConfig.initialValue : finalConfig.value;
    }

    // Create state signal with initial value
    const cookieSignal = new Signal.State(initialValue || null);

    // Set up effect to update cookie when signal changes
    createEffect(() => {
      if (typeof document === 'undefined' || !finalConfig.name) return;
      const currentValue = cookieSignal.get();
      if (currentValue !== null) {
        setCookie(finalConfig.name, String(currentValue), finalConfig);
      }
    });

    return cookieSignal;
  }
);

/**
 * SessionStorage namespace - creates reactive sessionStorage management
 */
const bindSessionStorage = createNamespaceHandler(
  (config: any, key: string): config is { key: string; value?: any; initialValue?: any } => 
    validateObjectConfig(config, key, ['key']),
  (resolvedConfig: any, key: string) => {
    const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
    if (!isValid || !finalConfig.key) return new Signal.State(null);

    // Determine initial value - check sessionStorage first, then use initialValue/value
    let initialValue = null;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const existingValue = window.sessionStorage.getItem(finalConfig.key);
      if (existingValue !== null) {
        try {
          initialValue = JSON.parse(existingValue);
        } catch {
          initialValue = existingValue;
        }
      } else {
        initialValue = finalConfig.initialValue !== undefined ? finalConfig.initialValue : finalConfig.value;
        // Set the sessionStorage if we have an initial value
        if (initialValue !== undefined) {
          const valueToStore = typeof initialValue === 'string' ? initialValue : JSON.stringify(initialValue);
          window.sessionStorage.setItem(finalConfig.key, valueToStore);
        }
      }
    } else {
      initialValue = finalConfig.initialValue !== undefined ? finalConfig.initialValue : finalConfig.value;
    }

    // Create state signal with initial value
    const storageSignal = new Signal.State(initialValue || null);

    // Set up effect to update sessionStorage when signal changes
    createEffect(() => {
      if (typeof window === 'undefined' || !window.sessionStorage || !finalConfig.key) return;
      const currentValue = storageSignal.get();
      if (currentValue !== null) {
        const valueToStore = typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue);
        window.sessionStorage.setItem(finalConfig.key, valueToStore);
      }
    });

    return storageSignal;
  }
);

/**
 * LocalStorage namespace - creates reactive localStorage management
 */
const bindLocalStorage = createNamespaceHandler(
  (config: any, key: string): config is { key: string; value?: any; initialValue?: any } => 
    validateObjectConfig(config, key, ['key']),
  (resolvedConfig: any, key: string) => {
    const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
    if (!isValid || !finalConfig.key) return new Signal.State(null);

    // Determine initial value - check localStorage first, then use initialValue/value
    let initialValue = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      const existingValue = window.localStorage.getItem(finalConfig.key);
      if (existingValue !== null) {
        try {
          initialValue = JSON.parse(existingValue);
        } catch {
          initialValue = existingValue;
        }
      } else {
        initialValue = finalConfig.initialValue !== undefined ? finalConfig.initialValue : finalConfig.value;
        // Set the localStorage if we have an initial value
        if (initialValue !== undefined) {
          const valueToStore = typeof initialValue === 'string' ? initialValue : JSON.stringify(initialValue);
          window.localStorage.setItem(finalConfig.key, valueToStore);
        }
      }
    } else {
      initialValue = finalConfig.initialValue !== undefined ? finalConfig.initialValue : finalConfig.value;
    }

    // Create state signal with initial value
    const storageSignal = new Signal.State(initialValue || null);

    // Set up effect to update localStorage when signal changes
    createEffect(() => {
      if (typeof window === 'undefined' || !window.localStorage || !finalConfig.key) return;
      const currentValue = storageSignal.get();
      if (currentValue !== null) {
        const valueToStore = typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue);
        window.localStorage.setItem(finalConfig.key, valueToStore);
      }
    });

    return storageSignal;
  }
);

/**
 * IndexedDB namespace - creates reactive IndexedDB management
 */
const bindIndexedDB = createNamespaceHandler(
  (config: any, key: string): config is { database: string; store: string; key?: any; value?: any; initialValue?: any; version?: number } => 
    validateObjectConfig(config, key, ['database', 'store']),
  (resolvedConfig: any, key: string) => {
    const dbSignal = new Signal.Computed(() => {
      const { value: finalConfig, isValid } = evaluatePropertyValue(resolvedConfig);
      if (!isValid || !finalConfig.database || !finalConfig.store) return null;

      // For IndexedDB, we'll return a promise-like object that can be awaited
      if (typeof window === 'undefined' || !window.indexedDB) return null;

      // Return an object with async methods for IndexedDB operations
      return {
        database: finalConfig.database,
        store: finalConfig.store,
        key: finalConfig.key,
        version: finalConfig.version || 1,
        initialValue: finalConfig.initialValue !== undefined ? finalConfig.initialValue : finalConfig.value,
        
        async get() {
          try {
            const db = await openDatabase(this.database, this.version, this.store);
            if (this.key !== undefined) {
              const existingValue = await getFromIndexedDB(db, this.store, this.key);
              if (existingValue !== undefined) {
                return existingValue;
              }
              return this.initialValue || null;
            }
            return null;
          } catch (error) {
            console.warn(`IndexedDB get failed for property "${key}":`, error);
            return null;
          }
        },

        async set(value: any) {
          try {
            if (this.key !== undefined) {
              const db = await openDatabase(this.database, this.version, this.store);
              await setInIndexedDB(db, this.store, this.key, value);
            }
          } catch (error) {
            console.warn(`IndexedDB set failed for property "${key}":`, error);
          }
        },

        async initialize() {
          if (this.initialValue !== undefined && this.key !== undefined) {
            try {
              const db = await openDatabase(this.database, this.version, this.store);
              const existingValue = await getFromIndexedDB(db, this.store, this.key);
              if (existingValue === undefined) {
                await setInIndexedDB(db, this.store, this.key, this.initialValue);
              }
            } catch (error) {
              console.warn(`IndexedDB initialization failed for property "${key}":`, error);
            }
          }
        }
      };
    });

    // Initialize the IndexedDB entry if needed
    const dbObject = dbSignal.get();
    if (dbObject && typeof dbObject.initialize === 'function') {
      dbObject.initialize().catch(() => {
        // Silently handle initialization errors
      });
    }

    return dbSignal;
  }
);

// === STORAGE UTILITY FUNCTIONS ===

/**
 * Get cookie value by name
 */
function getCookieValue(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const result = parts.pop()?.split(';').shift();
    return result ? decodeURIComponent(result) : null;
  }
  return null;
}

/**
 * Set cookie with options
 */
function setCookie(name: string, value: string, options: any = {}) {
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (options.domain) cookieString += `; domain=${options.domain}`;
  if (options.path) cookieString += `; path=${options.path}`;
  if (options.expires) {
    const expires = options.expires instanceof Date ? options.expires : new Date(options.expires);
    cookieString += `; expires=${expires.toUTCString()}`;
  }
  if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
  if (options.secure) cookieString += `; secure`;
  if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
  
  document.cookie = cookieString;
}

/**
 * Open IndexedDB database
 */
function openDatabase(name: string, version: number, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(name, version);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
  });
}

/**
 * Get value from IndexedDB
 */
function getFromIndexedDB(db: IDBDatabase, storeName: string, key: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * Set value in IndexedDB
 */
function setInIndexedDB(db: IDBDatabase, storeName: string, key: any, value: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// === NAMESPACE HANDLERS REGISTRY ===

/**
 * Registry of namespace handlers.
 * This is the single source of truth for supported namespaces.
 */
export const NAMESPACE_HANDLERS: Record<string, NamespaceHandler> = {
  'Request': bindRequest,
  'FormData': bindFormData,
  'URLSearchParams': bindURLSearchParams,
  'Blob': bindBlob,
  'ArrayBuffer': bindArrayBuffer,
  'ReadableStream': bindReadableStream,
  'Cookie': bindCookie,
  'SessionStorage': bindSessionStorage,
  'LocalStorage': bindLocalStorage,
  'IndexedDB': bindIndexedDB,
  // Future namespaces will be added here:
  // 'WebSocket': handleWebSocketProperty,
  // 'IntersectionObserver': handleIntersectionObserverProperty,
  // 'Geolocation': handleGeolocationProperty,
};

/**
 * Processes a namespaced property using the appropriate handler.
 *
 * @param spec - The declarative DOM specification
 * @param el - The target DOM node
 * @param key - The property key
 * @param value - The namespaced property value
 * @param options - Optional configuration object
 */
export function processNamespacedProperty(
  spec: DOMSpec,
  el: DOMNode,
  key: string,
  value: any,
  options: DOMSpecOptions = {}
): void {
  const namespaceData = extractNamespace(value);

  if (!namespaceData) {
    console.warn(`Failed to extract namespace from property "${key}"`);
    return;
  }

  const { namespace, config } = namespaceData;
  const handler = NAMESPACE_HANDLERS[namespace];

  if (!handler) {
    console.warn(`No handler found for namespace "${namespace}" in property "${key}"`);
    return;
  }

  handler(spec, el, key, config, options);
}