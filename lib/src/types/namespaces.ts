/**
 * Namespace Type Definitions
 * 
 * Type definitions for all namespace configurations in DDOM.
 * These define the structure of prototype-based namespace objects.
 */

/**
 * FilterOper Type Definition
 * Defines operators specifically for use in filter expressions that return boolean values.
 * Includes comparison, logical, and conditional operators suitable for filtering operations.
 */
const FILTER_OPERATORS = [
	'>', '<', '>=', '<=', 
	'==', '!=', '===', '!==', 
	'&&', '||', '!', '?',
	'includes', 'startsWith', 'endsWith',
] as const;

export type FilterOper = typeof FILTER_OPERATORS[number];

/**
 * Operator Type Definition
 * Defines all supported operators for use in expressions and computations.
 * Includes comparison, logical, arithmetic, bitwise, and conditional operators.
 * Note: For filtering operations, use FilterOper instead.
 */
const OPERATORS = [
	'>', '<', '>=', '<=', 
	'==', '!=', '===', '!==', 
	'&&', '||', 
	'+', '-', '*', '/', '%', 
	'^', '&', '|', '!', '~', 
	'<<', '>>', '>>>', 
	'?', 'includes', 'startsWith', 'endsWith',
] as const;

export type Operator = typeof OPERATORS[number];

/**
 * FilterCriteria Type Definition
 * This type is used to define filters that can be applied to arrays of items.
 * It allows for complex filtering operations using operators and can handle both static and dynamic values.
 * @template T - The type of items in the array.
 * @property leftOperand - The left operand of the filter condition, which can be a string (property name), a function, or a dynamic value.
 * @property operator - The filter operator to use for comparison - only boolean-returning operators are allowed.
 * @property rightOperand - The right operand of the filter condition, which can be a static value, a function, or a dynamic value.
 * */
export type FilterCriteria<T = any> = {
	leftOperand: string | ((item: T, index: number) => any);
	operator: FilterOper;
	rightOperand: any | ((item: T, index: number) => any);
};

/**
 * SortCriteria Type Definition
 * This type is used to define sorting operations for arrays of items.
 * It allows for both static and dynamic sorting based on properties or functions.
 * @template T - The type of items in the array.
 * @property sortBy - The property name or function to sort by.
 * @property direction - The direction of sorting, either 'asc' for ascending or 'desc' for descending.
 */
export type SortCriteria<T = any> = {
	sortBy: string | ((item: T) => any);
	direction?: 'asc' | 'desc';
};

/**
 * Base prototype configuration interface
 */
export interface PrototypeConfig {
  prototype: string;
  [key: string]: any;
}

/**
 * ArrayConfig Type Definition
 * Unified configuration for Array-like prototypes.
 * Supports Array, Set, Map, and TypedArrays with filtering, mapping, and sorting.
 * @template T - The type of items in the source array.
 * @template R - The type of items after mapping transformation.
 * @property prototype - The Array-like prototype to use
 * @property items - The source array property accessor or direct array
 * @property map - Transformation template (object with property accessors or strings)
 * @property filter - Optional array of filters to apply to items before mapping
 * @property sort - Optional array of sort operations to apply before mapping
 */
export interface ArrayConfig<T = any, R = any> extends PrototypeConfig {
  prototype: 'Array' | 'Set' | 'Map' | 'Int8Array' | 'Uint8Array' | 'Int16Array' | 'Uint16Array' | 'Int32Array' | 'Uint32Array' | 'Float32Array' | 'Float64Array';
  items: string | T[]; // Property accessor (e.g. "this.$items") or direct array
  map?: R; // Object template with property accessors, not functions
  filter?: FilterCriteria<T>[];
  sort?: SortCriteria<T>[];
  debounce?: number;
}

/**
 * RequestConfig Type Definition
 * Configuration for Request namespace properties in DDOM.
 * Extends standard RequestInit with URL and web-standard control properties.
 */
export interface RequestConfig extends PrototypeConfig, RequestInit {
  prototype: 'Request';
  url: string;                        // Required: request URL
  
  // DDOM-specific extensions
  manual?: boolean;                   // Manual execution mode - disables auto-triggering (default: false)
  debounce?: number;                  // Debounce delay in milliseconds for auto-triggered requests
  responseType?: XMLHttpRequestResponseType; // Response parsing hint - matches XMLHttpRequest.responseType
}

/**
 * FormData Configuration with prototype
 */
export interface FormDataConfig extends PrototypeConfig {
  prototype: 'FormData';
  [key: string]: any;
}

/**
 * URLSearchParams Configuration with prototype
 */
export interface URLSearchParamsConfig extends PrototypeConfig {
  prototype: 'URLSearchParams';
  [key: string]: any;
}

/**
 * Blob Configuration with prototype
 */
export interface BlobConfig extends PrototypeConfig {
  prototype: 'Blob';
  content: any; // Blob content
  type?: string; // MIME type
  endings?: string; // Line ending type
}

/**
 * ArrayBuffer Configuration with prototype
 */
export interface ArrayBufferConfig extends PrototypeConfig {
  prototype: 'ArrayBuffer';
  data: any; // Source data to convert to ArrayBuffer
  encoding?: string; // Text encoding for string data
}

/**
 * ReadableStream Configuration with prototype
 */
export interface ReadableStreamConfig extends PrototypeConfig {
  prototype: 'ReadableStream';
  source?: any; // Stream source
  strategy?: any; // Queuing strategy
  data?: any; // Direct data to stream
}

/**
 * LocalStorageConfig Type Definition
 * Configuration for LocalStorage namespace properties in DDOM.
 * Manages localStorage key-value pairs with reactive updates.
 */
export interface LocalStorageConfig extends PrototypeConfig {
  prototype: 'LocalStorage';
  key: string;                        // Required: storage key
  value?: any;                        // Value - used as initial value if key doesn't exist
  prefix?: string;                    // Optional key prefix
}

/**
 * SessionStorageConfig Type Definition
 * Configuration for SessionStorage namespace properties in DDOM.
 * Manages sessionStorage key-value pairs with reactive updates.
 */
export interface SessionStorageConfig extends PrototypeConfig {
  prototype: 'SessionStorage';
  key: string;                        // Required: storage key
  value?: any;                        // Value - used as initial value if key doesn't exist
  prefix?: string;                    // Optional key prefix
}

/**
 * CookieInit interface (Cookie Store API)
 * Standard web API interface for cookie initialization options.
 * Defined here since it may not be available in all TypeScript DOM lib versions.
 */
export interface CookieInit {
  name: string;
  value: string;
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}

/**
 * CookieConfig Type Definition
 * Configuration for Cookie namespace properties in DDOM.
 * Extends web-standard CookieInit with DDOM-specific value handling.
 */
export interface CookieConfig extends PrototypeConfig, Omit<CookieInit, 'value'> {
  prototype: 'Cookie';

  value?: any;                        // Cookie value - supports any type with auto-serialization (DDOM extension)
  maxAge?: number;                    // Max age in seconds (common extension)
  secure?: boolean;                   // Secure flag (common extension)
}

/**
 * IndexedDBConfig Type Definition
 * Configuration for IndexedDB namespace properties in DDOM.
 * 
 * Two modes:
 * 1. Database Setup Mode (no operation/filter/query) → returns IDBObjectStore
 * 2. Query Mode (with operation/filter/query) → returns IndexedDBQuerySignal
 */
export interface IndexedDBConfig extends PrototypeConfig, IDBObjectStoreParameters {
  prototype: 'IndexedDB';
  database: string;                   // Required: database name
  store: string;                      // Required: object store name
  version?: number;                   // Database version (default: 1)
  indexes?: IndexedDBIndexConfig[];   // Optional: indexes to create on the store
  value?: any | any[];                // Initial data to populate database (if empty)
  
  // Query configuration (presence determines if this returns IDBObjectStore or IndexedDBQuerySignal)
  operation?: 'getAll' | 'get' | 'query' | 'count'; // Database operation
  key?: any;                          // Key for get operation (reactive)
  query?: IDBKeyRange | any;          // Query range for query operation (reactive)
  index?: string;                     // Index name to query against (reactive)
  direction?: IDBCursorDirection;     // Cursor direction for query operation
  limit?: number;                     // Maximum number of results to return (reactive)
  filter?: FilterCriteria<any>[];         // Client-side filter expressions (using existing FilterCriteria)
  sort?: SortCriteria<any>[];             // Client-side sort expressions (using existing SortCriteria)
  
  // Binding to existing database store (alternative to database/store/version/indexes)
  bind?: string;                      // Property accessor to existing IDBObjectStore (e.g., "this.$allProducts")
  
  // Control options (only for query mode)
  manual?: boolean;                   // Manual execution mode - disables auto-triggering (default: false)
  debounce?: number;                  // Debounce delay in milliseconds for auto-triggered queries
}

/**
 * IndexedDBIndexConfig Type Definition
 * Configuration for creating indexes on IndexedDB object stores.
 */
export interface IndexedDBIndexConfig extends IDBIndexParameters {
  name: string;                       // Required: index name
  keyPath: string | string[];         // Required: key path for the index
}

/**
 * WebSocketConfig Type Definition
 * Configuration for WebSocket namespace properties in DDOM.
 */
export interface WebSocketConfig extends PrototypeConfig {
  prototype: 'WebSocket';
  url: string;                        // Required: WebSocket URL
  protocols?: string | string[];      // Optional: WebSocket protocols
  
  // DDOM-specific extensions
  autoConnect?: boolean;              // Auto-connect on creation (default: true)
  reconnect?: boolean;                // Auto-reconnect on close (default: false)
  maxReconnectAttempts?: number;      // Max reconnection attempts (default: 3)
  reconnectDelay?: number;            // Delay between reconnection attempts in ms (default: 1000)
}
