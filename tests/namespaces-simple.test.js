import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createElement, Signal } from '../lib/dist/index.js';
import { isNamespacedProperty, extractNamespace } from '../lib/dist/index.js';

describe('Namespaced Properties - Basic Tests', () => {
  beforeEach(() => {
    // Reset any global state
    document.body.innerHTML = '';
  });

  describe('Namespace Detection', () => {
    test('should detect valid namespaced properties', () => {
      expect(isNamespacedProperty({ Request: { url: '/api/users' } })).toBe(true);
    });

    test('should reject invalid namespaced properties', () => {
      expect(isNamespacedProperty('string')).toBe(false);
      expect(isNamespacedProperty({ Request: { url: '/api' }, other: 'value' })).toBe(false);
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
  });

  describe('Basic Request Signal Creation', () => {
    test('should create a request signal with manual trigger', () => {
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

      expect(typeof element.$userData.fetch).toBe('function');
    });
  });
});