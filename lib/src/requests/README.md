# Requests Module

The `requests` module provides declarative fetch capabilities for DDOM, allowing you to use a serializable Request object syntax to automatically fetch data and store it in reactive signals.

## What is Declarative Fetch?

Declarative fetch allows you to define HTTP requests directly in your DDOM object specifications using a simple, serializable syntax. When DDOM encounters a Request object as a property value, it automatically:

1. Performs the fetch operation
2. Creates a Signal to store the result
3. Updates the Signal when the fetch completes
4. Handles errors gracefully

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

## Features

- **Serializable Syntax**: Can be JSON.stringify'd and stored/transmitted
- **Web Standards Compliant**: Based on standard fetch API
- **Automatic Signal Creation**: Properties become reactive signals
- **Error Handling**: Fetch errors are captured and stored in the signal
- **JSON/Text Parsing**: Automatically tries JSON parsing, falls back to text
- **Comprehensive Body Support**: FormData, URLSearchParams, Blob, ArrayBuffer

## Response Handling

The module automatically handles response parsing:

1. First tries to parse as JSON based on Content-Type header
2. Falls back to text if JSON parsing fails
3. Stores errors in the signal if fetch fails

Example error response:
```javascript
{ 
  error: "HTTP 404: Not Found",
  type: "fetch_error",
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

## API Reference

### `convertToNativeRequest(spec: RequestSpec): Request`

Converts a Request specification to a native Request object.

### `createFetchSignal(request: Request): Signal.State<any>`

Creates a fetch signal for a Request object that automatically fetches and stores the result.

### `requestHandler(el: any, property: string, requestSpec: RequestSpec): () => void`

Sets up reactive fetch binding for a property. Used internally by DDOM's namespace handling system.