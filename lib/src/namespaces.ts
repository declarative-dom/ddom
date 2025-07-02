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
import { resolvePropertyValue } from './properties';

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
  return namespace in NAMESPACE_HANDLERS;
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

  // Process the config to resolve reactive values and check validity
  const configOptions: DOMSpecOptions = {
    ...options,
    ignoreKeys: ['trigger', 'debounce', 'return', ...(options.ignoreKeys || [])]
  };
  const { config: processedConfig, isValid } = resolveConfig(config, el, configOptions);

  // Add fetch method for manual triggering
  (requestSignal as any).fetch = () => {
    if (isValid) {
      executeRequest(requestSignal, processedConfig, config.return);
    }
  };

  // Set up auto triggering if enabled (default mode)
  if (config.trigger !== 'manual') {
    setupAutoTrigger(requestSignal, config, el, configOptions, config.debounce, config.return);
  }

  (el as any)[key] = requestSignal;
  } catch (error) {
    console.warn(`Failed to create Request signal for property "${key}":`, error);
  }
}

/**
 * Processes a Request configuration object and determines validity.
 * Returns both the processed config and whether it's ready for execution.
 * This is the single source of truth for config processing.
 *
 * @param config - The request configuration to process
 * @param contextNode - The context node for template evaluation
 * @param options - DOMSpecOptions containing ignoreKeys and other processing options
 * @returns Object with processed config and validity flag
 */
function resolveConfig(config: any, contextNode: any, options: DOMSpecOptions = {}): { 
  config: any; 
  isValid: boolean; 
} {
  const processed: any = { ...config };
  let isValid = true;
  
  // Process each configuration property using the unified resolvePropertyValue
  Object.keys(processed).forEach(key => {
    const value = processed[key];
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects (like headers)
      const nested = resolveConfig(value, contextNode, options);
      processed[key] = nested.config;
      if (!nested.isValid) isValid = false;
    } else {
      // Use the unified property resolution which now includes validity checking
      const { value: resolvedValue, isValid: valueIsValid } = resolvePropertyValue(key, value, contextNode, options);
      processed[key] = resolvedValue;
      
      // Skip validity check for DDOM-specific properties
      if (key !== 'trigger' && key !== 'debounce' && key !== 'return' && !valueIsValid) {
        isValid = false;
      }
    }
  });

  return { config: processed, isValid };
}

/**
 * Sets up automatic request triggering based on reactive dependencies.
 * Uses resolveConfig to determine validity on each reactive change.
 *
 * @param requestSignal - The request signal to update
 * @param originalConfig - The original configuration object
 * @param contextNode - The context node for resolution
 * @param configOptions - The processing options
 * @param debounce - Optional debounce delay in milliseconds
 * @param returnFormat - How to parse the response
 */
function setupAutoTrigger(
  requestSignal: Signal.State<any>,
  originalConfig: any,
  contextNode: any,
  configOptions: DOMSpecOptions,
  debounce?: number,
  returnFormat?: string
): void {
  let debounceTimer: any = null;

  const componentWatcher = (globalThis as any).__ddom_component_watcher as
    | ComponentSignalWatcher
    | undefined;

  const cleanup = createEffect(() => {
    try {
      // Re-resolve config to check validity on each reactive change
      const { config: resolvedConfig, isValid } = resolveConfig(originalConfig, contextNode, configOptions);
      
      if (!isValid) {
        // Don't execute if config is invalid
        return;
      }

      // Clear existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Execute with debounce if specified
      if (debounce && debounce > 0) {
        debounceTimer = setTimeout(() => {
          executeRequest(requestSignal, resolvedConfig, returnFormat);
        }, debounce);
      } else {
        executeRequest(requestSignal, resolvedConfig, returnFormat);
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
 * Uses the already-resolved config from resolveConfig - no additional resolution needed.
 *
 * @param requestSignal - The request signal to update with response data
 * @param requestOptions - The already-resolved configuration from resolveConfig
 * @param returnFormat - How to parse the response (json, text, etc.)
 */
async function executeRequest(
  requestSignal: Signal.State<any>,
  requestOptions: any,
  returnFormat?: string
): Promise<void> {
  try {    
    // URL is required
    if (!requestOptions.url) {
      throw new Error('Request URL is required');
    }
    
    // Handle relative URLs
    let url = requestOptions.url;
    if (!url.startsWith('http')) {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      url = new URL(url, base).toString();
    }
    
    // Create Request instance with the resolved URL
    delete requestOptions.url;
    delete requestOptions.trigger;
    delete requestOptions.debounce;
    delete requestOptions.return;
    
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
    
    // Execute fetch
    const response = await fetch(request);
    
    // Parse response data based on return format
    let data: any = null;
    try {
      if (returnFormat) {
        // Use specified format
        switch (returnFormat) {
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
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      }
    } catch (parseError) {
      // If parsing fails, use the response as-is
      data = response;
    }

    // Update signal with parsed data directly
    requestSignal.set(data);

  } catch (error) {
    // For errors, we could set null or throw - let's set null for now
    requestSignal.set(null);
    console.warn('Request failed:', error);
  }
}

// === NAMESPACE HANDLERS REGISTRY ===

/**
 * Registry of namespace handlers.
 * This is the single source of truth for supported namespaces.
 */
export const NAMESPACE_HANDLERS: Record<string, NamespaceHandler> = {
  'Request': bindRequest,
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