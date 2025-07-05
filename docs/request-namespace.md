# Web API Namespaces

DDOM provides prototype-based namespaces for common Web APIs, enabling reactive integration with standard browser functionality. Each namespace follows the same pattern: a `prototype` property identifying the API type, plus standard Web API properties with minimal DDOM extensions for reactivity and control.

## Supported Prototypes

- **Request** - Declarative fetch API integration
- **IndexedDB** - Reactive database queries and operations
- **FormData** - Reactive form data construction
- **URLSearchParams** - Reactive URL parameter handling  
- **Array, Set, Map** - Reactive collections with filtering, mapping, and sorting
- **TypedArrays** - Reactive binary data arrays
- **Blob** - Reactive binary data creation
- **ArrayBuffer** - Reactive buffer management
- **ReadableStream** - Reactive stream creation

---

## Request Namespace

The Request namespace provides declarative fetch API integration for DDOM applications. It enables reactive HTTP requests using the prototype-based configuration with standard `Request` constructor properties.

### Overview

Request namespace properties create reactive signals that execute HTTP requests and manage their state automatically. The namespace uses the standard [Fetch API Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) interface, making it familiar to developers.

## Basic Usage

```javascript
import { createElement } from '@declarative-dom/lib';

const component = createElement({
  tagName: 'div',
  $userData: {
    prototype: 'Request',
    url: '/api/users/123',
    method: 'GET'
  }
});

// Access the request state
const state = component.$userData.get();
console.log(state.loading, state.data, state.error);

// Manual execution (for trigger: 'manual' mode)
await component.$userData.fetch();
```

## Configuration

### RequestConfig Interface

```typescript
interface RequestConfig {
  // Namespace identifier
  prototype: 'Request';           // Required: identifies this as a Request namespace
  
  // Standard Request constructor properties
  url: string;                    // Required: Request URL
  method?: string;                // HTTP method (GET, POST, etc.)
  headers?: Record<string, string>; // Request headers
  body?: any;                     // Request body (auto-serialized)
  mode?: RequestMode;             // CORS mode
  credentials?: RequestCredentials; // Credentials policy
  cache?: RequestCache;           // Cache policy
  redirect?: RequestRedirect;     // Redirect handling
  referrer?: string;              // Referrer URL
  referrerPolicy?: ReferrerPolicy; // Referrer policy
  integrity?: string;             // Subresource integrity
  keepalive?: boolean;            // Keep connection alive
  signal?: any;                   // AbortController signal
  
  // DDOM extensions
  disabled?: boolean;             // Disable auto execution (default: false)
  delay?: number;                 // Delay in milliseconds
  responseType?: 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text'; // Response parsing method
}
```

### RequestState Interface

```typescript
interface RequestState {
  loading: boolean;               // Request in progress
  data: any;                     // Parsed response data
  error: Error | null;           // Request error, if any
  response: Response | null;     // Raw fetch Response
  lastFetch: number;             // Timestamp of last request
}
```

## Trigger Modes

### Auto Mode (Default)

Automatically executes requests when reactive dependencies change:

```javascript
$userProfile: {
  prototype: 'Request',
  url: '/api/users/${this.$userId.get()}'
  // disabled: false is the default
}
```

### Manual Mode

Requires explicit `.fetch()` calls:

```javascript
$createUser: {
  prototype: 'Request',
  url: '/api/users',
  method: 'POST',
  disabled: true, // Manual triggering
  body: {
    name: '${this.$userName.get()}',
    email: '${this.$userEmail.get()}'
  }
}

// Later, trigger manually:
await element.$createUser.fetch();
```

## Template Literals

Use template literals for reactive values in any configuration property:

```javascript
$apiCall: {
  prototype: 'Request',
  url: '/api/${this.$endpoint.get()}/${this.$id.get()}',
  headers: {
    'Authorization': 'Bearer ${this.$token.get()}',
    'Content-Type': 'application/json'
  },
  body: {
    timestamp: '${Date.now()}'
  }
}
```

## Request Examples

### Basic GET Request

```javascript
$userData: {
  prototype: 'Request',
  url: '/api/users/123'
}
```

### POST with JSON Body

```javascript
$createPost: {
  prototype: 'Request',
  url: '/api/posts',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
    body: {
      title: '${this.$title.get()}',
      content: '${this.$content.get()}'
    },
    trigger: 'manual'
  }
}
```

### CORS Request

```javascript
$externalApi: {
  prototype: 'Request',
    url: 'https://api.external.com/data',
    mode: 'cors',
    credentials: 'include',
    headers: {
      'X-API-Key': '${this.$apiKey.get()}'
    }
  }
}
```

### File Upload

```javascript
$uploadFile: {
  prototype: 'Request',
    url: '/api/upload',
    method: 'POST',
    body: {
      prototype: 'FormData',
        file: '${this.$selectedFile.get()}',
        description: '${this.$fileDescription.get()}'
      }
    }
  }
}
```

## Response Handling

The Request namespace automatically parses responses based on Content-Type:

- `application/json` → Parsed as JSON object
- `text/*` → Returned as string
- Other types → Raw Response object

## Error Handling

Network errors and HTTP errors are captured in the `error` property:

```javascript
// Check for errors
const state = element.$apiCall.get();
if (state.error) {
  console.error('Request failed:', state.error.message);
} else if (state.data) {
  console.log('Success:', state.data);
}
```

## Debouncing

Use delay to prevent rapid successive requests:

```javascript
$searchResults: {
  prototype: 'Request',
    url: '/api/search?q=${this.$query.get()}',
    delay: 300  // Wait 300ms after last change
  }
}
```

## Advanced Features

### Reactive Headers

```javascript
$authenticatedprototype: 'Request',
  prototype: 'Request',
    url: '/api/protected',
    headers: {
      'Authorization': 'Bearer ${this.$authToken.get()}',
      'X-User-ID': '${this.$currentUser.get().id}'
    }
  }
}
```

### Conditional Requests

Use computed signals to conditionally execute requests:

```javascript
$conditionalData: {
  prototype: 'Request',
    url: '/api/data/${this.$shouldFetch.get() ? this.$dataId.get() : ""}'
  }
}
```

The request will only execute when `$shouldFetch` is true and `$dataId` has a value.

## Integration with Components

Request namespace works seamlessly with DDOM components:

```javascript
DDOM.customElements.define({
  tagName: 'user-profile',
  $userId: null,
  $userData: {
    prototype: 'Request',
      url: '/api/users/${this.$userId.get()}'
    }
  },
  
  children: [{
    tagName: 'div',
    textContent: '${this.$userData.get().loading ? "Loading..." : this.$userData.get().data?.name || "No data"}'
  }]
});
```

## Best Practices

1. **Use manual trigger for mutations** - POST, PUT, DELETE operations
2. **Debounce search/filter requests** - Prevent excessive API calls
3. **Handle loading states** - Show appropriate UI feedback
4. **Check for errors** - Always handle error cases gracefully
5. **Use template literals** - For dynamic, reactive request parameters

## Future Enhancements

The namespace architecture supports future additions:

- `WebSocket` namespace for real-time connections
- `IntersectionObserver` namespace for visibility detection
- `Geolocation` namespace for location services
- Additional HTTP-related namespaces as needed

Each namespace follows the same pattern: standard Web API properties with minimal DDOM extensions for reactivity and control.

---

## IndexedDB Namespace

The IndexedDB namespace provides reactive database queries that follow the same declarative patterns as the Request namespace. It has two distinct modes based on configuration:

1. **Setup Mode** (no operation/filter/query) → Returns `IDBObjectStore` for direct database operations
2. **Query Mode** (with operation/filter/query) → Returns `IndexedDBQuerySignal` for reactive queries

### Overview

IndexedDB namespace properties create either direct database stores or reactive query signals. Query signals automatically re-execute when template literals change, providing seamless database reactivity just like the Request namespace.

### Two Operating Modes

#### Setup Mode - Direct Database Access
When no `operation`, `filter`, or `query` is specified, returns an `IDBObjectStore`:

```javascript
// Setup Mode → Returns IDBObjectStore
$products: {
  prototype: 'IndexedDB',
    database: 'ShopDB',
    store: 'products',
    keyPath: 'id',
    autoIncrement: true,
    value: [{ name: 'Initial Product' }] // Auto-populate if empty
  }
}

// Use as direct IDBObjectStore
const store = element.$products.getStore();
await store.add({ name: 'New Product' });
```

#### Query Mode - Reactive Queries  
When `operation`, `filter`, or `query` is specified, returns an `IndexedDBQuerySignal`:

```javascript
// Query Mode → Returns IndexedDBQuerySignal
$searchResults: {
  prototype: 'IndexedDB',
    database: 'ShopDB',
    store: 'products',
    operation: 'getAll',
    debounce: 300,
    filter: (item) => item.name.includes(this.$query.get())
  }
}

// Automatically updates when $query changes!
textContent: 'Found ${this.$searchResults.get().length} products'
```

### Basic Usage

```javascript
// Reactive search - updates automatically when search term changes
$searchResults: {
  prototype: 'IndexedDB',
    database: 'MyAppDB',
    store: 'products', 
    operation: 'getAll',
    debounce: 300, // Just like Request namespace
    filter: (item) => item.name.includes(this.$searchQuery.get())
  }
}

// Use results in UI
textContent: 'Found ${this.$searchResults.get().length} products'
```

### Configuration

```typescript
interface IndexedDBConfig {
  // Namespace identifier
  prototype: 'IndexedDB';             // Required: identifies this as an IndexedDB namespace
  
  // Database setup
  database: string;                   // Required: database name
  store: string;                      // Required: object store name
  version?: number;                   // Database version (default: 1)
  indexes?: IndexedDBIndexConfig[];   // Optional: indexes to create
  
  // Query configuration  
  operation?: 'getAll' | 'get' | 'query' | 'count'; // Operation type
  key?: any;                          // Key for get operation (reactive)
  query?: IDBKeyRange | any;          // Query range (reactive)
  index?: string;                     // Index name to query (reactive)
  direction?: IDBCursorDirection;     // Cursor direction
  limit?: number;                     // Max results (reactive)
  filter?: (item: any) => boolean;    // Client-side filter (reactive)
  
  // Control options
  manual?: boolean;                   // Manual execution (default: false)
  debounce?: number;                  // Debounce delay in milliseconds
}
```

### Query Operations

#### getAll (Default)
Returns all records, optionally filtered:

```javascript
$allProducts: {
  prototype: 'IndexedDB',
    database: 'ShopDB',
    store: 'products',
    operation: 'getAll' // Default operation
  }
}
```

#### get
Returns single record by key:

```javascript
$currentUser: {
  prototype: 'IndexedDB',
    database: 'UserDB', 
    store: 'users',
    operation: 'get',
    key: '${this.$userId.get()}' // Reactive key
  }
}
```

#### query
Advanced queries with ranges:

```javascript
$expensiveItems: {
  prototype: 'IndexedDB',
    database: 'ShopDB',
    store: 'products', 
    operation: 'query',
    index: 'by-price',
    query: IDBKeyRange.lowerBound(100)
  }
}
```

#### count
Count matching records:

```javascript
$productCount: {
  prototype: 'IndexedDB',
    database: 'ShopDB',
    store: 'products',
    operation: 'count',
    query: '${this.$categoryFilter.get() !== "all" ? IDBKeyRange.only(this.$categoryFilter.get()) : undefined}'
  }
}
```

### Reactive Patterns

#### Search with Debouncing and Structured Filters
```javascript
// Reactive search using FilterCriteria (same as MappedArrays!)
$searchResults: {
  prototype: 'IndexedDB',
    bind: 'this.$products', // Reference existing database store
    operation: 'getAll', 
    debounce: 300, // Wait 300ms after last change
    filter: [
      {
        leftOperand: 'item.name.toLowerCase()',
        operator: 'includes',
        rightOperand: 'this.$query.get().toLowerCase()'
      },
      {
        leftOperand: 'rating',
        operator: '>=', 
        rightOperand: 'this.$minRating.get()'
      }
    ]
  }
}
```

#### Category Filtering with Index
```javascript
$categoryProducts: {
  prototype: 'IndexedDB',
    bind: 'this.$products',
    operation: 'getAll',
    index: 'by-category',
    query: function() {
      const category = this.$selectedCategory.get();
      return category === 'all' ? undefined : IDBKeyRange.only(category);
    }
  }
}
```

#### Advanced Filtering and Sorting
```javascript
$advancedResults: {
  prototype: 'IndexedDB',
    bind: 'this.$products',
    operation: 'getAll',
    filter: [
      { leftOperand: 'price', operator: '>=', rightOperand: 100 },
      { leftOperand: 'category', operator: '===', rightOperand: 'this.$selectedCategory.get()' }
    ],
    sort: [
      { sortBy: 'rating', direction: 'desc' },
      { sortBy: 'price', direction: 'asc' }
    ]
  }
}
```

### Database Operations

The signal provides database methods that trigger re-queries:

```javascript
// Add item and auto-refresh results
await element.$searchResults.add({
  name: 'New Product',
  category: 'electronics',
  price: 299
});

// Update item and auto-refresh results  
await element.$searchResults.put({
  id: 123,
  name: 'Updated Product',
  price: 399
});

// Delete item and auto-refresh results
await element.$searchResults.delete(123);

// Clear all and refresh
await element.$searchResults.clear();
```

### Manual Query Mode

For controlled execution:

```javascript
$manualQuery: {
  prototype: 'IndexedDB',
    database: 'DataDB',
    store: 'items', 
    manual: true // No auto-execution
  }
}

// Later, execute manually:
await element.$manualQuery.query();
```

### Index Management

Declaratively create indexes:

```javascript
$products: {
  prototype: 'IndexedDB',
    database: 'ShopDB',
    store: 'products',
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-name', keyPath: 'name', unique: false },
      { name: 'by-category', keyPath: 'category', unique: false },
      { name: 'by-price', keyPath: 'price', unique: false },
      { name: 'by-rating', keyPath: 'rating', unique: false }
    ]
  }
}
```

### Complete Example

```javascript
{
  // State
  $searchQuery: '',
  $categoryFilter: 'all',
  
  // Reactive database query (like Request namespace)
  $searchResults: {
    prototype: 'IndexedDB',
      database: 'ProductDB',
      store: 'products',
      operation: 'getAll',
      debounce: 300,
      filter: function() {
        const query = window.$searchQuery.get().toLowerCase();
        const category = window.$categoryFilter.get();
        
        return function(product) {
          const matchesQuery = product.name.toLowerCase().includes(query);
          const matchesCategory = category === 'all' || product.category === category;
          return matchesQuery && matchesCategory;
        };
      }
    }
  },
  
  children: [{
    tagName: 'input',
    placeholder: 'Search products...',
    oninput: (e) => this.$searchQuery.set(e.target.value)
  }, {
    tagName: 'select', 
    onchange: (e) => this.$categoryFilter.set(e.target.value),
    children: [
      { tagName: 'option', value: 'all', textContent: 'All Categories' },
      { tagName: 'option', value: 'electronics', textContent: 'Electronics' }
    ]
  }, {
    tagName: 'div',
    textContent: 'Found ${this.$searchResults.get().length} products'
  }, {
    tagName: 'div',
    children: {
      items: 'this.$searchResults',
      map: {
        tagName: 'div',
        textContent: '${(item) => item.name} - $${(item) => item.price}'
      }
    }
  }]
}
```

### Best Practices

1. **Use debouncing for search** - Prevent excessive database queries
2. **Leverage indexes** - Create indexes for common query patterns  
3. **Client-side filtering** - Use filter functions for complex conditions
4. **Manual mode for mutations** - Use manual triggering for write operations
5. **Reactive keys and ranges** - Use template literals for dynamic queries

### Comparison with Request Namespace

| Feature | Request | IndexedDB |
|---------|---------|-----------|
| Reactive execution | ✅ | ✅ |
| Debouncing | ✅ | ✅ |
| Template literals | ✅ | ✅ |
| Manual triggering | ✅ | ✅ |
| Auto re-execution | ✅ | ✅ |
| Error handling | ✅ | ✅ |

Both namespaces follow the same declarative patterns, making the learning curve minimal!

---

## FormData Namespace

The FormData namespace creates reactive FormData objects for handling form submissions and file uploads declaratively.

### Basic Usage

```javascript
$formData: {
  prototype: 'FormData',
    name: '${this.$userName.get()}',
    email: '${this.$userEmail.get()}',
    file: '${this.$selectedFile.get()}' // File object from input
  }
}
```

### Configuration

```typescript
interface FormDataConfig {
  prototype: 'FormData';          // Required: identifies this as a FormData namespace
  [fieldName: string]: any;       // Field values (strings, Files, Blobs)
}
```

### Examples

#### Contact Form Data
```javascript
$contactForm: {
  prototype: 'FormData',
    name: '${this.$name.get()}',
    email: '${this.$email.get()}',
    message: '${this.$message.get()}',
    timestamp: '${Date.now()}'
  }
}
```

#### File Upload with Metadata
```javascript
$uploadData: {
  prototype: 'FormData',
    file: '${this.$selectedFile.get()}',
    description: '${this.$fileDescription.get()}',
    category: '${this.$selectedCategory.get()}',
    userId: '${this.$currentUser.get().id}'
  }
}
```

---

## URLSearchParams Namespace

The URLSearchParams namespace creates reactive URL parameter strings for API calls and navigation.

### Basic Usage

```javascript
$queryParams: {
  prototype: 'URLSearchParams',
    q: '${this.$searchQuery.get()}',
    page: '${this.$currentPage.get()}',
    limit: 20
  }
}
```

### Configuration

```typescript
interface URLSearchParamsConfig {
  prototype: 'URLSearchParams';   // Required: identifies this as a URLSearchParams namespace
  [paramName: string]: string | number | string[]; // Parameter values
}
```

### Examples

#### Search Parameters
```javascript
$searchParams: {
  prototype: 'URLSearchParams',
    q: '${this.$query.get()}',
    category: '${this.$selectedCategory.get()}',
    sort: '${this.$sortOrder.get()}',
    page: '${this.$currentPage.get()}'
  }
}

// Use in API call
$searchResults: {
  prototype: 'Request',
    url: '/api/search?${this.$searchParams.get().toString()}'
  }
}
```

#### Multi-value Parameters
```javascript
$filterParams: {
  prototype: 'URLSearchParams',
    tags: ['${this.$selectedTags.get().join("','")}'], // Array of values
    status: '${this.$statusFilter.get()}',
    limit: 50
  }
}
```

---

## Blob Namespace

The Blob namespace creates reactive binary data objects for file handling and data processing.

### Basic Usage

```javascript
$textBlob: {
  Blob: {
    content: '${this.$textContent.get()}',
    type: 'text/plain'
  }
}
```

### Configuration

```typescript
interface BlobConfig {
  content: any | any[]; // Blob content (string, ArrayBuffer, etc.)
  type?: string;        // MIME type
  endings?: 'transparent' | 'native'; // Line ending handling
}
```

### Examples

#### Text File Creation
```javascript
$csvFile: {
  Blob: {
    content: '${this.$csvData.get()}',
    type: 'text/csv',
    endings: 'native'
  }
}
```

#### JSON Export
```javascript
$jsonExport: {
  Blob: {
    content: '${JSON.stringify(this.$exportData.get(), null, 2)}',
    type: 'application/json'
  }
}
```

#### Multi-part Content
```javascript
$combinedFile: {
  Blob: {
    content: [
      '${this.$header.get()}',
      '${this.$body.get()}',
      '${this.$footer.get()}'
    ],
    type: 'text/plain'
  }
}
```

---

## ArrayBuffer Namespace

The ArrayBuffer namespace creates reactive binary buffers for low-level data manipulation.

### Basic Usage

```javascript
$binaryData: {
  ArrayBuffer: {
    data: '${this.$textInput.get()}' // Will be UTF-8 encoded
  }
}
```

### Configuration

```typescript
interface ArrayBufferConfig {
  data: string | number[] | Uint8Array | ArrayBuffer; // Source data
  encoding?: string; // Encoding hint (for strings)
}
```

### Examples

#### Text to Binary
```javascript
$encodedText: {
  ArrayBuffer: {
    data: '${this.$message.get()}' // Automatically UTF-8 encoded
  }
}
```

#### Numeric Array to Buffer
```javascript
$numericBuffer: {
  ArrayBuffer: {
    data: [72, 101, 108, 108, 111] // "Hello" in ASCII
  }
}
```

#### From Existing Buffer
```javascript
$copiedBuffer: {
  ArrayBuffer: {
    data: '${this.$sourceBuffer.get()}' // Copy existing ArrayBuffer
  }
}
```

---

## ReadableStream Namespace

The ReadableStream namespace creates reactive streaming data sources for processing large datasets.

### Basic Usage

```javascript
$textStream: {
  ReadableStream: {
    data: '${this.$streamContent.get()}'
  }
}
```

### Configuration

```typescript
interface ReadableStreamConfig {
  source?: ReadableStreamDefaultSource; // Custom stream source
  strategy?: QueuingStrategy;           // Queuing strategy
  data?: any | any[];                   // Simple data to stream
}
```

### Examples

#### Text Streaming
```javascript
$logStream: {
  ReadableStream: {
    data: '${this.$logContent.get()}'
  }
}
```

#### Array Streaming
```javascript
$dataStream: {
  ReadableStream: {
    data: ['${this.$items.get().join("','")}'] // Stream array items
  }
}
```

#### Custom Source
```javascript
$customStream: {
  ReadableStream: {
    source: {
      start(controller) {
        // Custom streaming logic
        const data = this.$streamData.get();
        data.forEach(chunk => controller.enqueue(chunk));
        controller.close();
      }
    },
    strategy: { highWaterMark: 1024 }
  }
}
```

---

## Namespace Integration Examples

### Complete File Upload Example

```javascript
{
  $selectedFile: null,
  $uploadDescription: '',
  
  // Create form data
  $uploadForm: {
    prototype: 'FormData',
      file: '${this.$selectedFile.get()}',
      description: '${this.$uploadDescription.get()}',
      timestamp: '${Date.now()}'
    }
  },
  
  // Submit upload
  $uploadprototype: 'Request',
    prototype: 'Request',
      url: '/api/upload',
      method: 'POST',
      body: '${this.$uploadForm.get()}',
      disabled: true // Manual trigger
    }
  },
  
  children: [{
    tagName: 'input',
    attributes: { type: 'file' },
    onchange: function(e) {
      this.$selectedFile.set(e.target.files[0]);
    }
  }, {
    tagName: 'textarea',
    placeholder: 'File description...',
    oninput: function(e) {
      this.$uploadDescription.set(e.target.value);
    }
  }, {
    tagName: 'button',
    textContent: 'Upload File',
    onclick: async function() {
      await this.$uploadRequest.fetch();
    }
  }]
}
```

### API Search with Parameters

```javascript
{
  $searchQuery: '',
  $filters: { category: 'all', sort: 'relevance' },
  
  // Build search parameters
  $searchParams: {
    prototype: 'URLSearchParams',
      q: '${this.$searchQuery.get()}',
      category: '${this.$filters.get().category}',
      sort: '${this.$filters.get().sort}',
      timestamp: '${Date.now()}'
    }
  },
  
  // Execute search
  $searchResults: {
    prototype: 'Request',
      url: '/api/search?${this.$searchParams.get().toString()}',
      delay: 300 // Debounce searches
    }
  },
  
  children: [{
    tagName: 'input',
    placeholder: 'Search...',
    oninput: function(e) {
      this.$searchQuery.set(e.target.value);
    }
  }, {
    tagName: 'div',
    textContent: 'Results: ${this.$searchResults.get()?.length || 0}'
  }]
}
```

### Data Export Pipeline

```javascript
{
  $exportData: [],
  
  // Convert to JSON
  $jsonData: '${JSON.stringify(this.$exportData.get(), null, 2)}',
  
  // Create downloadable blob
  $exportFile: {
    Blob: {
      content: '${this.$jsonData}',
      type: 'application/json'
    }
  },
  
  // Create download URL
  $downloadUrl: '${URL.createObjectURL(this.$exportFile.get())}',
  
  children: [{
    tagName: 'button',
    textContent: 'Export Data',
    onclick: function() {
      this.$exportData.set([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]);
    }
  }, {
    tagName: 'a',
    textContent: 'Download Export',
    attributes: {
      href: '${this.$downloadUrl}',
      download: 'export.json'
    },
    style: {
      display: '${this.$exportData.get().length ? "inline" : "none"}'
    }
  }]
}
```