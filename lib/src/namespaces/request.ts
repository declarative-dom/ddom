/**
 * Request Namespace Handler
 * 
 * Creates reactive HTTP request signals with automatic fetching,
 * debouncing, and response handling.
 */

import { Signal, createEffect, ComponentSignalWatcher } from '../core/signals';
import { resolveConfig } from '.';
import { PrototypeConfig } from './types';

/**
 * RequestConfig Type Definition
 * Local configuration interface for Request namespace
 */
export interface RequestConfig extends PrototypeConfig, RequestInit {
  prototype: 'Request';
  url: string;
  manual?: boolean;
  debounce?: number;
  responseType?: XMLHttpRequestResponseType;
}

/**
 * RequestSignal Type Definition
 * A Signal.State that extends with fetch capabilities for manual request triggering.
 * Contains the parsed response data directly and provides a fetch method for manual execution.
 */
export interface RequestSignal<T = any> extends Signal.State<T> {
  fetch(): Promise<void>;             // Manual fetch trigger
}

/**
 * Creates a reactive Request signal with fetch capabilities
 */
export const createRequestNamespace = (
  config: RequestConfig,
  key: string,
  element: any
): RequestSignal => {
  // Create the signal that will hold the response (can be data or error object)
  const responseSignal = new Signal.State<any>(null);
  
  // Set up automatic fetching unless manual mode
  if (!config.manual) {
    createRequestEffect(responseSignal, config, element);
  }
  
  // Add fetch method to the signal for manual triggering
  (responseSignal as any).fetch = async () => {
    const { value: resolvedConfig, isValid } = resolveConfig(config, element);
    if (!resolvedConfig || !isValid) return {};
    
    try {
      const response = await performFetch(resolvedConfig);
      responseSignal.set(response);
      return response;
    } catch (error) {
      const errorResponse = { error: error instanceof Error ? error.message : String(error) };
      responseSignal.set(errorResponse);
      throw error;
    }
  };
  
  return responseSignal as RequestSignal;
};

/**
 * Sets up automatic request triggering based on reactive dependencies.
 * Creates a reactive effect that automatically fetches when dependencies change.
 * Handles debouncing through setTimeout in the effect.
 */
function createRequestEffect(
  requestSignal: Signal.State<any>,
  config: RequestConfig,
  element: any
): void {
  let debounceTimer: any = null;

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
          executeRequest(requestSignal, resolvedConfig);
        }, resolvedConfig.debounce);
      } else {
        executeRequest(requestSignal, resolvedConfig);
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

/**
 * Executes the actual fetch request and updates the signal with the response.
 * Receives already-evaluated primitive config values.
 */
async function executeRequest(
  requestSignal: Signal.State<any>,
  resolvedConfig: any
): Promise<void> {
  try {
    // URL is required and must be valid
    if (!resolvedConfig.url || resolvedConfig.url === '' || resolvedConfig.url === 'undefined') {
      // Don't log an error for empty/undefined URLs - just skip silently
      return;
    }

    const response = await performFetch(resolvedConfig);
    requestSignal.set(response);
  } catch (error) {
    console.warn('Request failed:', error);
    // For errors, set error response
    requestSignal.set({ error: error instanceof Error ? error.message : String(error) });
  }
}


/**
 * Performs an HTTP fetch with DDOM-specific handling
 */
export async function performFetch(config: RequestConfig): Promise<any> {
  const { url, responseType = 'json', body, headers = {}, ...fetchOptions } = config;
  
  // Process the request body and headers
  let processedBody = body;
  let processedHeaders: Record<string, string> = { ...headers as Record<string, string> };
  
  // Auto-serialize object bodies to JSON and set Content-Type
  if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof URLSearchParams) && !(body instanceof Blob) && !(body instanceof ArrayBuffer)) {
    processedBody = JSON.stringify(body);
    // Set Content-Type header if not already set
    if (!processedHeaders['Content-Type'] && !processedHeaders['content-type']) {
      processedHeaders['Content-Type'] = 'application/json';
    }
  }
  
  // Perform the fetch
  const response = await fetch(url, {
    ...fetchOptions,
    body: processedBody,
    headers: processedHeaders
  });
  
  // Handle non-ok responses
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  // Parse response based on responseType
  switch (responseType) {
    case 'json':
      return await response.json();
      
    case 'text':
      return await response.text();
      
    case 'blob':
      return await response.blob();
      
    case 'arraybuffer':
      return await response.arrayBuffer();
      
    case 'document':
      const text = await response.text();
      const parser = new DOMParser();
      return parser.parseFromString(text, 'text/html');
      
    case '':
    default:
      // Return the Response object itself
      return response;
  }
}
