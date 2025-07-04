/**
 * Fetch Implementation
 * 
 * Handles HTTP requests with response type handling and error management.
 */

import { RequestConfig } from '../../types';

/**
 * Performs an HTTP fetch with DDOM-specific handling
 */
export async function performFetch(config: RequestConfig): Promise<any> {
  const { url, responseType = 'json', ...fetchOptions } = config;
  
  // Perform the fetch
  const response = await fetch(url, fetchOptions);
  
  // Handle non-ok responses
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  // Parse response based on responseType
  switch (responseType) {
    case 'json':
      return await response.json();
      
    case 'text':
      return await response.text();
      
    case 'blob':
      return await response.blob();
      
    case 'arraybuffer':
      return await response.arrayBuffer();
      
    case 'document':
      const text = await response.text();
      const parser = new DOMParser();
      return parser.parseFromString(text, 'text/html');
      
    case '':
    default:
      // Return the Response object itself
      return response;
  }
}
