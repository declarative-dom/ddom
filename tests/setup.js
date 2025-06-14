// Setup file for Vitest tests
import { beforeEach } from 'vitest';

// Setup DOM environment for each test
beforeEach(() => {
  // Clear the document body
  document.body.innerHTML = '';
  
  // Reset any global variables that might be set by tests
  if (typeof window !== 'undefined') {
    // Clean up any test-specific global variables
    const testKeys = Object.keys(window).filter(key => 
      key.startsWith('test') || key.includes('Test')
    );
    testKeys.forEach(key => {
      delete window[key];
    });
  }
});