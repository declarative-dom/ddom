## 🚀 Namespaces: Declarative Web APIs

DDOM's namespace system provides declarative access to Web APIs, storage systems, and reactive collections through a unified prototype-based syntax. Each namespace creates reactive signals that automatically update when dependencies change.

### HTTP & Network APIs

#### Request Namespace - Reactive Fetch API

```JavaScript
{
  // Basic GET request with automatic reactivity
  $apiData: {
    prototype: 'Request',
    url: '/api/users/${this.$userId}',  // ← Signals auto-unwrapped in templates!
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ${this.$token}'  // ← Clean syntax without .get()
    },
    debounce: 300, // Prevent rapid requests
    manual: false  // Auto-execute when dependencies change
  },
  
  // POST with reactive body
  $createUser: {
    prototype: 'Request',
    url: '/api/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '${JSON.stringify(this.$newUser)}',  // ← Auto-unwrapped signals
    manual: true, // Execute only when explicitly called
    isValid: function() {
      return this.$newUser.get().name && this.$newUser.get().email;
    }
  }
}
```

#### FormData Namespace - Reactive Form Construction

```JavaScript
{
  // Dynamic form data with file uploads
  $uploadForm: {
    prototype: 'FormData',
    file: '${this.$selectedFile.get()}',
    description: '${this.$description.get()}',
    category: 'documents',
    timestamp: '${Date.now()}'
  },
  
  // Use in requests
  $uploadRequest: {
    prototype: 'Request',
    url: '/api/upload',
    method: 'POST',
    body: '${this.$uploadForm.get()}' // FormData object
  }
}
```

#### URLSearchParams Namespace - Reactive URL Building

```JavaScript
{
  // Search parameters that update automatically
  $searchParams: {
    prototype: 'URLSearchParams',
    q: '${this.$searchQuery.get()}',
    category: '${this.$selectedCategory.get()}',
    page: '${this.$currentPage.get()}',
    limit: 20
  },
  
  // Use in API calls
  $searchResults: {
    prototype: 'Request',
    url: '/api/search?${this.$searchParams.get().toString()}'
  }
}
```

### Storage APIs

#### Persistent Storage with Automatic Serialization

```JavaScript
{
  // LocalStorage with automatic JSON serialization
  $userSettings: {
    prototype: 'LocalStorage',
    key: 'appSettings',
    value: { 
      theme: 'light', 
      notifications: true,
      language: 'en'
    }
  },
  
  // SessionStorage for temporary data
  $sessionData: {
    prototype: 'SessionStorage', 
    key: 'currentSession',
    value: { startTime: Date.now(), userId: null }
  },
  
  // Reactive cookies (string values only)
  $userPrefs: {
    prototype: 'Cookie',
    name: 'userPreferences',
    value: 'theme=dark;lang=en',
    path: '/',
    maxAge: 86400, // 24 hours
    secure: true,
    sameSite: 'strict'
  }
}
```

#### IndexedDB with Full CRUD Operations

```JavaScript
{
  // Database store factory
  $appDataStore: {
    prototype: 'IndexedDB',
    database: 'AppDataDB',
    store: 'documents',
    version: 1,
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'by-title', keyPath: 'title', unique: false },
      { name: 'by-created', keyPath: 'created', unique: false }
    ]
  },
  
  // Reactive queries
  $documents: {
    prototype: 'IDBRequest',
    objectStore: "this.$appDataStore",
    operation: "getAll",
    debounce: 100
  },
  
  // Declarative writes
  $addDocument: {
    prototype: 'IDBRequest',
    objectStore: "this.$appDataStore", 
    operation: "add",
    value: "this.$newDoc",
    onsuccess: function() {
      this.$newDocTitle.set("");
      this.$newDocContent.set("");
    }
  },
  
  // Conditional operations
  $removeDocument: {
    prototype: 'IDBRequest',
    objectStore: "this.$appDataStore",
    operation: "delete", 
    key: "this.$docToRemove",
    onsuccess: function() {
      this.$docToRemove.set(null);
    }
  }
}
```

### Binary Data APIs

#### Blob & ArrayBuffer Namespaces

```JavaScript
{
  // Create reactive blobs
  $csvFile: {
    prototype: 'Blob',
    content: '${this.$csvData.get()}',
    type: 'text/csv;charset=utf-8'
  },
  
  // Binary data handling
  $binaryData: {
    prototype: 'ArrayBuffer', 
    data: '${this.$textInput.get()}', // UTF-8 encoded
    encoding: 'utf-8'
  },
  
  // Reactive streams
  $dataStream: {
    prototype: 'ReadableStream',
    data: '${this.$streamContent.get()}'
  }
}
```

### Reactive Collections

#### Array Namespace with Declarative Operations

```JavaScript
{
  $products: [
    { id: 1, name: 'Laptop', price: 999, category: 'electronics' },
    { id: 2, name: 'Book', price: 29, category: 'books' },
    { id: 3, name: 'Phone', price: 599, category: 'electronics' }
  ],
  
  // Filtered and sorted collection
  $filteredProducts: {
    prototype: 'Array',
    items: 'this.$products',
    filter: [
      { leftOperand: 'category', operator: '===', rightOperand: '${this.$selectedCategory.get()}' },
      { leftOperand: 'price', operator: '<=', rightOperand: '${this.$maxPrice.get()}' }
    ],
    sort: [
      { sortBy: 'price', direction: 'asc' }
    ],
    limit: '${this.$itemsPerPage.get()}'
  },
  
  // Dynamic UI rendering
  children: {
    prototype: 'Array',
    items: 'this.$filteredProducts',
    map: {
      tagName: 'product-card',
      $product: '${item}',
      $index: '${index}'
    }
  }
}
```

### Namespace Validation & Error Handling

```JavaScript
{
  // Conditional execution with validation
  $conditionalRequest: {
    prototype: 'Request',
    url: '/api/data/${this.$id.get()}',
    isValid: function() {
      return this.$id.get() && this.$id.get() > 0;
    },
    onerror: function(error) {
      this.$errorMessage.set(`Request failed: ${error.message}`);
    }
  },
  
  // Manual execution control
  $manualUpload: {
    prototype: 'Request',
    url: '/api/upload',
    method: 'POST',
    body: '${this.$uploadData.get()}',
    manual: true, // Only execute when explicitly called
    debounce: 1000
  },
  
  // Execute manually in event handlers
  onclick: function() {
    this.$manualUpload.refresh(); // Trigger the request
  }
}
```

### Benefits of the Namespace System

1. **Declarative**: Describe what you want, not how to build it
2. **Reactive**: Automatically update when dependencies change
3. **Type-Safe**: Full TypeScript support with proper type checking
4. **Validation**: Built-in validation prevents invalid operations
5. **Debouncing**: Automatic debouncing prevents excessive operations
6. **Error Handling**: Comprehensive error handling with callbacks
7. **Manual Control**: Option to disable automatic execution
8. **Standards-Based**: Uses actual Web API constructors under the hood