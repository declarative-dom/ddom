import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createElement, Signal } from '../lib/dist/index.js';
import { isNamespacedProperty, extractNamespace, NAMESPACE_HANDLERS } from '../lib/dist/index.js';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Namespaced Properties - Request Namespace', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Reset any global state
    document.body.innerHTML = '';
  });

  describe('Namespace Detection', () => {
    test('should detect valid namespaced properties', () => {
      expect(isNamespacedProperty({ Request: { url: '/api/users' } })).toBe(true);
      expect(isNamespacedProperty({ Request: { url: '/api/users', method: 'POST' } })).toBe(true);
    });

    test('should reject invalid namespaced properties', () => {
      expect(isNamespacedProperty('string')).toBe(false);
      expect(isNamespacedProperty(123)).toBe(false);
      expect(isNamespacedProperty(null)).toBe(false);
      expect(isNamespacedProperty(undefined)).toBe(false);
      expect(isNamespacedProperty([])).toBe(false);
      expect(isNamespacedProperty({ Request: { url: '/api' }, other: 'value' })).toBe(false);
      expect(isNamespacedProperty({})).toBe(false);
      expect(isNamespacedProperty({ UnknownNamespace: { url: '/api' } })).toBe(false);
    });

    test('should extract namespace and config correctly', () => {
      const config = { url: '/api/users', method: 'GET' };
      const namespaced = { Request: config };
      
      const extracted = extractNamespace(namespaced);
      expect(extracted).toEqual({
        namespace: 'Request',
        config: config
      });
    });

    test('should return null for invalid namespace extraction', () => {
      expect(extractNamespace('string')).toBe(null);
      expect(extractNamespace({ Request: { url: '/api' }, other: 'value' })).toBe(null);
      expect(extractNamespace({ UnknownNamespace: { url: '/api' } })).toBe(null);
    });
  });

  describe('Request Signal Creation', () => {
    test('should create a request signal with manual trigger', () => {
      const element = createElement({
        tagName: 'div',
        $userData: {
          Request: {
            url: '/api/users',
            disabled: true
          }
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
          Request: {
            url: '/api/users'
            // disabled defaults to false (auto-enabled)
          }
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
          Request: {
            url: '/api/users/1',
            method: 'GET',
            disabled: true
          }
        }
      });

      // Execute manual fetch
      await element.$userData.fetch();

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
          Request: {
            url: '/api/users/1',
            disabled: true
          }
        }
      });

      await element.$userData.fetch();

      const state = element.$userData.get();
      expect(state).toBe(null); // Error handling sets signal to null
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
          Request: {
            url: '/api/users/1',
            disabled: true
          }
        }
      });

      await element.$userData.fetch();

      const state = element.$userData.get();
      expect(state).toBe(mockResponse); // Falls back to response object
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
        $userId: new Signal.State(123),
        $userData: {
          Request: {
            url: '/api/users/${this.$userId.get()}',
            disabled: true
          }
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
          Request: {
            url: '/api/users',
            method: 'POST',
            body: {
              name: 'John',
              age: 30
            },
            disabled: true
          }
        }
      });

      await element.$userData.fetch();

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
          Request: {
            url: '/api/post',
            method: 'POST',
            headers: {
              'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'include',
            disabled: true
          }
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
          Request: {
            url: '/api/users/1',
            disabled: true
          }
        }
      });

      await element.$userData.fetch();

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
          Request: {
            url: '/api/text',
            disabled: true
          }
        }
      });

      await element.$userData.fetch();

      const state = element.$userData.get();
      expect(state).toBe(textData);
    });
  });

  describe('Delay/Debounce Functionality', () => {
    test('should support delay property for auto requests', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ success: true })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $searchQuery: new Signal.State(''),
        $searchResults: {
          Request: {
            url: '/api/search?q=${this.$searchQuery.get()}',
            delay: 100 // 100ms delay (matches Web Animations API pattern)
          }
        }
      });

      // Should not fire immediately
      element.$searchQuery.set('test');
      expect(mockFetch).not.toHaveBeenCalled();

      // Should fire after delay
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      const fetchCall = mockFetch.mock.calls[0];
      expect(fetchCall[0].url).toContain('q=test');
    });
  });

  describe('Namespace Handler Registry', () => {
    test('should have Request handler registered', () => {
      expect(NAMESPACE_HANDLERS.Request).toBeDefined();
      expect(typeof NAMESPACE_HANDLERS.Request).toBe('function');
    });
  });
});