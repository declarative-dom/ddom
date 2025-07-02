# Web API Namespaces

DDOM provides declarative namespaces for common Web APIs, enabling reactive integration with standard browser functionality. Each namespace follows the same pattern: standard Web API properties with minimal DDOM extensions for reactivity and control.

## Supported Namespaces

- **Request** - Declarative fetch API integration
- **FormData** - Reactive form data construction
- **URLSearchParams** - Reactive URL parameter handling  
- **Blob** - Reactive binary data creation
- **ArrayBuffer** - Reactive buffer management
- **ReadableStream** - Reactive stream creation

---

## Request Namespace

The Request namespace provides declarative fetch API integration for DDOM applications. It enables reactive HTTP requests using standard `Request` constructor properties with minimal DDOM extensions.

## Overview

Request namespace properties create reactive signals that execute HTTP requests and manage their state automatically. The namespace uses the standard [Fetch API Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) interface, making it familiar to developers.

## Basic Usage

```javascript
import { createElement } from '@declarative-dom/lib';

const component = createElement({
  tagName: 'div',
  $userData: {
    Request: {
      url: '/api/users/123',
      method: 'GET'
    }
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
  Request: {
    url: '/api/users/${this.$userId.get()}'
    // disabled: false is the default
  }
}
```

### Manual Mode

Requires explicit `.fetch()` calls:

```javascript
$createUser: {
  Request: {
    url: '/api/users',
    method: 'POST',
    disabled: true, // Manual triggering
    body: {
      name: '${this.$userName.get()}',
      email: '${this.$userEmail.get()}'
    }
  }
}

// Later, trigger manually:
await element.$createUser.fetch();
```

## Template Literals

Use template literals for reactive values in any configuration property:

```javascript
$apiCall: {
  Request: {
    url: '/api/${this.$endpoint.get()}/${this.$id.get()}',
    headers: {
      'Authorization': 'Bearer ${this.$token.get()}',
      'Content-Type': 'application/json'
    },
    body: {
      timestamp: '${Date.now()}'
    }
  }
}
```

## Request Examples

### Basic GET Request

```javascript
$userData: {
  Request: {
    url: '/api/users/123'
  }
}
```

### POST with JSON Body

```javascript
$createPost: {
  Request: {
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
  Request: {
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
  Request: {
    url: '/api/upload',
    method: 'POST',
    body: {
      FormData: {
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
  Request: {
    url: '/api/search?q=${this.$query.get()}',
    delay: 300  // Wait 300ms after last change
  }
}
```

## Advanced Features

### Reactive Headers

```javascript
$authenticatedRequest: {
  Request: {
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
  Request: {
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
    Request: {
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

## FormData Namespace

The FormData namespace creates reactive FormData objects for handling form submissions and file uploads declaratively.

### Basic Usage

```javascript
$formData: {
  FormData: {
    name: '${this.$userName.get()}',
    email: '${this.$userEmail.get()}',
    file: '${this.$selectedFile.get()}' // File object from input
  }
}
```

### Configuration

```typescript
interface FormDataConfig {
  [fieldName: string]: any; // Field values (strings, Files, Blobs)
}
```

### Examples

#### Contact Form Data
```javascript
$contactForm: {
  FormData: {
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
  FormData: {
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
  URLSearchParams: {
    q: '${this.$searchQuery.get()}',
    page: '${this.$currentPage.get()}',
    limit: 20
  }
}
```

### Configuration

```typescript
interface URLSearchParamsConfig {
  [paramName: string]: string | number | string[]; // Parameter values
}
```

### Examples

#### Search Parameters
```javascript
$searchParams: {
  URLSearchParams: {
    q: '${this.$query.get()}',
    category: '${this.$selectedCategory.get()}',
    sort: '${this.$sortOrder.get()}',
    page: '${this.$currentPage.get()}'
  }
}

// Use in API call
$searchResults: {
  Request: {
    url: '/api/search?${this.$searchParams.get().toString()}'
  }
}
```

#### Multi-value Parameters
```javascript
$filterParams: {
  URLSearchParams: {
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
    FormData: {
      file: '${this.$selectedFile.get()}',
      description: '${this.$uploadDescription.get()}',
      timestamp: '${Date.now()}'
    }
  },
  
  // Submit upload
  $uploadRequest: {
    Request: {
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
    URLSearchParams: {
      q: '${this.$searchQuery.get()}',
      category: '${this.$filters.get().category}',
      sort: '${this.$filters.get().sort}',
      timestamp: '${Date.now()}'
    }
  },
  
  // Execute search
  $searchResults: {
    Request: {
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