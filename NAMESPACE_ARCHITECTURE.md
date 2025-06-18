# Namespace-Based Modular Architecture

DDOM now uses a namespace-based system for handling special object types like Request, WebSocket, IndexedDB, etc. This modular approach allows for clean separation of concerns and easy extensibility.

## Architecture Overview

Instead of hardcoded conditional checks for specific object types, DDOM now:

1. **Detects namespaces** in object properties using `detectNamespace()`
2. **Delegates handling** to registered namespace handlers
3. **Maintains extensibility** for future namespace additions

## Namespace Detection

Objects with reserved namespace keys are automatically detected:

```javascript
// This object contains a "Request" namespace
{
  $userData: {
    Request: {
      url: "/api/users/123"
    }
  }
}
```

## Request Namespace

The Request namespace handles declarative fetch operations:

```javascript
{
  tagName: 'user-profile',
  $userData: {
    Request: {
      url: "/api/users/123",
      method: "GET", // optional
      headers: { "Authorization": "Bearer token" }, // optional
      // ... all standard fetch options supported
    }
  }
}
```

### Supported Request Options

- `url` (required) - The request URL
- `method` - HTTP method (GET, POST, PUT, DELETE, etc.)
- `headers` - Request headers object
- `body` - Request body (objects auto-stringify to JSON)
- `mode` - CORS mode (cors, no-cors, same-origin)
- `credentials` - Credentials policy (omit, same-origin, include)
- `cache` - Cache control (default, no-store, reload, no-cache, etc.)
- `redirect` - Redirect handling (follow, error, manual)
- `referrer` - Referrer policy
- `integrity` - Subresource integrity hash
- `keepalive` - Keep connection alive
- `signal` - AbortController wrapper: `{ AbortController: {} }`

### Body Type Wrappers

For special body types, use wrapper objects:

```javascript
// FormData wrapper
body: {
  FormData: {
    field1: "value1",
    field2: "value2"
  }
}

// URLSearchParams wrapper  
body: {
  URLSearchParams: {
    param1: "value1",
    param2: "value2"
  }
}

// Blob wrapper
body: {
  Blob: {
    type: "text/plain",
    content: "text content"
  }
}

// ArrayBuffer wrapper
body: {
  ArrayBuffer: [1, 2, 3, 4] // Array of bytes
}
```

## Future Namespaces

The system is designed to support additional namespaces:

```javascript
// Future WebSocket namespace (example)
{
  $websocket: {
    WebSocket: {
      url: "wss://example.com/socket",
      protocols: ["chat", "superchat"]
    }
  }
}

// Future IndexedDB namespace (example)
{
  $database: {
    IndexedDB: {
      name: "myDatabase",
      version: 1,
      stores: ["users", "posts"]
    }
  }
}
```

## Implementation Details

### Namespace Handler Registration

Handlers are registered using the namespace system:

```typescript
import { registerNamespaceHandler, type NamespaceHandler } from './namespaces';

const requestHandler: NamespaceHandler = (el, property, spec) => {
  // Handle the Request specification
  // Return cleanup function
  return () => {};
};

registerNamespaceHandler('Request', requestHandler);
```

### Property Processing Flow

1. `adoptNode()` processes each property through the default handler
2. Default handler calls `detectNamespace()` to check for reserved keys
3. If namespace detected, `handleNamespace()` delegates to registered handler
4. Handler creates appropriate reactive signals and binds to element property

### Removed Functions

The following functions were removed as part of the modular refactor:

- `isRequest()` - Replaced by generic namespace detection
- `isNativeRequest()` - Native Request support removed
- `bindRequestProperty()` - Integrated into namespace handler
- `createFetchSignal()` - Made internal to requests module
- `convertDDOMRequestToNative()` - Made internal, renamed to `convertToNativeRequest()`

## Benefits

✅ **Modular Design** - Each namespace has its own dedicated handler  
✅ **Extensible** - Easy to add new namespaces without modifying core logic  
✅ **Clean Code** - No hardcoded conditional chains  
✅ **Type Safe** - TypeScript interfaces for each namespace  
✅ **Maintainable** - Clear separation of concerns  

## Migration

No migration needed! Existing Request syntax continues to work exactly as before:

```javascript
// This syntax still works perfectly
{
  $userData: {
    Request: {
      url: "/api/users/123"
    }
  }
}
```

The refactor is purely internal - the external API remains unchanged.