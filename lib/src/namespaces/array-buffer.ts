/**
 * ArrayBuffer Namespace Handler
 * 
 * Creates reactive ArrayBuffer objects from declarative configuration with automatic
 * rebuilding when source data changes. Enables dynamic binary data management
 * with full integration into DDOM's reactive property system.
 * 
 * @example
 * ```typescript
 * // Create reactive ArrayBuffer from string data
 * const textData = new Signal.State('Hello World');
 * adoptNode({
 *   buffer: {
 *     prototype: 'ArrayBuffer',
 *     data: '${this.textData}',
 *     length: null // Auto-calculated from data
 *   },
 *   textData: textData
 * }, element);
 * 
 * // ArrayBuffer automatically updates when data changes
 * textData.set('Updated content');
 * ```
 * 
 * @module namespaces/array-buffer
 */

import { Signal } from '../core/signals';
import { processProperty } from '../core/properties';
import { PrototypeConfig } from './types';

/**
 * ArrayBufferConfig Type Definition
 * Local configuration interface for ArrayBuffer namespace
 */
export interface ArrayBufferConfig extends PrototypeConfig {
  prototype: 'ArrayBuffer';
  data?: string | number[] | ArrayBuffer;
  length?: number;
}

/**
 * ArrayBufferSignal Type Definition
 * A Signal.Computed for reactive ArrayBuffer objects.
 * Automatically rebuilds ArrayBuffer when source data changes.
 */
export interface ArrayBufferSignal extends Signal.Computed<ArrayBuffer> {
  // Inherits all Signal.Computed methods
}

/**
 * Creates a reactive ArrayBuffer namespace that rebuilds when configuration changes.
 * Processes source data through the DDOM property system, enabling reactive binary
 * data that automatically updates when dependencies change.
 * 
 * @param config - The validated ArrayBuffer configuration object
 * @param key - The property name being processed (for debugging)
 * @param element - The element context for property resolution
 * @returns A computed signal containing the reactive ArrayBuffer object
 * 
 * @example
 * ```typescript
 * const bufferSignal = createArrayBufferNamespace({
 *   prototype: 'ArrayBuffer',
 *   data: [72, 101, 108, 108, 111], // "Hello" as byte array
 *   length: 5
 * }, 'binaryData', element);
 * 
 * const buffer = bufferSignal.get();
 * console.log(buffer.byteLength); // 5
 * ```
 */
export const createArrayBufferNamespace = (
  config: ArrayBufferConfig,
  key: string,
  element: any
): ArrayBufferSignal => {

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
};