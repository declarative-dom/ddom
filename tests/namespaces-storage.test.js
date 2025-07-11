import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, Signal } from '../lib/dist/index.js';

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
    test('should detect valid storage namespaced properties via createElement', () => {
      // Test that namespaced properties work in createElement - this validates the internal detection
      const cookieElement = createElement({
        tagName: 'div',
        $testCookie: { prototype: 'Cookie', name: 'user', value: 'test' }
      });
      expect(cookieElement.$testCookie).toBeDefined();
      expect(Signal.isState(cookieElement.$testCookie)).toBe(true);

      const sessionElement = createElement({
        tagName: 'div',
        $testSession: { prototype: 'SessionStorage', key: 'data', value: 'test' }
      });
      expect(sessionElement.$testSession).toBeDefined();
      expect(Signal.isState(sessionElement.$testSession)).toBe(true);

      const localElement = createElement({
        tagName: 'div',
        $testLocal: { prototype: 'LocalStorage', key: 'settings', value: 'test' }
      });
      expect(localElement.$testLocal).toBeDefined();
      expect(Signal.isState(localElement.$testLocal)).toBe(true);

      const indexedElement = createElement({
        tagName: 'div',
        $testIndexed: { prototype: 'IndexedDB', database: 'mydb', store: 'data', value: [] }
      });
      expect(indexedElement.$testIndexed).toBeDefined();
      expect(Signal.isState(indexedElement.$testIndexed)).toBe(true);
    });

    test('should handle invalid namespace configurations gracefully', () => {
      // Invalid prototype should result in no signal being created
      const element1 = createElement({
        tagName: 'div',
        $invalid1: { prototype: 'InvalidNamespace', key: 'data' }
      });
      expect(element1.$invalid1).toBeNull();

      // Missing required properties should result in no signal being created  
      const element2 = createElement({
        tagName: 'div',
        $invalid2: { prototype: 'Cookie' } // Missing name
      });
      expect(element2.$invalid2).toBeDefined(); // Signal is created but may be null
      expect(Signal.isState(element2.$invalid2)).toBe(true);
      expect(element2.$invalid2.get()).toBeNull(); // Invalid config results in null value
    });

    test('should validate prototype-based namespace structure', () => {
      // Valid prototype configuration should create proper signals
      const element = createElement({
        tagName: 'div',
        $validConfig: { prototype: 'Cookie', name: 'user', value: 'john' }
      });
      
      expect(element.$validConfig).toBeDefined();
      expect(Signal.isState(element.$validConfig)).toBe(true);
      expect(element.$validConfig.get()).toBe('john');
    });
  });

  describe('Cookie Namespace', () => {
    test('should create a cookie signal with initial value', () => {
      const element = createElement({
        tagName: 'div',
        $userCookie: {
          prototype: 'Cookie',
          name: 'username',
          value: 'defaultUser'
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
          prototype: 'Cookie',
          name: 'username',
          value: 'defaultUser'
        }
      });

      const value = element.$userCookie.get();
      expect(value).toBe('existingUser');
    });

    test('should handle cookie options', () => {
      const element = createElement({
        tagName: 'div',
        $settingsCookie: {
          prototype: 'Cookie',
          name: 'settings',
          value: '{"theme":"dark"}',
          path: '/',
          maxAge: 3600,
          secure: true
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
          prototype: 'SessionStorage',
          key: 'userData',
          value: { name: 'John', age: 30 }
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
          prototype: 'SessionStorage',
          key: 'userData',
          value: { name: 'John', age: 30 }
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
          prototype: 'SessionStorage',
          key: 'simpleKey',
          value: 'defaultValue'
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
          prototype: 'SessionStorage',
          key: 'testKey',
          value: { initial: 'value' }
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
          prototype: 'SessionStorage',
          key: 'stringKey',
          value: 'initial string'
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
          prototype: 'LocalStorage',
          key: 'appSettings',
          value: { theme: 'light', language: 'en' }
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
          prototype: 'LocalStorage',
          key: 'appSettings',
          value: { theme: 'light', language: 'en' }
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
          prototype: 'LocalStorage',
          key: 'testKey',
          value: { initial: 'value' }
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
          prototype: 'IndexedDB',
          database: 'testDB',
          store: 'users',
          key: 'user1',
          value: [{ name: 'John', email: 'john@example.com' }]
        }
      });

      expect(element.$dbData).toBeDefined();
      expect(Signal.isState(element.$dbData)).toBe(true);

      // IndexedDB namespace creates a signal that holds the factory object
      // The actual database operations are async and handled via the factory
    });

    test('should handle missing IndexedDB gracefully', () => {
      // Remove indexedDB to test graceful degradation
      const originalIndexedDB = window.indexedDB;
      delete window.indexedDB;

      const element = createElement({
        tagName: 'div',
        $dbData: {
          prototype: 'IndexedDB',
          database: 'testDB',
          store: 'users'
        }
      });

      // Should still create a signal, but with null value due to missing IndexedDB
      expect(element.$dbData).toBeDefined();
      expect(Signal.isState(element.$dbData)).toBe(true);
      expect(element.$dbData.get()).toBeNull();

      // Restore for other tests
      window.indexedDB = originalIndexedDB;
    });
  });

  describe('Namespace Handler Registry', () => {
    test('should have all storage handlers registered via createElement', () => {
      // Test that all storage namespace handlers work by creating elements
      const cookieElement = createElement({
        tagName: 'div',
        $cookie: { prototype: 'Cookie', name: 'test', value: 'test' }
      });
      expect(cookieElement.$cookie).toBeDefined();
      expect(Signal.isState(cookieElement.$cookie)).toBe(true);

      const sessionElement = createElement({
        tagName: 'div',
        $session: { prototype: 'SessionStorage', key: 'test', value: 'test' }
      });
      expect(sessionElement.$session).toBeDefined();
      expect(Signal.isState(sessionElement.$session)).toBe(true);

      const localElement = createElement({
        tagName: 'div',
        $local: { prototype: 'LocalStorage', key: 'test', value: 'test' }
      });
      expect(localElement.$local).toBeDefined();
      expect(Signal.isState(localElement.$local)).toBe(true);

      // IndexedDB is implemented but may return null if no IndexedDB available
      const indexedElement = createElement({
        tagName: 'div',
        $indexed: { prototype: 'IndexedDB', database: 'test', store: 'test' }
      });
      expect(indexedElement.$indexed).toBeDefined();
      expect(Signal.isState(indexedElement.$indexed)).toBe(true);
    });
  });

  describe('Storage Updates', () => {
    test('should update sessionStorage when signal changes with automatic serialization', async () => {
      const element = createElement({
        tagName: 'div',
        $data: {
          prototype: 'SessionStorage',
          key: 'testKey',
          value: 'initial'
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
          prototype: 'LocalStorage',
          key: 'testKey',
          value: { value: 'initial' }
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