/**
 * Signal Type Definitions
 * 
 * Type definitions for reactive signals used in DDOM.
 * These extend the base Signal types with namespace-specific capabilities.
 */

/**
 * RequestSignal Type Definition
 * A Signal.State that extends with fetch capabilities for manual request triggering.
 * Contains the parsed response data directly and provides a fetch method for manual execution.
 */
export interface RequestSignal<T = any> extends Signal.State<T> {
  fetch(): Promise<void>;             // Manual fetch trigger
}

/**
 * StorageSignal Type Definition
 * A Signal.State for storage operations (localStorage, sessionStorage, cookies).
 * Contains the deserialized value and automatically syncs with the underlying storage.
 */
export interface StorageSignal<T = any> extends Signal.State<T> {
  // Inherits all Signal.State methods - no additional methods needed
  // The reactivity and storage sync happens automatically
}

/**
 * FormDataSignal Type Definition
 * A Signal.Computed for reactive FormData objects.
 * Automatically rebuilds FormData when source properties change.
 */
export interface FormDataSignal extends Signal.Computed<FormData> {
  // Inherits all Signal.Computed methods
}

/**
 * URLSearchParamsSignal Type Definition
 * A Signal.Computed for reactive URLSearchParams objects.
 * Automatically rebuilds URLSearchParams when source properties change.
 */
export interface URLSearchParamsSignal extends Signal.Computed<URLSearchParams> {
  // Inherits all Signal.Computed methods
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
 * ArrayBufferSignal Type Definition
 * A Signal.Computed for reactive ArrayBuffer objects.
 * Automatically rebuilds ArrayBuffer when source data changes.
 */
export interface ArrayBufferSignal extends Signal.Computed<ArrayBuffer> {
  // Inherits all Signal.Computed methods
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
 * Array Signal - Signal.Computed for processed arrays  
 */
export interface ArraySignal<T = any[]> extends Signal.Computed<T> {
  // Enhanced signal that includes mutable props metadata
  getMutableProps?(): string[];
}

/**
 * IndexedDB Query Signal - Signal for reactive database queries
 */
export interface IndexedDBQuerySignal<T = any> extends Signal.State<T[]> {
  query(): Promise<T[]>;              // Manual query execution
  add(value: any, key?: any): Promise<any>; // Add new record (triggers re-query)
  put(value: any, key?: any): Promise<void>; // Update/insert record (triggers re-query)
  delete(key: any): Promise<void>;    // Delete record (triggers re-query)
  clear(): Promise<void>;             // Clear all records (triggers re-query)
  count(): Promise<number>;           // Count records matching current query
  getStore(mode?: IDBTransactionMode): IDBObjectStore; // Get fresh store reference
}

/**
 * ComputedSignal Type Definition
 * A Signal.Computed for reactive Web API objects (FormData, URLSearchParams, etc.).
 * Automatically recomputes when dependencies change.
 * 
 * @deprecated Use specific signal types like FormDataSignal, URLSearchParamsSignal, etc.
 */
export interface ComputedSignal<T = any> extends Signal.Computed<T> {
  // Inherits all Signal.Computed methods
}
