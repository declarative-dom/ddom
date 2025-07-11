// Setup file for Vitest tests
import { beforeEach, vi } from 'vitest';

// Set up storage mocks globally before any modules load
const createMockStorage = () => ({
  store: new Map(),
  getItem: vi.fn(function(key) { return this.store.get(key) || null; }),
  setItem: vi.fn(function(key, value) { this.store.set(key, value); }),
  removeItem: vi.fn(function(key) { this.store.delete(key); }),
  clear: vi.fn(function() { this.store.clear(); })
});

// Set up global storage mocks
const mockSessionStorage = createMockStorage();
const mockLocalStorage = createMockStorage();

Object.defineProperty(globalThis, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
  configurable: true
});

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true
});

// Also set them on window for browser environment compatibility
Object.defineProperty(globalThis, 'window', {
  value: globalThis.window || {},
  writable: true,
  configurable: true
});

Object.defineProperty(globalThis.window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
  configurable: true
});

Object.defineProperty(globalThis.window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
  configurable: true
});

// Utility function to get the actual value from DDOM properties (which might be Signals)
globalThis.getSignalValue = function(obj) {
  if (obj && typeof obj === 'object' && obj.get && typeof obj.get === 'function') {
    return obj.get();
  }
  return obj;
};

// Setup DOM environment for each test
beforeEach(() => {
  // Clear the document body
  document.body.innerHTML = '';
  
  // Mock adoptedStyleSheets for jsdom compatibility
  if (!document.adoptedStyleSheets) {
    document.adoptedStyleSheets = [];
  }
  
  // Reset any global variables that might be set by tests
  if (typeof window !== 'undefined') {
    // Clean up any test-specific global variables
    const testKeys = Object.keys(window).filter(key => 
      key.startsWith('test') || key.includes('Test') || 
      ['name', 'version', 'settings', 'counter', 'message', 'user', 'title', 'status', 'items', 'tags', 'regularProp', 'count', 'multiplier', 'app'].includes(key)
    );
    testKeys.forEach(key => {
      delete window[key];
    });
  }
});