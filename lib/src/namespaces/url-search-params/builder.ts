/**
 * URLSearchParams Builder
 * 
 * Constructs URLSearchParams objects from DDOM configuration.
 */

/**
 * Builds a URLSearchParams object from configuration
 */
export function buildURLSearchParams(config: any): URLSearchParams {
  const params = new URLSearchParams();
  
  Object.entries(config).forEach(([key, value]) => {
    if (key === 'prototype') return;
    
    if (Array.isArray(value)) {
      // Add multiple values for the same key
      value.forEach(item => {
        if (item != null) {
          params.append(key, String(item));
        }
      });
    } else if (value != null) {
      // Add single value
      params.set(key, String(value));
    }
  });
  
  return params;
}
