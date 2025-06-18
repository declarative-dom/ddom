import {
  Signal,
  createEffect
} from '../events';

/**
 * Interface for DDOM Request object specification
 */
export interface DDOMRequestSpec {
  Request: {
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
  };
}

/**
 * Detects if a value is a DDOM Request specification object
 * @param value - The value to check
 * @returns True if the value is a DDOM Request object
 */
export function isRequest(value: any): value is DDOMRequestSpec {
  return value && 
         typeof value === 'object' && 
         value.Request && 
         typeof value.Request === 'object' &&
         typeof value.Request.url === 'string';
}

/**
 * Detects if a value is a native Request object (legacy support)
 * @param value - The value to check
 * @returns True if the value is a native Request object
 */
export function isNativeRequest(value: any): value is Request {
  return value instanceof Request;
}

/**
 * Creates a fetch signal for a Request object that automatically fetches
 * when the Request is processed, and stores the result in a Signal
 * 
 * @param request - The Request object to fetch
 * @returns A Signal containing the fetch result
 */
export function createFetchSignal(request: Request): Signal.State<any> {
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
 * Converts a DDOM Request specification to a native Request object
 * @param spec - The DDOM Request specification
 * @returns A native Request object
 */
export function convertDDOMRequestToNative(spec: DDOMRequestSpec): Request {
  const requestSpec = spec.Request;
  const init: RequestInit = {};

  // Copy basic properties
  if (requestSpec.method) init.method = requestSpec.method;
  if (requestSpec.headers) init.headers = requestSpec.headers;
  if (requestSpec.mode) init.mode = requestSpec.mode;
  if (requestSpec.credentials) init.credentials = requestSpec.credentials;
  if (requestSpec.cache) init.cache = requestSpec.cache;
  if (requestSpec.redirect) init.redirect = requestSpec.redirect;
  if (requestSpec.referrer) init.referrer = requestSpec.referrer;
  if (requestSpec.referrerPolicy) init.referrerPolicy = requestSpec.referrerPolicy;
  if (requestSpec.integrity) init.integrity = requestSpec.integrity;
  if (requestSpec.keepalive !== undefined) init.keepalive = requestSpec.keepalive;

  // Handle AbortController
  if (requestSpec.signal && requestSpec.signal.AbortController) {
    init.signal = new AbortController().signal;
  }

  // Handle body conversion
  if (requestSpec.body !== undefined) {
    init.body = convertBodyToNative(requestSpec.body);
  }

  return new Request(requestSpec.url, init);
}

/**
 * Converts DDOM body specification to native body format
 * @param body - The DDOM body specification
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
 * Sets up reactive fetch binding for a property.
 * Creates a fetch effect that fetches the Request and stores the result.
 * 
 * @param el - The DOM element
 * @param property - The property name to bind
 * @param requestSpec - The Request object or DDOM Request specification
 * @returns A cleanup function to dispose of the effect
 */
export function bindRequestProperty(
  el: any,
  property: string,
  requestSpec: Request | DDOMRequestSpec
): () => void {
  let request: Request;
  
  // Convert DDOM Request spec to native Request if needed
  if (isNativeRequest(requestSpec)) {
    request = requestSpec;
  } else if (isRequest(requestSpec)) {
    request = convertDDOMRequestToNative(requestSpec);
  } else {
    throw new Error('Invalid request specification');
  }
  
  const fetchSignal = createFetchSignal(request);
  
  // Set the signal as the property value
  el[property] = fetchSignal;
  
  // Return a no-op cleanup function since the effect is managed internally
  // In the future, this could return an actual cleanup function if we add
  // request cancellation or other cleanup logic
  return () => {};
}