import {
  Signal,
  createEffect
} from '../events';

/**
 * Detects if a value is a Request object
 * @param value - The value to check
 * @returns True if the value is a Request object
 */
export function isRequest(value: any): value is Request {
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
 * Sets up reactive fetch binding for a property.
 * Creates a fetch effect that fetches the Request and stores the result.
 * 
 * @param el - The DOM element
 * @param property - The property name to bind
 * @param request - The Request object
 * @returns A cleanup function to dispose of the effect
 */
export function bindRequestProperty(
  el: any,
  property: string,
  request: Request
): () => void {
  const fetchSignal = createFetchSignal(request);
  
  // Set the signal as the property value
  el[property] = fetchSignal;
  
  // Return a no-op cleanup function since the effect is managed internally
  // In the future, this could return an actual cleanup function if we add
  // request cancellation or other cleanup logic
  return () => {};
}