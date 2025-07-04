/**
 * Cookie Namespace Handler
 * 
 * Creates reactive cookie management with full options support.
 * Supports both reading from and writing to cookies with reactive updates.
 */

import { Signal } from '../../core/signals';
import { resolvePropertyValue, evaluatePropertyValue } from '../../core/properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';
import { CookieConfig } from '../../types';

/**
 * Creates reactive cookie signals
 */
export const createCookieNamespace = createNamespaceHandler(
  (config: any, key: string): config is CookieConfig =>
    validateNamespaceConfig(config, key, ['name']) &&
    config.prototype === 'Cookie',
  
  (config: CookieConfig, key: string, element: any) => {
    // Resolve the cookie name and initial value
    const resolvedName = resolvePropertyValue('name', config.name, element);
    const resolvedValue = config.value ? resolvePropertyValue('value', config.value, element) : null;
    
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
        const { value: finalName, isValid: nameValid } = evaluatePropertyValue(resolvedName);
        if (!nameValid || !finalName) {
          console.warn(`Invalid cookie name for ${key}`);
          return null;
        }

        // Get existing value from cookie
        const existingValue = getCookieValue(finalName);
        
        if (existingValue !== null) {
          return existingValue;
        } else if (resolvedValue) {
          // Use initial value if provided
          const { value: initialValue, isValid: valueValid } = evaluatePropertyValue(resolvedValue);
          if (valueValid) {
            // Store the initial value as cookie
            const valueStr = typeof initialValue === 'string' ? initialValue : JSON.stringify(initialValue);
            setCookieValue(finalName, valueStr, config);
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
        const { value: finalName, isValid } = evaluatePropertyValue(resolvedName);
        if (isValid && finalName) {
          // Save to cookie
          const valueStr = typeof newValue === 'string' ? newValue : JSON.stringify(newValue);
          setCookieValue(finalName, valueStr, config);
          
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
        const { value: finalName, isValid } = evaluatePropertyValue(resolvedName);
        if (isValid && finalName) {
          setCookieValue(finalName, '', { ...config, maxAge: 0 });
          originalSet(null);
        }
      } catch (error) {
        console.warn(`Cookie clear failed for ${key}:`, error);
      }
    };

    // Add a refresh method to reload from cookie
    (cookieSignal as any).refresh = () => {
      try {
        const { value: finalName, isValid } = evaluatePropertyValue(resolvedName);
        if (isValid && finalName) {
          const currentValue = getCookieValue(finalName);
          originalSet(currentValue);
        }
      } catch (error) {
        console.warn(`Cookie refresh failed for ${key}:`, error);
      }
    };

    return cookieSignal;
  }
);