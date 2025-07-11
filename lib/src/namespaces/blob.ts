/**
 * Blob Namespace Handler
 * 
 * Creates reactive Blob objects from configuration.
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
 * Creates reactive Blob objects
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