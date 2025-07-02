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
import { DOMNode, DOMSpec, RequestConfig, RequestState } from '../../types/src';
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
 * Creates a reactive Request signal with fetch functionality.
 * Uses direct property processing to resolve reactive values in the Request config.
 *
 * @param el - The element to attach the request signal to
 * @param key - The property key
 * @param config - The request configuration
 * @param options - The DOMSpecOptions for property processing
 * @returns The reactive request signal
 */
function createRequestSignal(
  el: any,
  key: string,
  config: RequestConfig,
  options: DOMSpecOptions = {}
): Signal.State<RequestState> {
  // Initialize request state
  const initialState: RequestState = {
    loading: false,
    data: null,
    error: null,
    response: null,
    lastFetch: 0
  };

  const requestSignal = new Signal.State(initialState);

  // Process the config to resolve reactive values
  const configOptions: DOMSpecOptions = {
    ...options,
    ignoreKeys: ['trigger', 'debounce', ...(options.ignoreKeys || [])]
  };
  const processedConfig = processOptions(config, el, configOptions);

  // Add fetch method for manual triggering
  (requestSignal as any).fetch = () => executeRequest(requestSignal, processedConfig, el);

  // Set up auto triggering if enabled (default mode)
  // Temporarily disabled to debug memory issues
  if (false && config.trigger !== 'manual') {
    setupAutoTrigger(requestSignal, processedConfig, el, config.debounce);
  }

  return requestSignal;
}

/**
 * Processes a Request configuration object to resolve reactive values.
 * Uses the unified resolvePropertyValue function for consistent behavior.
 *
 * @param config - The request configuration to process
 * @param contextNode - The context node for template evaluation
 * @param options - DOMSpecOptions containing ignoreKeys and other processing options
 * @returns Processed configuration with reactive values resolved
 */
function processOptions(config: any, contextNode: Node, options: DOMSpecOptions = {}): any {
  const processed: any = { ...config };
  
  // Process each configuration property using the unified resolvePropertyValue
  Object.keys(processed).forEach(key => {
    const value = processed[key];
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects (like headers)
      processed[key] = processOptions(value, contextNode, options);
    } else {
      // Use the unified property resolution
      processed[key] = resolvePropertyValue(key, value, contextNode, options);
    }
  });

  return processed;
}

/**
 * Sets up automatic request triggering based on reactive dependencies.
 * Simplified logic: any parameter that resolves to an empty string blocks the request.
 *
 * @param requestSignal - The request signal to update
 * @param processedConfig - The processed request configuration
 * @param contextNode - The context node
 * @param debounce - Optional debounce delay in milliseconds
 */
function setupAutoTrigger(
  requestSignal: Signal.State<RequestState>,
  processedConfig: any,
  contextNode: Node,
  debounce?: number
): void {
  let debounceTimer: any = null;

  const componentWatcher = (globalThis as any).__ddom_component_watcher as
    | ComponentSignalWatcher
    | undefined;

  const cleanup = createEffect(() => {
    // Check if any parameter resolves to an empty string
    const hasEmptyValues = checkForEmptyValues(processedConfig);
    
    if (hasEmptyValues) {
      // Don't execute if any values are empty strings
      return;
    }

    // Clear existing debounce timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Execute with debounce if specified
    if (debounce && debounce > 0) {
      debounceTimer = setTimeout(() => {
        executeRequest(requestSignal, processedConfig, contextNode);
      }, debounce);
    } else {
      executeRequest(requestSignal, processedConfig, contextNode);
    }
  }, componentWatcher);

  // Auto-cleanup with AbortController if available
  const signal = (globalThis as any).__ddom_abort_signal;
  if (signal && !signal.aborted) {
    signal.addEventListener('abort', cleanup, { once: true });
  }
}

/**
 * Checks if any parameter resolves to an empty string.
 * Simplified logic as requested: empty string values block the request.
 *
 * @param processedConfig - The processed configuration
 * @returns True if any values are empty strings
 */
function checkForEmptyValues(processedConfig: any): boolean {
  try {
    // Check all properties for empty string values
    for (const [key, value] of Object.entries(processedConfig)) {
      // Skip DDOM-specific properties
      if (key === 'trigger' || key === 'debounce') {
        continue;
      }

      let resolvedValue = value;
      
      // Resolve signals if needed
      if (typeof value === 'object' && value !== null && Signal.isState(value)) {
        resolvedValue = (value as Signal.State<any>).get();
      } else if (typeof value === 'object' && value !== null && Signal.isComputed(value)) {
        resolvedValue = (value as Signal.Computed<any>).get();
      }

      // Check if the resolved value is an empty string
      if (resolvedValue === '') {
        return true; // Found empty string, block request
      }
    }

    return false; // No empty strings found
  } catch (error) {
    // If there's an error getting reactive values, assume not ready
    return true;
  }
}

/**
 * Executes the actual fetch request and updates the signal state.
 * Works with the properties-processed configuration.
 *
 * @param requestSignal - The request signal to update
 * @param processedConfig - The processed configuration  
 * @param contextNode - The context node
 */
async function executeRequest(
  requestSignal: Signal.State<RequestState>,
  processedConfig: any,
  contextNode: Node
): Promise<void> {
  // Update loading state
  requestSignal.set({
    ...requestSignal.get(),
    loading: true,
    error: null,
    lastFetch: Date.now()
  });

  try {
    // Resolve all values in processedConfig
    const resolvedConfig = resolveConfigElement(processedConfig);
    
    // URL is required
    if (!resolvedConfig.url) {
      throw new Error('Request URL is required');
    }
    
    // Handle relative URLs
    let url = resolvedConfig.url;
    if (!url.startsWith('http')) {
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      url = new URL(url, base).toString();
    }
    
    // Create Request instance with the resolved URL
    const requestOptions = { ...resolvedConfig };
    delete requestOptions.url;
    delete requestOptions.trigger;
    delete requestOptions.debounce;
    
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
    
    // Parse response data
    let data: any = null;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (parseError) {
      // If parsing fails, use the response as-is
      data = response;
    }

    // Update success state
    requestSignal.set({
      loading: false,
      data,
      error: null,
      response,
      lastFetch: Date.now()
    });

  } catch (error) {
    // Update error state
    requestSignal.set({
      ...requestSignal.get(),
      loading: false,
      error: error as Error
    });
  }
}

/**
 * Resolves all signals and computed values in the processed configuration.
 * Works with the properties-processed configuration.
 *
 * @param processedConfig - The processed configuration with potential reactive values
 * @returns Configuration with all values resolved
 */
function resolveConfigElement(processedConfig: any): any {
  const resolved: any = {};

  Object.entries(processedConfig).forEach(([key, value]) => {
    let resolvedValue = value;
    
    if (typeof value === 'object' && value !== null && Signal.isState(value)) {
      resolvedValue = (value as Signal.State<any>).get();
    } else if (typeof value === 'object' && value !== null && Signal.isComputed(value)) {
      resolvedValue = (value as Signal.Computed<any>).get();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      resolvedValue = resolveConfigElement(value);
    }
    
    resolved[key] = resolvedValue;
  });

  return resolved;
}

/**
 * Handles the Request namespace property.
 * Creates a reactive request signal with fetch functionality.
 * Uses the properties module for consistent property processing.
 */
function handleRequestProperty(
  spec: DOMSpec,
  el: DOMNode,
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
    const requestSignal = createRequestSignal(el, key, config, options);
    (el as any)[key] = requestSignal;
  } catch (error) {
    console.warn(`Failed to create Request signal for property "${key}":`, error);
  }
}

// === NAMESPACE HANDLERS REGISTRY ===

/**
 * Registry of namespace handlers.
 * This is the single source of truth for supported namespaces.
 */
export const NAMESPACE_HANDLERS: Record<string, NamespaceHandler> = {
  'Request': handleRequestProperty,
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