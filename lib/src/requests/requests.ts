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
  
  // Perform the fetch
  fetch(request)
    .then(async response => {
      // Try to parse as JSON first, fall back to text
      try {
        const data = await response.json();
        resultSignal.set(data);
      } catch {
        const data = await response.text();
        resultSignal.set(data);
      }
    })
    .catch(error => {
      console.warn('Fetch error:', error);
      resultSignal.set({ error: error.message });
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
  return () => {};
}