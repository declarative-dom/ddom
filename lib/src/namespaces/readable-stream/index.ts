/**
 * ReadableStream Namespace Handler
 * 
 * Creates reactive ReadableStream objects from configuration.
 */

import { Signal } from '../../core/signals';
import { processProperty } from '../../core/properties';
import { PrototypeConfig, validateNamespaceConfig, createNamespaceHandler } from '../index';

/**
 * Configuration interface for ReadableStream
 */
interface ReadableStreamConfig extends PrototypeConfig {
  prototype: 'ReadableStream';
  source?: ReadableStreamDefaultController;
  data?: any[];
}

/**
 * Creates reactive ReadableStream objects
 */
export const createReadableStreamNamespace = createNamespaceHandler(
  (config: any, key: string): config is ReadableStreamConfig =>
    validateNamespaceConfig(config, key) &&
    config.prototype === 'ReadableStream',
  
  (config: ReadableStreamConfig, key: string, element: any) => {
    const computedStream = new Signal.Computed(() => {
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
      
      // Build ReadableStream from resolved config
      if (resolvedConfig.source?.start) {
        return new ReadableStream(resolvedConfig.source);
      } else if (resolvedConfig.data) {
        const data = resolvedConfig.data;
        return new ReadableStream({
          start(controller) {
            if (Array.isArray(data)) {
              data.forEach(chunk => controller.enqueue(chunk));
            } else if (typeof data === 'string') {
              controller.enqueue(new TextEncoder().encode(data));
            } else {
              controller.enqueue(data);
            }
            controller.close();
          }
        });
      }
      
      return new ReadableStream({ start: (controller) => controller.close() });
    });
    
    return computedStream;
  }
);