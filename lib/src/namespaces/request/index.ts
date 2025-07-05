/**
 * Namespace Handler
 * 
 * Creates reactive HTTP request signals with automatic fetching,
 * debouncing, and response handling.
 */

import { Signal, createEffect, ComponentSignalWatcher } from '../../core/signals';
import { resolvePropertyValue, evaluatePropertyValue } from '../../core/properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';
import { performFetch } from './fetch';

/**
 * Request configuration interface
 */
interface RequestConfig extends PrototypeConfig, RequestInit {
  prototype: 'Request';
  url: string;
  manual?: boolean;
  debounce?: number;
  responseType?: XMLHttpRequestResponseType;
}


/**
 * Creates a reactive Request signal with fetch capabilities
 */
export const createRequestNamespace = createNamespaceHandler(
  (config: any, key: string): config is RequestConfig =>
    validateNamespaceConfig(config, key, ['url']) &&
    config.prototype === 'Request',
  
  (config: RequestConfig, key: string, element: any) => {
    // Create the signal that will hold the response (can be data or error object)
    const responseSignal = new Signal.State<any>(null);
    
    // Process the config to set up reactive dependencies
    const resolvedConfig = resolveConfig(config, element);
    
    // Set up automatic fetching unless manual mode
    if (!config.manual) {
      createRequestEffect(responseSignal, resolvedConfig);
    }
    
    // Add fetch method to the signal for manual triggering
    (responseSignal as any).fetch = async (overrideConfig?: Partial<RequestConfig>) => {
      const { value: currentConfig, isValid } = evaluatePropertyValue(resolvedConfig);
      if (!isValid) return null;
      
      const finalConfig = overrideConfig ? { ...currentConfig, ...overrideConfig } : currentConfig;
      
      try {
        const response = await performFetch(finalConfig);
        responseSignal.set(response);
        return response;
      } catch (error) {
        const errorResponse = { error: error instanceof Error ? error.message : String(error) };
        responseSignal.set(errorResponse);
        throw error;
      }
    };
    
    return responseSignal;
  }
);

/**
 * Processes a configuration object recursively using the unified property resolution.
 * Reuses the existing resolvePropertyValue function from properties.ts to avoid duplication.
 */
function resolveConfig(config: any, contextNode: any): any {
  const processed: any = { ...config };

  Object.keys(processed).forEach(key => {
    const value = processed[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recursively process nested objects (like headers)
      processed[key] = resolveConfig(value, contextNode);
    } else {
      // Use the unified property resolution from properties.ts
      processed[key] = resolvePropertyValue(key, value, contextNode);
    }
  });

  return processed;
}

/**
 * Sets up automatic request triggering based on reactive dependencies.
 * Uses evaluatePropertyValue to determine validity on each reactive change.
 * Handles debouncing through setTimeout in the effect.
 */
function createRequestEffect(
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

      // Clear existing debounce timer
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // Execute with debounce if specified
      if (finalConfig.debounce && finalConfig.debounce > 0) {
        debounceTimer = setTimeout(() => {
          executeRequest(requestSignal, finalConfig);
        }, finalConfig.debounce);
      } else {
        executeRequest(requestSignal, finalConfig);
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
 * Executes the actual fetch request and updates the signal with the response.
 * Receives already-evaluated primitive config values.
 */
async function executeRequest(
  requestSignal: Signal.State<any>,
  finalConfig: any
): Promise<void> {
  try {
    // URL is required and must be valid
    if (!finalConfig.url || finalConfig.url === '' || finalConfig.url === 'undefined') {
      // Don't log an error for empty/undefined URLs - just skip silently
      return;
    }

    const response = await performFetch(finalConfig);
    requestSignal.set(response);
  } catch (error) {
    console.warn('Request failed:', error);
    // For errors, set error response
    requestSignal.set({ error: error instanceof Error ? error.message : String(error) });
  }
}
