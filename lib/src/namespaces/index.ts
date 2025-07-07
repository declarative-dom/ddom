/**
 * Centralized Namespace Registry with DRY Validation
 * 
 * Imports handlers and config types from each namespace module,
 * validates with typia once, and delegates to appropriate handlers.
 */

import typia from 'typia';

// Import namespace handlers and their config types
import { type PrototypeConfig } from './types';
import { createArrayNamespace, type ArrayConfig } from './array';
import { createRequestNamespace, type RequestConfig } from './request';
import { createFormDataNamespace, type FormDataConfig } from './form-data';
import { createURLSearchParamsNamespace, type URLSearchParamsConfig } from './url-search-params';
import { createBlobNamespace, type BlobConfig } from './blob';
import { createArrayBufferNamespace, type ArrayBufferConfig } from './array-buffer';
import { createReadableStreamNamespace, type ReadableStreamConfig } from './readable-stream';
import { createCookieNamespace, type CookieConfig } from './cookie';
import { createStorageNamespace, type StorageConfig } from './storage';
import { createIndexedDBNamespace, type IndexedDBConfig } from './indexed-db';
import { createWebSocketNamespace, type WebSocketConfig } from './web-socket';


/**
 * Namespace handler function type (without validation)
 */
export type NamespaceHandler = (
  config: any, // Already validated config
  key: string,
  element: any
) => any;

/**
 * Config type validator function type
 */
export type ConfigValidator = (config: any) => boolean;

/**
 * Registry entry with handler and validator
 */
interface NamespaceEntry {
  handler: NamespaceHandler;
  validator: ConfigValidator;
}


/**
 * Registry mapping prototype names to their handlers and validators
 */

const arrayConfigValidator = typia.createIs<ArrayConfig>();
const storageConfigValidator = typia.createIs<StorageConfig>();

const NAMESPACE_REGISTRY: Record<string, NamespaceEntry> = {
  // Collection types (Array-like)
  'Array': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Set': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Map': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Int8Array': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Uint8Array': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Int16Array': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Uint16Array': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Int32Array': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Uint32Array': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Float32Array': { handler: createArrayNamespace, validator: arrayConfigValidator },
  'Float64Array': { handler: createArrayNamespace, validator: arrayConfigValidator },
  
  // Web API types
  'Request': { handler: createRequestNamespace, validator: typia.createIs<RequestConfig>() },
  'FormData': { handler: createFormDataNamespace, validator: typia.createIs<FormDataConfig>() },
  'URLSearchParams': { handler: createURLSearchParamsNamespace, validator: typia.createIs<URLSearchParamsConfig>() },
  'Blob': { handler: createBlobNamespace, validator: typia.createIs<BlobConfig>() },
  'ArrayBuffer': { handler: createArrayBufferNamespace, validator: typia.createIs<ArrayBufferConfig>() },
  'ReadableStream': { handler: createReadableStreamNamespace, validator: typia.createIs<ReadableStreamConfig>() },
  
  // Storage API types
  'Cookie': { handler: createCookieNamespace, validator: typia.createIs<CookieConfig>() },
  'SessionStorage': { handler: createStorageNamespace, validator: storageConfigValidator },
  'LocalStorage': { handler: createStorageNamespace, validator: storageConfigValidator },
  'IndexedDB': { handler: createIndexedDBNamespace, validator: typia.createIs<IndexedDBConfig>() },
  'WebSocket': { handler: createWebSocketNamespace, validator: typia.createIs<WebSocketConfig>() },
};

/**
 * Processes a namespaced property with centralized validation
 */
export function processNamespacedProperty(
  config: PrototypeConfig,
  key: string,
  element: any
): any {
  const entry = NAMESPACE_REGISTRY[config.prototype];
  
  if (!entry) {
    console.warn(`No handler found for prototype: ${config.prototype}. Skipping.`);
    return null;
  }
  
  // Centralized validation using typia
  if (!entry.validator(config)) {
    console.warn(`Invalid ${config.prototype}Config for ${key}:`, config);
    return null;
  }
  
  try {
    return entry.handler(config, key, element);
  } catch (error) {
    console.error(`Namespace handler failed for ${config.prototype}:`, error);
    return null;
  }
}