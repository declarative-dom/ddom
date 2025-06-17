// Setup file for Vitest tests
import { beforeEach } from 'vitest';

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