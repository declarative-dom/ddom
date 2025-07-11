import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createElement, Signal } from '../lib/dist/index.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Namespaced Properties - Request Namespace', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Reset any global state
    document.body.innerHTML = '';
    // Use fake timers to control microtask execution
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'nextTick', 'queueMicrotask'] });
    
    // Set up a default mock response to prevent console errors from auto-triggered requests
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ default: true })
    });
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
  });

  describe('Namespace Detection', () => {
    test('should detect valid namespaced properties via createElement', () => {
      // Test that Request namespace works in createElement - validates internal detection
      const element = createElement({
        tagName: 'div',
        $userData: { prototype: 'Request', url: '/api/users', manual: true }
      });
      expect(element.$userData).toBeDefined();
      expect(Signal.isState(element.$userData)).toBe(true);

      const element2 = createElement({
        tagName: 'div',
        $postData: { prototype: 'Request', url: '/api/users', method: 'POST', manual: true }
      });
      expect(element2.$postData).toBeDefined();
      expect(Signal.isState(element2.$postData)).toBe(true);
    });

    test('should handle invalid namespaced properties gracefully', () => {
      // Invalid prototype should result in no signal being created
      const element1 = createElement({
        tagName: 'div',
        $invalid: { prototype: 'InvalidNamespace', url: '/api' }
      });
      expect(element1.$invalid).toBeNull();

      // Missing required properties should result in warning but still create signal
      const element2 = createElement({
        tagName: 'div',
        $incomplete: { prototype: 'Request' } // Missing url
      });
      expect(element2.$incomplete).toBeDefined();
      expect(Signal.isState(element2.$incomplete)).toBe(true);
    });

    test('should validate prototype-based namespace structure', () => {
      // Valid Request configuration should create proper signals
      const element = createElement({
        tagName: 'div',
        $validRequest: { prototype: 'Request', url: '/api/users', method: 'GET', manual: true }
      });
      
      expect(element.$validRequest).toBeDefined();
      expect(Signal.isState(element.$validRequest)).toBe(true);
      expect(typeof element.$validRequest.fetch).toBe('function');
    });
  });

  describe('Request Signal Creation', () => {
    test('should create a request signal with manual trigger', () => {
      const element = createElement({
        tagName: 'div',
        $userData: {
          prototype: 'Request',
          url: '/api/users',
          manual: true
        }
      });

      expect(element.$userData).toBeDefined();
      expect(Signal.isState(element.$userData)).toBe(true);

      const state = element.$userData.get();
      expect(state).toBe(null); // Should be null initially

      expect(typeof element.$userData.fetch).toBe('function');
    });

    test('should create request signal with default auto trigger', () => {
      const element = createElement({
        tagName: 'div',
        $userData: {
          prototype: 'Request',
          url: '/api/users'
          // manual defaults to false (auto-enabled)
        }
      });

      expect(element.$userData).toBeDefined();
      expect(Signal.isState(element.$userData)).toBe(true);
      expect(typeof element.$userData.fetch).toBe('function');
    });
  });

  describe('Manual Request Execution', () => {
    test('should execute manual fetch request', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'John' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $userData: {
          prototype: 'Request',
          url: '/api/users/1',
          method: 'GET',
          manual: true
        }
      });

      // Execute manual fetch
      await element.$userData.fetch();

      // Run all pending timers and microtasks
      vi.runAllTicks();

      // Verify fetch was called
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify state was updated
      const state = element.$userData.get();
      expect(state).toEqual({ id: 1, name: 'John' });
    });

    test('should handle fetch errors', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValue(error);

      const element = createElement({
        tagName: 'div',
        $userData: {
          prototype: 'Request',
          url: '/api/users/1',
          manual: true
        }
      });

      await element.$userData.fetch();
      vi.runAllTicks();

      const state = element.$userData.get();
      expect(state).toEqual({ error: 'Network error' });
    });

    test('should handle JSON parsing errors gracefully', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: vi.fn().mockResolvedValue('plain text response')
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $userData: {
          prototype: 'Request',
          url: '/api/users/1',
          manual: true
        }
      });

      await element.$userData.fetch();
      vi.runAllTicks();

      const state = element.$userData.get();
      expect(state).toEqual({ error: 'Invalid JSON' });
    });
  });

  describe('Request Configuration Processing', () => {
    test('should process template literals in URL', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ success: true })
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Create element with reactive property
      const element = createElement({
        tagName: 'div',
        $userId: 123,
        $userData: {
          prototype: 'Request',
          url: '/api/users/${this.$userId.get()}',
          manual: true
        }
      });

      await element.$userData.fetch();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      // Check that the URL was resolved correctly
      expect(fetchCall[0].url).toContain('/api/users/123');
    });

    test('should serialize object body as JSON', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('success')
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $userData: {
          prototype: 'Request',
          url: '/api/users',
          method: 'POST',
          body: {
            name: 'John',
            age: 30
          },
          manual: true
        }
      });

      await element.$userData.fetch();
      vi.runAllTicks();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      const request = fetchCall[0];

      // Check that Content-Type header was set
      expect(request.headers.get('Content-Type')).toBe('application/json');
    });

    test('should support standard Request constructor options', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('success')
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $postRequest: {
          prototype: 'Request',
          url: '/api/post',
          method: 'POST',
          headers: {
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'include',
          manual: true
        }
      });

      await element.$postRequest.fetch();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const fetchCall = mockFetch.mock.calls[0];
      const request = fetchCall[0];

      expect(request.method).toBe('POST');
      expect(request.mode).toBe('cors');
      expect(request.credentials).toBe('include');
    });
  });

  describe('Response Type Handling', () => {
    test('should handle JSON responses', async () => {
      const jsonData = { id: 1, name: 'John' };
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(jsonData)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $userData: {
          prototype: 'Request',
          url: '/api/users/1',
          manual: true
        }
      });

      await element.$userData.fetch();
      vi.runAllTicks();

      const state = element.$userData.get();
      expect(state).toEqual(jsonData);
    });

    test('should handle text responses', async () => {
      const textData = 'plain text response';
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: vi.fn().mockResolvedValue(textData)
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $userData: {
          prototype: 'Request',
          url: '/api/text',
          manual: true
        }
      });

      await element.$userData.fetch();
      vi.runAllTicks();

      const state = element.$userData.get();
      expect(state).toBe(textData);
    });
  });

  describe('Delay/Debounce Functionality', () => {
    test('should support debounce property for auto requests', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ success: true })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $searchQuery: '',
        $searchResults: {
          prototype: 'Request',
          url: '/api/search?q=${this.$searchQuery.get()}',
          debounce: 100 // 100ms debounce
          // manual is false by default (auto-enabled)
        }
      });

      // Should not fire immediately
      element.$searchQuery.set('test');
      expect(mockFetch).not.toHaveBeenCalled();

      // Advance timers by the debounce amount
      vi.advanceTimersByTime(100);
      vi.runAllTicks();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0].url).toContain('q=test');
    });
  });

  describe('Namespace Handler Registry', () => {
    test('should have Request handler registered via createElement', () => {
      // Test that Request namespace handler works by creating an element
      const element = createElement({
        tagName: 'div',
        $testRequest: { prototype: 'Request', url: '/api/test', manual: true }
      });
      
      expect(element.$testRequest).toBeDefined();
      expect(Signal.isState(element.$testRequest)).toBe(true);
      expect(typeof element.$testRequest.fetch).toBe('function');
    });
  });
});