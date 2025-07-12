/**
 * Blob Namespace Handler
 * 
 * Creates reactive Blob objects from declarative configuration with automatic
 * rebuilding when content or options change. Supports all standard Blob constructor
 * options and provides seamless integration with DDOM's reactive system.
 * 
 * @example
 * ```typescript
 * // Create a reactive Blob with dynamic content
 * const textContent = new Signal.State('Hello World');
 * adoptNode({
 *   myBlob: {
 *     prototype: 'Blob',
 *     content: ['${this.textContent}'],
 *     type: 'text/plain'
 *   },
 *   textContent: textContent
 * }, element);
 * 
 * // Blob automatically updates when content changes
 * textContent.set('Updated content');
 * ```
 * 
 * @module namespaces/blob
 */

import { Signal } from '../core/signals';
import { processProperty } from '../core/properties';
import { PrototypeConfig } from './types';

/**
 * BlobConfig Type Definition
 * Local configuration interface for Blob namespace
 */
export interface BlobConfig extends PrototypeConfig {
  prototype: 'Blob';
  content?: any[];
  type?: string;
  endings?: 'transparent' | 'native';
}

/**
 * BlobSignal Type Definition
 * A Signal.Computed for reactive Blob objects.
 * Automatically rebuilds Blob when content or options change.
 */
export interface BlobSignal extends Signal.Computed<Blob> {
  // Inherits all Signal.Computed methods
}

/**
 * Creates a reactive Blob namespace that automatically rebuilds when configuration changes.
 * Processes all configuration properties through the DDOM property system, enabling
 * reactive content and options that update the Blob when dependencies change.
 * 
 * @param config - The validated Blob configuration object
 * @param key - The property name being processed (for debugging)
 * @param element - The element context for property resolution
 * @returns A computed signal containing the reactive Blob object
 * 
 * @example
 * ```typescript
 * const blobSignal = createBlobNamespace({
 *   prototype: 'Blob',
 *   content: ['Dynamic content: ${this.value}'],
 *   type: 'text/plain'
 * }, 'myBlob', element);
 * 
 * console.log(blobSignal.get()); // Blob object
 * ```
 */
export const createBlobNamespace = (
  config: BlobConfig,
  key: string,
  element: any
): BlobSignal => {
  // Config is already validated by the main namespace index
  const computedBlob = new Signal.Computed(() => {
    const resolvedConfig: any = {};
    
    Object.entries(config).forEach(([configKey, configValue]) => {
      if (configKey === 'prototype') {
        resolvedConfig[configKey] = configValue;
        return;
      }
      
      const processed = processProperty(configKey, configValue, element);
      
      if (processed.isValid) {
        resolvedConfig[configKey] = processed.value;
      }
    });
    
    // Build Blob from resolved config
    const content = resolvedConfig.content || [];
    const blobParts = Array.isArray(content) ? content : [content];
    const blobOptions: BlobPropertyBag = {};
    if (resolvedConfig.type) blobOptions.type = resolvedConfig.type;
    if (resolvedConfig.endings) blobOptions.endings = resolvedConfig.endings as EndingType;
    
    return new Blob(blobParts, blobOptions);
  });
  
  return computedBlob;
};