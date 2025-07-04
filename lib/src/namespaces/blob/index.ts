/**
 * Blob Namespace Handler
 * 
 * Creates reactive Blob objects from configuration.
 */

import { Signal } from '../../signals';
import { resolvePropertyValue, evaluatePropertyValue } from '../../properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';

/**
 * Configuration interface for Blob
 */
interface BlobConfig extends PrototypeConfig {
  prototype: 'Blob';
  content?: any[];
  type?: string;
  endings?: 'transparent' | 'native';
}

/**
 * Creates reactive Blob objects
 */
export const createBlobNamespace = createNamespaceHandler(
  (config: any, key: string): config is BlobConfig =>
    validateNamespaceConfig(config, key) &&
    config.prototype === 'Blob',
  
  (config: BlobConfig, key: string, element: any) => {
    const computedBlob = new Signal.Computed(() => {
      const resolvedConfig: any = {};
      
      Object.entries(config).forEach(([configKey, configValue]) => {
        if (configKey === 'prototype') {
          resolvedConfig[configKey] = configValue;
          return;
        }
        
        const resolved = resolvePropertyValue(configKey, configValue, element);
        const { value, isValid } = evaluatePropertyValue(resolved);
        
        if (isValid) {
          resolvedConfig[configKey] = value;
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
  }
);