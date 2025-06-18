import { Signal } from '../events';
import { registerNamespaceHandler, type NamespaceHandler } from '../namespaces';

/**
 * Interface for Request namespace specification
 */
export interface RequestSpec {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  mode?: RequestMode;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  signal?: { AbortController: any };
}

/**
 * Creates a fetch signal that automatically fetches and stores the result
 * 
 * @param request - The Request object to fetch
 * @returns A Signal containing the fetch result
 */
function createFetchSignal(request: Request): Signal.State<any> {
  // Create a signal to hold the result
  const resultSignal = new Signal.State<any>(null);
  
  // Clone the request to avoid issues with body consumption
  let fetchRequest: Request;
  try {
    fetchRequest = request.clone();
  } catch (error) {
    // If cloning fails (e.g., body already consumed), create a new request
    fetchRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      referrerPolicy: request.referrerPolicy,
      integrity: request.integrity,
      keepalive: request.keepalive,
      signal: request.signal
    });
  }
  
  // Perform the fetch
  fetch(fetchRequest)
    .then(async response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Try to parse as JSON first, fall back to text
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const data = await response.json();
          resultSignal.set(data);
        } catch (parseError) {
          // JSON parsing failed, try text
          const data = await response.text();
          resultSignal.set(data);
        }
      } else {
        // Not JSON content type, get as text
        const data = await response.text();
        resultSignal.set(data);
      }
    })
    .catch(error => {
      console.warn('Fetch error:', error);
      resultSignal.set({ 
        error: error.message,
        type: 'fetch_error',
        timestamp: new Date().toISOString()
      });
    });
  
  return resultSignal;
}

/**
 * Converts a Request specification to a native Request object
 * @param spec - The Request specification
 * @returns A native Request object
 */
function convertToNativeRequest(spec: RequestSpec): Request {
  const init: RequestInit = {};

  // Copy basic properties
  if (spec.method) init.method = spec.method;
  if (spec.headers) init.headers = spec.headers;
  if (spec.mode) init.mode = spec.mode;
  if (spec.credentials) init.credentials = spec.credentials;
  if (spec.cache) init.cache = spec.cache;
  if (spec.redirect) init.redirect = spec.redirect;
  if (spec.referrer) init.referrer = spec.referrer;
  if (spec.referrerPolicy) init.referrerPolicy = spec.referrerPolicy;
  if (spec.integrity) init.integrity = spec.integrity;
  if (spec.keepalive !== undefined) init.keepalive = spec.keepalive;

  // Handle AbortController
  if (spec.signal?.AbortController) {
    init.signal = new AbortController().signal;
  }

  // Handle body conversion
  if (spec.body !== undefined) {
    init.body = convertBodyToNative(spec.body);
  }

  return new Request(spec.url, init);
}

/**
 * Converts specification body to native body format
 * @param body - The body specification
 * @returns The native body format
 */
function convertBodyToNative(body: any): BodyInit | null {
  if (body === null || body === undefined) {
    return null;
  }

  // Handle FormData wrapper
  if (body.FormData && typeof body.FormData === 'object') {
    const formData = new FormData();
    for (const [key, value] of Object.entries(body.FormData)) {
      formData.append(key, value as string | Blob);
    }
    return formData;
  }

  // Handle URLSearchParams wrapper
  if (body.URLSearchParams && typeof body.URLSearchParams === 'object') {
    return new URLSearchParams(body.URLSearchParams);
  }

  // Handle Blob wrapper
  if (body.Blob && typeof body.Blob === 'object') {
    return new Blob([body.Blob.content], { type: body.Blob.type });
  }

  // Handle ArrayBuffer wrapper
  if (body.ArrayBuffer && Array.isArray(body.ArrayBuffer)) {
    return new Uint8Array(body.ArrayBuffer).buffer;
  }

  // Handle ReadableStream wrapper (basic implementation)
  if (body.ReadableStream && body.ReadableStream.source) {
    // This is a simplified implementation - in practice, you'd need more complex handling
    console.warn('ReadableStream body conversion is simplified');
    return JSON.stringify(body.ReadableStream.source);
  }

  // Handle objects and arrays - auto-stringify to JSON
  if (typeof body === 'object') {
    return JSON.stringify(body);
  }

  // Handle primitive types as-is
  return body;
}

/**
 * Request namespace handler - handles declarative fetch operations
 * @param el - The DOM element
 * @param property - The property name to bind
 * @param spec - The Request specification
 * @returns Cleanup function
 */
const requestHandler: NamespaceHandler = (el: any, property: string, spec: RequestSpec): (() => void) => {
  const request = convertToNativeRequest(spec);
  const fetchSignal = createFetchSignal(request);
  
  // Set the signal as the property value
  el[property] = fetchSignal;
  
  // Return a no-op cleanup function since the effect is managed internally
  return () => {};
};

// Register the Request namespace handler
registerNamespaceHandler('Request', requestHandler);