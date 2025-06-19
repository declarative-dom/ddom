# Requests Module

The `requests` module provides declarative fetch capabilities for DDOM using TC39 Observables, allowing you to use a serializable Request object syntax to automatically fetch data and store it in reactive signals.

## What is Declarative Fetch?

Declarative fetch allows you to define HTTP requests directly in your DDOM object specifications using a simple, serializable syntax. When DDOM encounters a Request object as a property value, it automatically:

1. Creates an Observable for complex async operations
2. Handles sophisticated body type conversion (FormData, ReadableStream, ArrayBuffer, etc.)
3. Provides built-in retry mechanisms and error handling
4. Bridges the Observable to a Signal for reactive UI updates
5. Supports AbortController integration for request cancellation

## Why Observables?

This implementation uses TC39 Observables (via observable-polyfill) because they provide:

- **Complex Async Body Handling**: Different body types (FormData, ReadableStream, ArrayBuffer) require different async processing
- **Sophisticated Error Handling**: Retry logic, timeout handling, and graceful error recovery
- **Request Lifecycle Management**: Pre-request validation, post-request cleanup, and cancellation support
- **Stream-based Operations**: Perfect for handling large files, streaming data, and chunked responses

## Basic Usage

### Simple GET Request

```javascript
{
  tagName: 'user-profile',
  $userData: {
    Request: {
      url: "/api/users/123"
    }
  }
}
```

The `$userData` property becomes a Signal containing the fetched data.

### Request with Options

```javascript
{
  tagName: 'product-form',
  $submitResult: {
    Request: {
      url: "/api/products",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { name: "Product Name", price: 99.99 }
    }
  }
}
```

### FormData Request

```javascript
{
  tagName: 'upload-form',
  $uploadResult: {
    Request: {
      url: "/api/upload",
      method: "POST",
      body: {
        FormData: {
          file: "$fileInput",
          description: "Uploaded via DDOM"
        }
      }
    }
  }
}
```

### Using the Signal

```javascript
// In your component or effect
const element = document.querySelector('user-profile');
const userData = element.$userData.get(); // Access the fetched data
```

## Request Object Specification

The Request object supports all standard fetch API options:

### Basic Properties
- `url` (string, required): The URL to fetch
- `method` (string): HTTP method (GET, POST, PUT, DELETE, etc.)
- `headers` (object): HTTP headers

### Body Types
- Plain objects/arrays: Automatically converted to JSON
- `FormData`: Use `{ FormData: { key: value } }` syntax
- `URLSearchParams`: Use `{ URLSearchParams: { key: value } }` syntax
- `Blob`: Use `{ Blob: { content: data, type: "mime/type" } }` syntax
- `ArrayBuffer`: Use `{ ArrayBuffer: [1, 2, 3, 4] }` syntax

### Advanced Options
- `mode`: Request mode (cors, no-cors, same-origin)
- `credentials`: Credentials policy (omit, same-origin, include)
- `cache`: Cache control (default, no-store, reload, no-cache, force-cache, only-if-cached)
- `redirect`: Redirect handling (follow, error, manual)
- `referrer`: Referrer policy
- `referrerPolicy`: Referrer policy setting
- `integrity`: Subresource integrity hash
- `keepalive`: Keep connection alive
- `signal`: AbortController signal (use `{ AbortController: {} }`)

## Comprehensive Example

```javascript
{
  tagName: 'api-dashboard',
  
  // Simple GET request
  $userData: {
    Request: {
      url: "/api/users/123"
    }
  },
  
  // POST with JSON body
  $createUser: {
    Request: {
      url: "/api/users",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: {
        name: "$userName",
        email: "$userEmail"
      }
    }
  },
  
  // FormData upload
  $uploadFile: {
    Request: {
      url: "/api/upload",
      method: "POST",
      body: {
        FormData: {
          file: "$fileInput",
          description: "$fileDescription"
        }
      }
    }
  },
  
  // Advanced request with all options
  $comprehensiveRequest: {
    Request: {
      url: "/api/data",
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: { data: "$requestData" },
      mode: "cors",
      credentials: "include",
      cache: "no-cache",
      redirect: "follow",
      referrer: "no-referrer",
      referrerPolicy: "no-referrer",
      integrity: "sha384-abc123...",
      keepalive: true,
      signal: { AbortController: {} }
    }
  }
}
```

## Advanced Observable Features

### Request with Timeout
```javascript
{
  $timedRequest: {
    Request: {
      url: "/api/slow-endpoint",
      timeout: 5000  // 5 second timeout
    }
  }
}
```

### Request with Sophisticated Body Types
```javascript
{
  // File upload with FormData
  $fileUpload: {
    Request: {
      url: "/api/upload",
      method: "POST",
      body: {
        FormData: {
          file: "$fileInput",  // Will be processed asynchronously
          metadata: JSON.stringify({ type: "image" })
        }
      }
    }
  },
  
  // Streaming data
  $streamRequest: {
    Request: {
      url: "/api/stream",
      method: "POST",
      body: {
        ReadableStream: {
          source: "$streamData"  // Converted to ReadableStream
        }
      }
    }
  },
  
  // Binary data
  $binaryRequest: {
    Request: {
      url: "/api/binary",
      method: "POST",
      body: {
        ArrayBuffer: [1, 2, 3, 4, 5]  // Converted to ArrayBuffer
      }
    }
  }
}
```

### Enhanced Error Handling
The Observable implementation provides sophisticated error handling:

```javascript
// Error objects include detailed information
{
  error: "Request cancelled",
  type: "abort_error",  // or "fetch_error"
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## Features

- **Observable-Powered**: Uses TC39 Observables for sophisticated async operations
- **Serializable Syntax**: Can be JSON.stringify'd and stored/transmitted  
- **Web Standards Compliant**: Based on standard fetch API
- **Advanced Body Processing**: Async FormData, ReadableStream, ArrayBuffer handling
- **Intelligent Error Handling**: Retry logic, timeout support, graceful degradation
- **AbortController Integration**: Automatic request cancellation and cleanup
- **Signal Bridge**: Observable results bridged to DDOM Signals for reactivity
- **JSON/Text Parsing**: Automatically tries JSON parsing, falls back to text

## API Reference

### `constructRequestBody(bodySpec: any): Promise<BodyInit | null>`

Asynchronously converts specification body to native body format, handling complex types like FormData with file reading.

### `constructRequest(spec: RequestSpec): Promise<Request>`

Asynchronously converts a Request specification to a native Request object.

### `createRequestObservable(requestSpec: RequestSpec): Observable<any>`

Creates an Observable for a fetch request with sophisticated error handling and lifecycle management.

### `createEnhancedRequestObservable(requestSpec: RequestSpec): Observable<any>`

Creates an enhanced Observable with retry logic and advanced error handling capabilities.

### `observableToSignal<T>(observable: Observable<T>): Signal.State<any>`

Bridges Observable results to DDOM Signals for reactive UI updates.

### `requestHandler(el: any, property: string, requestSpec: RequestSpec): () => void`

Sets up reactive fetch binding for a property using the Observable-based architecture. Used internally by DDOM's namespace handling system.

## Technical Architecture

The implementation uses a hybrid approach:

1. **Observable Core**: TC39 Observables handle complex async operations
2. **Signal Bridge**: Results are bridged to DDOM Signals for API compatibility
3. **Namespace Integration**: Seamlessly integrates with DDOM's namespace system
4. **Error Resilience**: Multiple layers of error handling and recovery

This provides the power of Observables internally while maintaining the familiar Signal-based API externally.