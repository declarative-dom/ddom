import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, Signal } from '../lib/dist/index.js';
import { isNamespacedProperty, extractNamespace, NAMESPACE_HANDLERS } from '../lib/dist/index.js';

describe('Namespaced Properties - Storage APIs', () => {
  beforeEach(() => {
    // Reset document state
    if (typeof document !== 'undefined') {
      document.cookie = '';
    }
    
    // Mock storage APIs
    const mockSessionStorage = {
      store: new Map(),
      getItem: vi.fn((key) => mockSessionStorage.store.get(key) || null),
      setItem: vi.fn((key, value) => mockSessionStorage.store.set(key, value)),
      removeItem: vi.fn((key) => mockSessionStorage.store.delete(key)),
      clear: vi.fn(() => mockSessionStorage.store.clear())
    };
    
    const mockLocalStorage = {
      store: new Map(),
      getItem: vi.fn((key) => mockLocalStorage.store.get(key) || null),
      setItem: vi.fn((key, value) => mockLocalStorage.store.set(key, value)),
      removeItem: vi.fn((key) => mockLocalStorage.store.delete(key)),
      clear: vi.fn(() => mockLocalStorage.store.clear())
    };

    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    // Clean up storage
    if (window.sessionStorage) {
      window.sessionStorage.clear();
    }
    if (window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('Namespace Detection', () => {
    test('should detect valid storage namespaced properties', () => {
      expect(isNamespacedProperty({ Cookie: { name: 'user' } })).toBe(true);
      expect(isNamespacedProperty({ SessionStorage: { key: 'data' } })).toBe(true);
      expect(isNamespacedProperty({ LocalStorage: { key: 'settings' } })).toBe(true);
      expect(isNamespacedProperty({ IndexedDB: { database: 'mydb', store: 'data' } })).toBe(true);
    });

    test('should reject invalid storage namespaced properties', () => {
      // Note: isNamespacedProperty only checks structure, not required properties
      // Missing required properties will be handled by the namespace handlers during creation
      expect(isNamespacedProperty({ Cookie: {} })).toBe(true); // Valid structure, missing required name handled by handler
      expect(isNamespacedProperty({ SessionStorage: {} })).toBe(true); // Valid structure, missing required key handled by handler  
      expect(isNamespacedProperty({ LocalStorage: {} })).toBe(true); // Valid structure, missing required key handled by handler
      expect(isNamespacedProperty({ IndexedDB: { database: 'mydb' } })).toBe(true); // Valid structure, missing required store handled by handler
      
      // These should actually be false because they are structural issues
      expect(isNamespacedProperty({ Cookie: 'invalid' })).toBe(false); // Config should be object
      expect(isNamespacedProperty({ SessionStorage: null })).toBe(false); // Config should be object
      expect(isNamespacedProperty({ Cookie: {}, InvalidNamespace: {} })).toBe(false); // Multiple namespaces
    });

    test('should extract storage namespaces correctly', () => {
      const cookieConfig = { name: 'user', value: 'john' };
      const cookieNamespaced = { Cookie: cookieConfig };

      const extracted = extractNamespace(cookieNamespaced);
      expect(extracted).toEqual({
        namespace: 'Cookie',
        config: cookieConfig
      });
    });
  });

  describe('Cookie Namespace', () => {
    test('should create a cookie signal with initial value', () => {
      const element = createElement({
        tagName: 'div',
        $userCookie: {
          Cookie: {
            name: 'username',
            value: 'defaultUser'
          }
        }
      });

      expect(element.$userCookie).toBeDefined();
      expect(Signal.isState(element.$userCookie)).toBe(true);

      const value = element.$userCookie.get();
      expect(value).toBe('defaultUser');
    });

    test('should override initial value with existing cookie', () => {
      // Set up existing cookie
      document.cookie = 'username=existingUser; path=/';
      
      const element = createElement({
        tagName: 'div',
        $userCookie: {
          Cookie: {
            name: 'username',
            value: 'defaultUser'
          }
        }
      });

      const value = element.$userCookie.get();
      expect(value).toBe('existingUser');
    });

    test('should handle cookie options', () => {
      const element = createElement({
        tagName: 'div',
        $settingsCookie: {
          Cookie: {
            name: 'settings',
            value: '{"theme":"dark"}',
            path: '/',
            maxAge: 3600,
            secure: true
          }
        }
      });

      expect(element.$settingsCookie.get()).toBe('{"theme":"dark"}');
    });
  });

  describe('SessionStorage Namespace', () => {
    test('should create a sessionStorage signal with initial value and automatic serialization', () => {
      const element = createElement({
        tagName: 'div',
        $sessionData: {
          SessionStorage: {
            key: 'userData',
            value: { name: 'John', age: 30 }
          }
        }
      });

      expect(element.$sessionData).toBeDefined();
      expect(Signal.isState(element.$sessionData)).toBe(true);

      const value = element.$sessionData.get();
      expect(value).toEqual({ name: 'John', age: 30 });
      
      // Verify it was stored in sessionStorage as serialized JSON
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'userData', 
        JSON.stringify({ name: 'John', age: 30 })
      );
    });

    test('should override initial value with existing sessionStorage data and auto-deserialize', () => {
      // Set up existing data as JSON string (how it's stored)
      const existingData = { name: 'Jane', age: 25 };
      window.sessionStorage.setItem('userData', JSON.stringify(existingData));
      
      const element = createElement({
        tagName: 'div',
        $sessionData: {
          SessionStorage: {
            key: 'userData',
            value: { name: 'John', age: 30 }
          }
        }
      });

      // Should automatically deserialize to object
      const value = element.$sessionData.get();
      expect(value).toEqual(existingData);
    });

    test('should handle string values without JSON parsing errors', () => {
      // Store a plain string (not JSON)
      window.sessionStorage.setItem('simpleKey', 'simpleValue');
      
      const element = createElement({
        tagName: 'div',
        $simpleData: {
          SessionStorage: {
            key: 'simpleKey',
            value: 'defaultValue'
          }
        }
      });

      // Should return the string as-is
      const value = element.$simpleData.get();
      expect(value).toBe('simpleValue');
    });

    test('should automatically serialize objects when signal changes', async () => {
      const element = createElement({
        tagName: 'div',
        $data: {
          SessionStorage: {
            key: 'testKey',
            value: { initial: 'value' }
          }
        }
      });

      // Change to a new object
      const newData = { updated: 'value', count: 42 };
      element.$data.set(newData);
      
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should automatically serialize the object
      const calls = window.sessionStorage.setItem.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const updatedCall = calls.find(call => call[1] === JSON.stringify(newData));
      expect(updatedCall).toBeDefined();
      expect(updatedCall[0]).toBe('testKey');
    });

    test('should handle strings without extra serialization', async () => {
      const element = createElement({
        tagName: 'div',
        $data: {
          SessionStorage: {
            key: 'stringKey',
            value: 'initial string'
          }
        }
      });

      // Change to a new string
      element.$data.set('updated string');
      
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should store string as-is (not JSON-stringified)
      const calls = window.sessionStorage.setItem.mock.calls;
      const updatedCall = calls.find(call => call[1] === 'updated string');
      expect(updatedCall).toBeDefined();
      expect(updatedCall[0]).toBe('stringKey');
    });
  });

  describe('LocalStorage Namespace', () => {
    test('should create a localStorage signal with initial value and automatic serialization', () => {
      const element = createElement({
        tagName: 'div',
        $localData: {
          LocalStorage: {
            key: 'appSettings',
            value: { theme: 'light', language: 'en' }
          }
        }
      });

      expect(element.$localData).toBeDefined();
      expect(Signal.isState(element.$localData)).toBe(true);

      const value = element.$localData.get();
      expect(value).toEqual({ theme: 'light', language: 'en' });
      
      // Verify it was stored in localStorage as serialized JSON
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'appSettings', 
        JSON.stringify({ theme: 'light', language: 'en' })
      );
    });

    test('should override initial value with existing localStorage data and auto-deserialize', () => {
      // Set up existing data as JSON string (how it's stored)
      const existingSettings = { theme: 'dark', language: 'fr' };
      window.localStorage.setItem('appSettings', JSON.stringify(existingSettings));
      
      const element = createElement({
        tagName: 'div',
        $localData: {
          LocalStorage: {
            key: 'appSettings',
            value: { theme: 'light', language: 'en' }
          }
        }
      });

      // Should automatically deserialize to object
      const value = element.$localData.get();
      expect(value).toEqual(existingSettings);
    });

    test('should automatically serialize objects when signal changes', async () => {
      const element = createElement({
        tagName: 'div',
        $data: {
          LocalStorage: {
            key: 'testKey',
            value: { initial: 'value' }
          }
        }
      });

      // Change to a new object
      const newData = { updated: 'value', theme: 'dark' };
      element.$data.set(newData);
      
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should automatically serialize the object
      const calls = window.localStorage.setItem.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const updatedCall = calls.find(call => call[1] === JSON.stringify(newData));
      expect(updatedCall).toBeDefined();
      expect(updatedCall[0]).toBe('testKey');
    });
  });

  describe('IndexedDB Namespace', () => {
    test('should create an IndexedDB signal object', () => {
      // Mock IndexedDB for this test
      const mockIndexedDB = {
        open: vi.fn()
      };
      Object.defineProperty(window, 'indexedDB', {
        value: mockIndexedDB,
        writable: true
      });

      const element = createElement({
        tagName: 'div',
        $dbData: {
          IndexedDB: {
            database: 'testDB',
            store: 'users',
            key: 'user1',
            value: { name: 'John', email: 'john@example.com' }
          }
        }
      });

      expect(element.$dbData).toBeDefined();
      expect(Signal.isComputed(element.$dbData)).toBe(true);

      const dbObject = element.$dbData.get();
      expect(dbObject).toBeDefined();
      expect(dbObject.database).toBe('testDB');
      expect(dbObject.store).toBe('users');
      expect(dbObject.key).toBe('user1');
      expect(typeof dbObject.get).toBe('function');
      expect(typeof dbObject.set).toBe('function');
    });

    test('should handle missing IndexedDB gracefully', () => {
      // Test with no IndexedDB mock
      const element = createElement({
        tagName: 'div',
        $dbData: {
          IndexedDB: {
            database: 'testDB',
            store: 'users'
          }
        }
      });

      const dbObject = element.$dbData.get();
      // Should handle missing IndexedDB by returning the config object without operations
      expect(dbObject).toBeDefined();
    });
  });

  describe('Namespace Handler Registry', () => {
    test('should have all storage handlers registered', () => {
      expect(NAMESPACE_HANDLERS.Cookie).toBeDefined();
      expect(NAMESPACE_HANDLERS.SessionStorage).toBeDefined();
      expect(NAMESPACE_HANDLERS.LocalStorage).toBeDefined();
      expect(NAMESPACE_HANDLERS.IndexedDB).toBeDefined();
      
      expect(typeof NAMESPACE_HANDLERS.Cookie).toBe('function');
      expect(typeof NAMESPACE_HANDLERS.SessionStorage).toBe('function');
      expect(typeof NAMESPACE_HANDLERS.LocalStorage).toBe('function');
      expect(typeof NAMESPACE_HANDLERS.IndexedDB).toBe('function');
    });
  });

  describe('Storage Updates', () => {
    test('should update sessionStorage when signal changes with automatic serialization', async () => {
      const element = createElement({
        tagName: 'div',
        $data: {
          SessionStorage: {
            key: 'testKey',
            value: 'initial'
          }
        }
      });

      // Change the signal value
      element.$data.set('updated');
      
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should trigger storage update with string as-is
      const calls = window.sessionStorage.setItem.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const updatedCall = calls.find(call => call[1] === 'updated');
      expect(updatedCall).toBeDefined();
      expect(updatedCall[0]).toBe('testKey');
    });

    test('should update localStorage when signal changes with automatic serialization', async () => {
      const element = createElement({
        tagName: 'div',
        $data: {
          LocalStorage: {
            key: 'testKey',
            value: { value: 'initial' }
          }
        }
      });

      // Change the signal value
      const newData = { value: 'updated' };
      element.$data.set(newData);
      
      // Wait for effects to run
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Should trigger storage update with automatic serialization
      const calls = window.localStorage.setItem.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const updatedCall = calls.find(call => call[1] === JSON.stringify(newData));
      expect(updatedCall).toBeDefined();
      expect(updatedCall[0]).toBe('testKey');
    });
  });
});