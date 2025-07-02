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
    test('should create a request signal with initial state', () => {
      const element = createElement({
        tagName: 'div',
        $userData: {
          Request: {
            url: '/api/users',
            trigger: 'manual'
          }
        }
      });

      expect(element.$userData).toBeDefined();
      expect(Signal.isState(element.$userData)).toBe(true);
      
      const state = element.$userData.get();
      expect(state).toEqual({
        loading: false,
        data: null,
        error: null,
        response: null,
        lastFetch: 0
      });
    });

    test('should add fetch method to manual trigger signals', () => {
      const element = createElement({
        tagName: 'div',
        $userData: {
          Request: {
            url: '/api/users',
            trigger: 'manual'
          }
        }
      });

      expect(typeof element.$userData.fetch).toBe('function');
    });

    test('should handle missing url gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const element = createElement({
        tagName: 'div',
        $invalidRequest: {
          Request: {
            method: 'GET'
            // missing url
          }
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Request configuration missing required "url" property')
      );
      
      consoleSpy.mockRestore();
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
            trigger: 'manual'
          }
        }
      });

      // Execute manual fetch
      await element.$userData.fetch();

      // Verify fetch was called with correct parameters
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [request] = mockFetch.mock.calls[0];
      expect(request.url).toContain('/api/users/1');
      expect(request.method).toBe('GET');

      // Verify state was updated
      const state = element.$userData.get();
      expect(state.loading).toBe(false);
      expect(state.data).toEqual({ id: 1, name: 'John' });
      expect(state.error).toBe(null);
      expect(state.response).toBe(mockResponse);
      expect(state.lastFetch).toBeGreaterThan(0);
    });

    test('should handle fetch errors', async () => {
      const error = new Error('Network error');
      mockFetch.mockRejectedValue(error);

      const element = createElement({
        tagName: 'div',
        $userData: {
          Request: {
            url: '/api/users/1',
            trigger: 'manual'
          }
        }
      });

      await element.$userData.fetch();

      const state = element.$userData.get();
      expect(state.loading).toBe(false);
      expect(state.data).toBe(null);
      expect(state.error).toBe(error);
      expect(state.lastFetch).toBeGreaterThan(0);
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
            trigger: 'manual'
          }
        }
      });

      await element.$userData.fetch();

      const state = element.$userData.get();
      expect(state.loading).toBe(false);
      expect(state.data).toBe(mockResponse); // Falls back to response object
      expect(state.error).toBe(null);
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
            trigger: 'manual'
          }
        }
      });

      await element.$userData.fetch();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [request] = mockFetch.mock.calls[0];
      expect(request.url).toContain('/api/users/123');
    });

    test('should process template literals in headers', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('success')
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $token: new Signal.State('abc123'),
        $userData: {
          Request: {
            url: '/api/users',
            headers: {
              'Authorization': 'Bearer ${this.$token.get()}'
            },
            trigger: 'manual'
          }
        }
      });

      await element.$userData.fetch();

      const [request] = mockFetch.mock.calls[0];
      expect(request.headers.get('Authorization')).toBe('Bearer abc123');
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
            trigger: 'manual'
          }
        }
      });

      await element.$userData.fetch();

      const [request] = mockFetch.mock.calls[0];
      expect(request.headers.get('Content-Type')).toBe('application/json');
      
      // Check that body was serialized to JSON
      const bodyText = await request.text();
      expect(JSON.parse(bodyText)).toEqual({ name: 'John', age: 30 });
    });

    test('should preserve existing Content-Type header', async () => {
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
            headers: {
              'Content-Type': 'application/xml'
            },
            body: {
              name: 'John'
            },
            trigger: 'manual'
          }
        }
      });

      await element.$userData.fetch();

      const [request] = mockFetch.mock.calls[0];
      expect(request.headers.get('Content-Type')).toBe('application/xml');
    });
  });

  describe('Auto Trigger Mode', () => {
    test('should automatically trigger when dependencies change', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ id: 1, name: 'John' })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $userId: new Signal.State(1),
        $userData: {
          Request: {
            url: '/api/users/${this.$userId.get()}'
            // trigger defaults to 'auto'
          }
        }
      });

      // Wait for auto-trigger to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Change the dependency
      mockFetch.mockClear();
      element.$userId.set(2);

      // Wait for auto-trigger to execute again
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [request] = mockFetch.mock.calls[0];
      expect(request.url).toContain('/api/users/2');
    });

    test('should not trigger when required values are missing', async () => {
      const element = createElement({
        tagName: 'div',
        $userId: new Signal.State(null), // Missing required value
        $userData: {
          Request: {
            url: '/api/users/${this.$userId.get()}'
          }
        }
      });

      // Wait to ensure no request is made
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should trigger once required values become available', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ success: true })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $userId: new Signal.State(null),
        $userData: {
          Request: {
            url: '/api/users/${this.$userId.get()}'
          }
        }
      });

      // Initially no request should be made
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockFetch).not.toHaveBeenCalled();

      // Set the required value
      element.$userId.set(123);

      // Now request should be triggered
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Debounced Requests', () => {
    test('should debounce rapid changes', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ success: true })
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $query: new Signal.State('initial'),
        $searchResults: {
          Request: {
            url: '/api/search?q=${this.$query.get()}',
            debounce: 100 // 100ms debounce
          }
        }
      });

      // Rapidly change the query
      element.$query.set('a');
      element.$query.set('ab');
      element.$query.set('abc');

      // Should not have triggered yet due to debounce
      expect(mockFetch).not.toHaveBeenCalled();

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have triggered once with the final value
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [request] = mockFetch.mock.calls[0];
      expect(request.url).toContain('q=abc');
    });
  });

  describe('Namespace Handler Registry', () => {
    test('should have Request handler registered', () => {
      expect(NAMESPACE_HANDLERS.Request).toBeDefined();
      expect(typeof NAMESPACE_HANDLERS.Request).toBe('function');
    });

    test('should handle unknown namespaces gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const element = createElement({
        tagName: 'div',
        $unknownNamespace: {
          UnknownNamespace: {
            config: 'value'
          }
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No handler found for namespace "UnknownNamespace"')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Standard Request Options', () => {
    test('should support all standard Request constructor options', async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers(),
        text: vi.fn().mockResolvedValue('success')
      };
      mockFetch.mockResolvedValue(mockResponse);

      const element = createElement({
        tagName: 'div',
        $comprehensiveRequest: {
          Request: {
            url: '/api/comprehensive',
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: { data: 'test' },
            mode: 'cors',
            credentials: 'include',
            cache: 'no-cache',
            redirect: 'follow',
            referrer: 'no-referrer',
            referrerPolicy: 'no-referrer',
            integrity: 'sha384-abc123',
            keepalive: true,
            trigger: 'manual'
          }
        }
      });

      await element.$comprehensiveRequest.fetch();

      const [request] = mockFetch.mock.calls[0];
      expect(request.method).toBe('POST');
      expect(request.mode).toBe('cors');
      expect(request.credentials).toBe('include');
      expect(request.cache).toBe('no-cache');
      expect(request.redirect).toBe('follow');
      expect(request.referrer).toBe('no-referrer');
      expect(request.referrerPolicy).toBe('no-referrer');
      expect(request.integrity).toBe('sha384-abc123');
      expect(request.keepalive).toBe(true);
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
            trigger: 'manual'
          }
        }
      });

      await element.$userData.fetch();

      const state = element.$userData.get();
      expect(state.data).toEqual(jsonData);
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
            trigger: 'manual'
          }
        }
      });

      await element.$userData.fetch();

      const state = element.$userData.get();
      expect(state.data).toBe(textData);
    });
  });
});