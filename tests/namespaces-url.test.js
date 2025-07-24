import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createElement, Signal } from '../lib/dist/index.js';

describe('Namespaced Properties - URL Namespace', () => {
	beforeEach(() => {
		// Clean up any global state
		document.body.innerHTML = '';
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'nextTick', 'queueMicrotask'] });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('URL Namespace Detection', () => {
		test('should detect valid URL namespaced properties via createElement', () => {
			const element = createElement({
				tagName: 'div',
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com/users'
				}
			});

			expect(element.$apiUrl).toBeDefined();
			expect(Signal.isComputed(element.$apiUrl)).toBe(true);
		});

		test('should handle invalid URL namespaced properties gracefully', () => {
			// Missing base URL should result in null signal
			const element1 = createElement({
				tagName: 'div',
				$invalidUrl: { prototype: 'URL' } // Missing base
			});
			expect(element1.$invalidUrl).toBeNull(); // Should return null for invalid config
		});

		test('should validate URL prototype-based namespace structure', () => {
			const element = createElement({
				tagName: 'div',
				$validUrl: {
					prototype: 'URL',
					base: 'https://api.example.com',
					searchParams: { q: 'test' }
				}
			});

			expect(element.$validUrl).toBeDefined();
			expect(Signal.isComputed(element.$validUrl)).toBe(true);
			expect(element.$validUrl.get()).toContain('https://api.example.com');
		});
	});

	describe('Basic URL Construction', () => {
		test('should create URL from base string', () => {
			const element = createElement({
				tagName: 'div',
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com/users'
				}
			});

			const url = element.$apiUrl.get();
			expect(url).toBe('https://api.example.com/users');
		});

		test('should handle relative URLs with base', () => {
			const element = createElement({
				tagName: 'div',
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com',
					pathname: '/users'
				}
			});

			const url = element.$apiUrl.get();
			expect(url).toBe('https://api.example.com/users');
		});

		test('should handle invalid base URLs gracefully', () => {
			const element = createElement({
				tagName: 'div',
				$invalidUrl: {
					prototype: 'URL',
					base: 'not-a-valid-url'
				}
			});

			const url = element.$invalidUrl.get();
			expect(url).toBe(''); // Should return empty string for invalid URLs
		});
	});

	describe('Search Parameters Handling', () => {
		test('should add search parameters from object', () => {
			const element = createElement({
				tagName: 'div',
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com/search',
					searchParams: {
						q: 'test query',
						limit: 10,
						sort: 'name'
					}
				}
			});

			const url = element.$apiUrl.get();
			const urlObj = new URL(url);

			expect(urlObj.searchParams.get('q')).toBe('test query');
			expect(urlObj.searchParams.get('limit')).toBe('10');
			expect(urlObj.searchParams.get('sort')).toBe('name');
		});

		test('should be invalid with null and undefined search parameters', () => {
			const element = createElement({
				tagName: 'div',
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com/search',
					searchParams: {
						q: 'test',
						filter: null,
						sort: undefined,
						limit: 10
					}
				}
			});

			const url = element.$apiUrl.get();
			expect(url).toBeFalsy();
		});

		test('should handle falsy values that are not null/undefined', () => {
			const element = createElement({
				tagName: 'div',
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com/search',
					searchParams: {
						q: '',
						enabled: false,
						count: 0
					}
				}
			});

			const url = element.$apiUrl.get();
			const urlObj = new URL(url);

			expect(urlObj.searchParams.get('q')).toBe('');
			expect(urlObj.searchParams.get('enabled')).toBe('false');
			expect(urlObj.searchParams.get('count')).toBe('0');
		});
	});

	describe('Reactive URL Construction', () => {
		test('should reactively update URL when signals change', () => {
			const element = createElement({
				tagName: 'div',
				$searchQuery: 'initial',
				$pageLimit: 10,
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com/search',
					searchParams: {
						q: '${this.$searchQuery.get()}',
						limit: '${this.$pageLimit.get()}'
					}
				}
			});

			// Initial URL
			let url = element.$apiUrl.get();
			let urlObj = new URL(url);
			expect(urlObj.searchParams.get('q')).toBe('initial');
			expect(urlObj.searchParams.get('limit')).toBe('10');

			// Update search query
			element.$searchQuery.set('new query');
			url = element.$apiUrl.get();
			urlObj = new URL(url);
			expect(urlObj.searchParams.get('q')).toBe('new query');
			expect(urlObj.searchParams.get('limit')).toBe('10');

			// Update limit
			element.$pageLimit.set(20);
			url = element.$apiUrl.get();
			urlObj = new URL(url);
			expect(urlObj.searchParams.get('q')).toBe('new query');
			expect(urlObj.searchParams.get('limit')).toBe('20');
		});

		test('should handle reactive base URL', () => {
			const element = createElement({
				tagName: 'div',
				$baseUrl: 'https://api.example.com',
				$apiUrl: {
					prototype: 'URL',
					base: '${this.$baseUrl.get()}/users',
					searchParams: {
						sort: 'name'
					}
				}
			});

			// Initial URL
			let url = element.$apiUrl.get();
			expect(url).toContain('https://api.example.com/users');
			expect(url).toContain('sort=name');

			// Update base URL
			element.$baseUrl.set('https://staging-api.example.com');
			url = element.$apiUrl.get();
			expect(url).toContain('https://staging-api.example.com/users');
			expect(url).toContain('sort=name');
		});
	});

	describe('Hash and Pathname Handling', () => {
		test('should add hash fragment', () => {
			const element = createElement({
				tagName: 'div',
				$pageUrl: {
					prototype: 'URL',
					base: 'https://example.com/page',
					hash: 'section1'
				}
			});

			const url = element.$pageUrl.get();
			expect(url).toBe('https://example.com/page#section1');
		});

		test('should add pathname', () => {
			const element = createElement({
				tagName: 'div',
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com',
					pathname: '/v2/users/123'
				}
			});

			const url = element.$apiUrl.get();
			expect(url).toBe('https://api.example.com/v2/users/123');
		});

		test('should combine pathname, searchParams, and hash', () => {
			const element = createElement({
				tagName: 'div',
				$complexUrl: {
					prototype: 'URL',
					base: 'https://example.com',
					pathname: '/products',
					searchParams: {
						category: 'electronics',
						sort: 'price'
					},
					hash: 'reviews'
				}
			});

			const url = element.$complexUrl.get();
			const urlObj = new URL(url);

			expect(urlObj.pathname).toBe('/products');
			expect(urlObj.searchParams.get('category')).toBe('electronics');
			expect(urlObj.searchParams.get('sort')).toBe('price');
			expect(urlObj.hash).toBe('#reviews');
		});
	});

	describe('Integration with Request Namespace', () => {
		test('should work as URL property in Request namespace', () => {
			const element = createElement({
				tagName: 'div',
				$userId: 123,
				$apiRequest: {
					prototype: 'Request',
					url: {
						prototype: 'URL',
						base: 'https://api.example.com/users',
						searchParams: {
							id: '${this.$userId.get()}',
							include: 'profile'
						}
					},
					manual: true
				}
			});

			expect(element.$apiRequest).toBeDefined();
			expect(typeof element.$apiRequest.fetch).toBe('function');
		});
	});

	describe('Edge Cases', () => {
		test('should handle empty search parameters object', () => {
			const element = createElement({
				tagName: 'div',
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com/users',
					searchParams: {}
				}
			});

			const url = element.$apiUrl.get();
			expect(url).toBe('https://api.example.com/users');
		});

		test('should handle missing searchParams property', () => {
			const element = createElement({
				tagName: 'div',
				$apiUrl: {
					prototype: 'URL',
					base: 'https://api.example.com/users'
					// No searchParams property
				}
			});

			const url = element.$apiUrl.get();
			expect(url).toBe('https://api.example.com/users');
		});

		test('should handle complex nested reactive dependencies', () => {
			const element = createElement({
				tagName: 'div',
				$environment: 'staging',
				$version: 'v2',
				$userId: 456,
				$includeProfile: true
			});

			// Add computed URL that depends on the signals
			element.$complexUrl = new Signal.Computed(() => {
				const env = element.$environment.get();
				const version = element.$version.get();
				const userId = element.$userId.get();
				const includeProfile = element.$includeProfile.get();

				const url = new URL(`https://${env}-api.example.com`);
				url.pathname = `/${version}/users/${userId}`;
				url.searchParams.set('include', includeProfile ? 'profile,settings' : 'basic');
				url.searchParams.set('format', 'json');
				url.hash = `section-${userId}`;

				return url.toString();
			});

			let url = element.$complexUrl.get();
			let urlObj = new URL(url);

			expect(urlObj.hostname).toBe('staging-api.example.com');
			expect(urlObj.pathname).toBe('/v2/users/456');
			expect(urlObj.searchParams.get('include')).toBe('profile,settings');
			expect(urlObj.hash).toBe('#section-456');

			// Update environment
			element.$environment.set('production');
			url = element.$complexUrl.get();
			urlObj = new URL(url);
			expect(urlObj.hostname).toBe('production-api.example.com');

			// Update include flag
			element.$includeProfile.set(false);
			url = element.$complexUrl.get();
			urlObj = new URL(url);
			expect(urlObj.searchParams.get('include')).toBe('basic');
		});
	});
});