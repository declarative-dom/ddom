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
import { DOMNode, DOMSpec } from '../../types/src';
import { DOMSpecOptions } from './elements';
import { parseTemplateLiteral, computedTemplate } from './properties';

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

// === TYPE DEFINITIONS ===

/**
 * Type definition for Request namespace configuration.
 * Uses standard Request constructor properties with minimal DDOM extensions.
 */
export interface RequestConfig {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  mode?: RequestMode;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  signal?: any;
  
  // Minimal DDOM extensions (only two non-standard properties)
  trigger?: 'auto' | 'manual'; // Only two modes: auto (default) or manual
  debounce?: number; // Standard debouncing for auto requests
}

/**
 * Type definition for Request state management.
 * Each request creates a reactive signal with this state structure.
 */
export interface RequestState {
  loading: boolean;     // Request in progress
  data: any;           // Parsed response data  
  error: Error | null; // Request error, if any
  response: Response | null; // Raw fetch Response
  lastFetch: number;   // Timestamp of last request
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
 * Handles both auto and manual trigger modes with proper state management.
 *
 * @param el - The element to attach the request signal to
 * @param key - The property key
 * @param config - The request configuration
 * @returns The reactive request signal
 */
function createRequestSignal(
  el: any,
  key: string,
  config: RequestConfig
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

  // Process template literals in configuration
  const processedConfig = processRequestConfig(config, el);

  // Add fetch method for manual triggering
  (requestSignal as any).fetch = () => executeRequest(requestSignal, processedConfig, el);

  // Set up auto triggering if enabled (default mode) - temporarily disabled to debug
  // TODO: Re-enable auto triggering after fixing memory issues
  // if (config.trigger !== 'manual') {
  //   setupAutoTrigger(requestSignal, processedConfig, el, config.debounce);
  // }

  return requestSignal;
}

/**
 * Processes request configuration, handling template literals and reactive dependencies.
 *
 * @param config - The raw request configuration
 * @param contextNode - The context node for template evaluation
 * @returns Processed configuration with computed signals for reactive values
 */
function processRequestConfig(config: RequestConfig, contextNode: Node): any {
  const processed: any = { ...config };

  // Process each configuration value for template literals
  Object.keys(processed).forEach(key => {
    const value = processed[key];
    
    if (typeof value === 'string' && value.includes('${')) {
      // Create computed signal for reactive template
      processed[key] = computedTemplate(value, contextNode);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects (like headers, body)
      processed[key] = processRequestConfig(value, contextNode);
    }
  });

  return processed;
}

/**
 * Sets up automatic request triggering based on reactive dependencies.
 *
 * @param requestSignal - The request signal to update
 * @param config - The processed request configuration
 * @param contextNode - The context node
 * @param debounce - Optional debounce delay in milliseconds
 */
function setupAutoTrigger(
  requestSignal: Signal.State<RequestState>,
  config: any,
  contextNode: Node,
  debounce?: number
): void {
  let debounceTimer: any = null;
  let hasTriggered = false; // Prevent initial double execution

  const componentWatcher = (globalThis as any).__ddom_component_watcher as
    | ComponentSignalWatcher
    | undefined;

  const cleanup = createEffect(() => {
    // This effect will re-run when any reactive dependencies change
    const hasAllRequiredValues = checkRequiredValues(config);
    
    if (!hasAllRequiredValues) {
      // Don't execute if required values are missing
      return;
    }

    // Skip the first execution if we haven't triggered yet
    if (!hasTriggered) {
      hasTriggered = true;
      
      // Clear existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Execute with debounce if specified
      if (debounce && debounce > 0) {
        debounceTimer = setTimeout(() => {
          executeRequest(requestSignal, config, contextNode);
        }, debounce);
      } else {
        // Use setTimeout to avoid immediate execution during setup
        setTimeout(() => {
          executeRequest(requestSignal, config, contextNode);
        }, 0);
      }
    }
  }, componentWatcher);

  // Auto-cleanup with AbortController if available
  const signal = (globalThis as any).__ddom_abort_signal;
  if (signal && !signal.aborted) {
    signal.addEventListener('abort', cleanup, { once: true });
  }
}

/**
 * Checks if all required values are present for request execution.
 *
 * @param config - The request configuration
 * @returns True if all required values are available
 */
function checkRequiredValues(config: any): boolean {
  try {
    // URL is required
    const url = Signal.isComputed(config.url) ? config.url.get() : config.url;
    if (!url || url === null || url === undefined || url === '') {
      return false;
    }

    // Add other validation as needed
    return true;
  } catch (error) {
    // If there's an error getting reactive values, assume not ready
    return false;
  }
}

/**
 * Executes the actual fetch request and updates the signal state.
 *
 * @param requestSignal - The request signal to update
 * @param config - The processed request configuration  
 * @param contextNode - The context node
 */
async function executeRequest(
  requestSignal: Signal.State<RequestState>,
  config: any,
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
    // Resolve all reactive values in config
    const resolvedConfig = resolveConfig(config);
    
    // Handle relative URLs by creating a full URL if needed
    let url = resolvedConfig.url;
    if (url && !url.startsWith('http')) {
      // For testing and relative URLs, use current origin or localhost
      const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
      url = new URL(url, base).toString();
    }
    
    // Create Request instance with the resolved URL
    const requestOptions = { ...resolvedConfig };
    delete requestOptions.url; // Remove url from options since it's passed as first parameter
    
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
 * Resolves all computed signals and template literals in the configuration.
 *
 * @param config - The configuration with potential reactive values
 * @returns Configuration with all values resolved
 */
function resolveConfig(config: any): any {
  const resolved: any = {};

  Object.keys(config).forEach(key => {
    // Skip DDOM-specific properties
    if (key === 'trigger' || key === 'debounce') {
      return;
    }

    const value = config[key];
    
    if (Signal.isComputed(value)) {
      resolved[key] = value.get();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      resolved[key] = resolveConfig(value);
    } else {
      resolved[key] = value;
    }
  });

  // Handle body serialization
  if (resolved.body && typeof resolved.body === 'object') {
    resolved.body = JSON.stringify(resolved.body);
    
    // Set content-type header if not already specified
    if (!resolved.headers) {
      resolved.headers = {};
    }
    if (!resolved.headers['Content-Type'] && !resolved.headers['content-type']) {
      resolved.headers['Content-Type'] = 'application/json';
    }
  }

  return resolved;
}

/**
 * Handles the Request namespace property.
 * Creates a reactive request signal with fetch functionality.
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
    const requestSignal = createRequestSignal(el, key, config);
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