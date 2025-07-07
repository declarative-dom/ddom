/**
 * ReadableStream Namespace Handler
 * 
 * Creates reactive ReadableStream objects from configuration.
 */

import { Signal } from '../../core/signals';
import { processProperty } from '../../core/properties';
import { PrototypeConfig } from '../types';

/**
 * ReadableStreamConfig Type Definition
 * Local configuration interface for ReadableStream namespace
 */
export interface ReadableStreamConfig extends PrototypeConfig {
  prototype: 'ReadableStream';
  source?: ReadableStreamDefaultController;
  data?: any[];
}

/**
 * ReadableStreamSignal Type Definition
 * A Signal.Computed for reactive ReadableStream objects.
 * Automatically rebuilds stream when source data or strategy changes.
 */
export interface ReadableStreamSignal extends Signal.Computed<ReadableStream> {
  // Inherits all Signal.Computed methods
}

/**
 * Creates reactive ReadableStream objects
 */
export const createReadableStreamNamespace = (
  config: ReadableStreamConfig,
  key: string,
  element: any
): ReadableStreamSignal => {
  // Config is already validated by the main namespace index

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
};