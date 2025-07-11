/**
 * Cookie Namespace Handler
 * 
 * Creates reactive cookie management with full options support.
 * Supports both reading from and writing to cookies with reactive updates.
 */

import { Signal } from '../core/signals';
import { processProperty } from '../core/properties';
import { PrototypeConfig } from './types';
import { serialize, deserialize, SerializableValue } from '../utils';

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
 * CookieSignal Type Definition
 * A Signal.State for cookie operations with automatic serialization.
 * Contains the deserialized value and automatically syncs with document.cookie.
 */
export interface CookieSignal<T = SerializableValue> extends Signal.State<T> {
  clear(): void; // Clears the cookie value
  get(): T; // Gets the current value from cookie
  set(value: T): void; // Sets a new value in cookie
  refresh(): void; // Refreshes the value from cookie
}

/**
 * CookieConfig Type Definition
 * Configuration options for creating cookie signals.
 * Extends PrototypeConfig with cookie-specific options.
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
): CookieSignal => {
  const processedName = processProperty('name', config.name, element);
  const processedValue = processProperty('value', config.value, element);
  
  if (!processedName.isValid || !processedName.value) {
    console.warn(`Invalid cookie name for ${key}`);
    return new Signal.State(null) as CookieSignal;
  }

  const cookieName = processedName.value;
  
  // Helper function to get cookie value with deserialization
  function getCookieValue() {
    try {
      const value = getCookie(cookieName);
      return value ? deserialize(value) : null;
    } catch (error) {
      console.warn(`Failed to deserialize cookie ${cookieName}:`, error);
      return null;
    }
  }

  // Initialize with current cookie value or provided default
  const initialValue = getCookieValue() ?? (processedValue.isValid ? processedValue.value : null);
  
  // Create the enhanced signal
  const signal = new Signal.State(initialValue) as CookieSignal;

  // Override set method to include serialization and cookie writing
  const originalSet = signal.set.bind(signal);
  signal.set = function(value: any) {
    try {
      // Serialize the value before storing
      const serializedValue = serialize(value);
      
      // Set the cookie with serialized value
      setCookie(cookieName, serializedValue, config);
      
      // Update the signal
      originalSet(value);
    } catch (error) {
      console.error(`Failed to serialize and set cookie ${cookieName}:`, error);
    }
  };

  // Add refresh method to re-read from cookie
  signal.refresh = function() {
    const currentValue = getCookieValue();
    originalSet(currentValue);
  };

  // Add clear method to remove cookie
  signal.clear = function() {
    deleteCookie(cookieName, config);
    originalSet(null);
  };

  // Set initial value if provided and not already in cookie
  if (processedValue.isValid && getCookie(cookieName) === null) {
    signal.set(processedValue.value);
  }

  return signal;
};

/**
 * Helper function to get cookie value by name
 */
function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Helper function to set cookie with options
 */
function setCookie(name: string, value: string, options: CookieConfig): void {
  let cookieString = `${name}=${value}`;
  
  if (options.maxAge !== undefined) {
    cookieString += `; Max-Age=${options.maxAge}`;
  }
  
  if (options.expires) {
    const expiresDate = typeof options.expires === 'string' ? new Date(options.expires) : options.expires;
    cookieString += `; Expires=${expiresDate.toUTCString()}`;
  }
  
  if (options.path) {
    cookieString += `; Path=${options.path}`;
  }
  
  if (options.domain) {
    cookieString += `; Domain=${options.domain}`;
  }
  
  if (options.secure) {
    cookieString += `; Secure`;
  }
  
  if (options.sameSite) {
    cookieString += `; SameSite=${options.sameSite}`;
  }
  
  document.cookie = cookieString;
}

/**
 * Helper function to delete cookie
 */
function deleteCookie(name: string, options: CookieConfig): void {
  let cookieString = `${name}=; Max-Age=-99999999`;
  
  if (options.path) {
    cookieString += `; Path=${options.path}`;
  }
  
  if (options.domain) {
    cookieString += `; Domain=${options.domain}`;
  }
  
  document.cookie = cookieString;
}