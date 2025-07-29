/**
 * URL Namespace Handler
 * 
 * Creates reactive URL construction with base URL and search parameters.
 */

import { Signal } from '../core/signals';
import { resolveConfig } from '.';
import { PrototypeConfig } from './types';

/**
 * URLConfig Type Definition
 * Configuration interface for URL namespace
 */
export interface URLConfig extends PrototypeConfig {
  prototype: 'URL';
  base: string;
  searchParams?: Record<string, any> | URLSearchParams;
  hash?: string;
  pathname?: string;
}

/**
 * Creates a reactive URL signal that constructs URLs with base and search parameters
 */
export const createURLNamespace = (
  config: URLConfig,
  key: string,
  element: any
): Signal.Computed<string> => {
  // Create computed signal that reactively constructs the URL
  return new Signal.Computed(() => {
    const { value: resolvedConfig, isValid } = resolveConfig(config, element);
    
    if (!resolvedConfig || !isValid || !resolvedConfig.base) {
      return '';
    }

    try {
      // Start with base URL
      const url = new URL(resolvedConfig.base);
      
      // Add pathname if specified
      if (resolvedConfig.pathname) {
        url.pathname = resolvedConfig.pathname;
      }
      
      // Add search parameters if specified
      if (resolvedConfig.searchParams) {
        if (resolvedConfig.searchParams instanceof URLSearchParams) {
          // Use existing URLSearchParams
          url.search = resolvedConfig.searchParams.toString();
        } else if (typeof resolvedConfig.searchParams === 'object') {
          // Convert object to URLSearchParams
          const params = new URLSearchParams();
          for (const [key, value] of Object.entries(resolvedConfig.searchParams)) {
            if (value !== null && value !== undefined) {
              params.append(key, String(value));
            }
          }
          url.search = params.toString();
        }
      }
      
      // Add hash if specified
      if (resolvedConfig.hash) {
        url.hash = resolvedConfig.hash;
      }
      
      return url.toString();
    } catch (error) {
      console.warn('URL construction failed:', error);
      return '';
    }
  });
};