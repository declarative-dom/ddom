/**
 * ArrayBuffer Namespace Handler
 * 
 * Creates reactive ArrayBuffer objects from configuration.
 */

import { Signal } from '../../core/signals';
import { processProperty } from '../../core/properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';

/**
 * Configuration interface for ArrayBuffer
 */
interface ArrayBufferConfig extends PrototypeConfig {
  prototype: 'ArrayBuffer';
  data?: string | number[] | ArrayBuffer;
  length?: number;
}

/**
 * Creates reactive ArrayBuffer objects
 */
export const createArrayBufferNamespace = createNamespaceHandler(
  (config: any, key: string): config is ArrayBufferConfig =>
    validateNamespaceConfig(config, key) &&
    config.prototype === 'ArrayBuffer',
  
  (config: ArrayBufferConfig, key: string, element: any) => {
    const computedArrayBuffer = new Signal.Computed(() => {
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
      
      // Build ArrayBuffer from resolved config
      const data = resolvedConfig.data;
      if (data instanceof ArrayBuffer) return data;
      if (data instanceof Uint8Array) return data.buffer;
      if (Array.isArray(data)) return new Uint8Array(data).buffer;
      if (typeof data === 'string') return new TextEncoder().encode(data).buffer;
      if (resolvedConfig.length) return new ArrayBuffer(resolvedConfig.length);
      
      return new ArrayBuffer(0);
    });
    
    return computedArrayBuffer;
  }
);