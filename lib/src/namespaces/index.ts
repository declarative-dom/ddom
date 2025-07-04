/**
 * Namespace Registry & Detection
 * 
 * Unified namespace system using prototype-based configuration.
 * All namespaces follow the pattern: { prototype: 'TypeName', ...config }
 */

import { Signal } from '../core/signals';
import { 
  isNamespacedProperty, 
  validateNamespaceConfig, 
  SUPPORTED_PROTOTYPES,
  type PrototypeName 
} from '../utils';

// Import namespace handlers
import { createArrayNamespace } from './array';
import { createRequestNamespace } from './request';
import { createFormDataNamespace } from './form-data';
import { createURLSearchParamsNamespace } from './url-search-params';
import { createBlobNamespace } from './blob';
import { createArrayBufferNamespace } from './array-buffer';
import { createReadableStreamNamespace } from './readable-stream';
import { createLocalStorageNamespace } from './local-storage';
// import { createIndexedDBNamespace } from './indexed-db';
// import { createWebSocketNamespace } from './web-socket';

/**
 * Options for namespace processing (avoid circular import)
 */
export interface DOMSpecOptions {
  css?: boolean;
  ignoreKeys?: string[];
}

/**
 * Base prototype configuration interface
 */
export interface PrototypeConfig {
  prototype: PrototypeName;
}

/**
 * Base interface for all prototype-based configurations
 */
export interface PrototypeConfig {
  prototype: PrototypeName;
  [key: string]: any;
}

/**
 * Namespace handler function type
 */
export type NamespaceHandler = (
  config: PrototypeConfig,
  key: string,
  element: any
) => any;

/**
 * Registry mapping prototype names to their handlers
 */
const NAMESPACE_HANDLERS: Record<string, NamespaceHandler> = {
  // Collection types (Array-like)
  'Array': createArrayNamespace,
  'Set': createArrayNamespace,
  'Map': createArrayNamespace,
  'Int8Array': createArrayNamespace,
  'Uint8Array': createArrayNamespace,
  'Int16Array': createArrayNamespace,
  'Uint16Array': createArrayNamespace,
  'Int32Array': createArrayNamespace,
  'Uint32Array': createArrayNamespace,
  'Float32Array': createArrayNamespace,
  'Float64Array': createArrayNamespace,
  
  // Web API types
  'Request': createRequestNamespace,
  'FormData': createFormDataNamespace,
  'URLSearchParams': createURLSearchParamsNamespace,
  'Blob': createBlobNamespace,
  'ArrayBuffer': createArrayBufferNamespace,
  'ReadableStream': createReadableStreamNamespace,
  'LocalStorage': createLocalStorageNamespace,
  // 'IndexedDB': createIndexedDBNamespace,
  // 'WebSocket': createWebSocketNamespace,
};

/**
 * Processes a namespaced property using the appropriate handler
 */
export function processNamespacedProperty(
  spec: DOMSpec,
  el: any,
  key: string,
  value: PrototypeConfig,
  options: DOMSpecOptions = {}
): any {
  const handler = NAMESPACE_HANDLERS[value.prototype];
  
  if (!handler) {
    console.warn(`No handler found for prototype: ${value.prototype}`);
    return null;
  }
  
  try {
    const signal = handler(value, key, el);
    
    return signal;
  } catch (error) {
    console.error(`Namespace handler failed for ${value.prototype}:`, error);
    return null;
  }
}

/**
 * Creates a standardized namespace handler with validation and error handling
 */
export function createNamespaceHandler<T extends PrototypeConfig>(
  validator: (config: any, key: string) => config is T,
  handler: (config: T, key: string, element: any) => any
): NamespaceHandler {
  return (config: PrototypeConfig, key: string, element: any) => {
    if (!validator(config, key)) {
      return null;
    }
    
    try {
      return handler(config as T, key, element);
    } catch (error) {
      console.error(`Namespace handler failed for ${key}:`, error);
      return null;
    }
  };
}

/**
 * DOMNode types (avoid circular import)
 */
export type DOMNode = HTMLElement | HTMLBodyElement | HTMLHeadElement | Document | ShadowRoot | DocumentFragment | Window;

/**
 * DOMSpec types (avoid circular import) 
 */
export type DOMSpec = any;

// Re-export utilities for namespace files to use
export { isNamespacedProperty, validateNamespaceConfig } from '../utils';
