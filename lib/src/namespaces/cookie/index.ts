/**
 * Cookie Namespace Handler
 * 
 * Creates reactive cookie management with full options support.
 * Supports both reading from and writing to cookies with reactive updates.
 */

import { Signal } from '../../core/signals';
import { processProperty } from '../../core/properties';
import { PrototypeConfig } from '../types';

/**
 * CookieInit interface (Cookie Store API)
 * Standard web API interface for cookie initialization options.
 */
export interface CookieInit {
  name: string;
  value: string;
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}

/**
 * CookieConfig Type Definition
 * Local configuration interface for Cookie namespace
 */
export interface CookieConfig extends PrototypeConfig, Omit<CookieInit, 'value'> {
  prototype: 'Cookie';
  value?: any;
  maxAge?: number;
  secure?: boolean;
}

/**
 * Creates reactive cookie signals
 */
export const createCookieNamespace = (
  config: CookieConfig,
  key: string,
  element: any
) => {
  // Config is already validated by the main namespace index

  // Resolve the cookie name and initial value
  const processedName = processProperty('name', config.name, element);
  const processedValue = processProperty('value', config.value, element);
  
  // Helper function to get cookie value
  const getCookieValue = (name: string): string | null => {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [cookieName, ...cookieValueParts] = cookie.trim().split('=');
        if (cookieName === name) {
          return decodeURIComponent(cookieValueParts.join('='));
        }
      }
      return null;
    } catch (error) {
      console.warn(`Failed to read cookie ${name}:`, error);
      return null;
    }
  };

  // Helper function to set cookie value
  const setCookieValue = (name: string, value: string, options: Partial<CookieConfig> = {}) => {
    try {
      let cookieString = `${name}=${encodeURIComponent(value)}`;
      
      if (options.path) cookieString += `; path=${options.path}`;
      if (options.domain) cookieString += `; domain=${options.domain}`;
      if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
      if (options.expires) cookieString += `; expires=${options.expires}`;
      if (options.secure) cookieString += `; secure`;
      if (options.httpOnly) cookieString += `; httponly`;
      if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
      
      document.cookie = cookieString;
    } catch (error) {
      console.warn(`Failed to set cookie ${name}:`, error);
    }
  };
  
  // Create a reactive signal that manages the cookie
  const cookieSignal = new Signal.State((() => {
    try {
      if (!processedName.isValid || !processedName.value) {
        console.warn(`Invalid cookie name for ${key}`);
        return null;
      }

      // Get existing value from cookie
      const existingValue = getCookieValue(processedName.value);
      
      if (existingValue !== null) {
        return existingValue;
      } else if (processedValue) {
        // Use initial value if provided
        if (processedValue.isValid) {
          // Store the initial value as cookie
          const valueStr = typeof processedValue.value === 'string' ? processedValue.value : JSON.stringify(processedValue.value);
          setCookieValue(processedName.value, valueStr, config);
          return valueStr;
        }
      }
      
      return null;
    } catch (error) {
      console.warn(`Cookie initialization failed for ${key}:`, error);
      return null;
    }
  })());

  // Override the set method to automatically save to cookie
  const originalSet = cookieSignal.set.bind(cookieSignal);
  cookieSignal.set = (newValue: any) => {
    try {
      if (processedName.isValid && processedName.value) {
        // Save to cookie
        const valueStr = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
        setCookieValue(processedName.value, valueStr, config);
        
        // Update the signal
        originalSet(valueStr);
      }
    } catch (error) {
      console.warn(`Cookie save failed for ${key}:`, error);
    }
  };

  // Add a clear method for convenience
  (cookieSignal as any).clear = () => {
    try {
      if (processedName.isValid && processedName.value) {
        setCookieValue(processedName.value, '', { ...config, maxAge: 0 });
        originalSet(null);
      }
    } catch (error) {
      console.warn(`Cookie clear failed for ${key}:`, error);
    }
  };

  // Add a refresh method to reload from cookie
  (cookieSignal as any).refresh = () => {
    try {
      if (processedName.isValid && processedName.value) {
        const currentValue = getCookieValue(processedName.value);
        originalSet(currentValue);
      }
    } catch (error) {
      console.warn(`Cookie refresh failed for ${key}:`, error);
    }
  };

  return cookieSignal;
};