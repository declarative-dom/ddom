# DDOM Declarative Fetch Implementation

This document describes the implementation of the declarative fetch feature for DDOM, as requested in GitHub issue #9.

## Overview

The declarative fetch feature allows developers to use a serializable Request object syntax directly in DDOM object specifications. When DDOM encounters a Request object as a property value, it automatically:

1. Performs the fetch operation
2. Creates a Signal to store the result  
3. Updates the Signal when the fetch completes
4. Handles errors gracefully

## Syntax Evolution

### New Serializable Syntax (Current)

```javascript
{
  tagName: 'user-profile',
  $userData: {
    Request: {
      url: "/api/users/123",
      method: "GET",
      headers: { "Content-Type": "application/json" },
      body: { name: "John Doe" }
    }
  }
}
```

### Legacy Syntax (Backward Compatible)

```javascript
{
  tagName: 'user-profile',
  userData: new Request("/api/users/123", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "John Doe" })
  })
}
```

## Implementation Details

### Files Created/Modified

1. **`lib/src/requests/`** - New module containing the declarative fetch functionality
   - `requests.ts` - Core implementation with both syntaxes
   - `index.ts` - Module exports
   - `README.md` - Module documentation

2. **`lib/src/elements/elements.ts`** - Modified to detect and handle both Request syntaxes

3. **`lib/src/index.ts`** - Updated to export new request functions

4. **Examples** - Updated demonstration files:
   - `examples/issue-examples-demo.html` - Examples using new syntax
   - `examples/comprehensive-fetch-demo.html` - Full-featured demo with new syntax
   - `examples/request-feature-test.html` - Tests for both syntaxes
   - `examples/new-request-syntax-demo.html` - New syntax showcase
   - `examples/new-syntax-test.html` - New syntax validation

### Core Functions

#### `isRequest(value: any): boolean`
Detects if a value is a DDOM Request specification object with the new serializable syntax.

#### `isNativeRequest(value: any): boolean`
Detects if a value is a native Request object (for backward compatibility).

#### `convertDDOMRequestToNative(spec: DDOMRequestSpec): Request`
Converts a DDOM Request specification to a native Request object. Features:
- Complete fetch API options support
- Intelligent body conversion (FormData, URLSearchParams, Blob, ArrayBuffer)
- AbortController signal creation
- Type-safe conversion

#### `createFetchSignal(request: Request): Signal.State<any>`
Creates a Signal that automatically fetches the Request and stores the result. Features:
- Request cloning to avoid body consumption issues
- HTTP status code validation
- Content-type aware response parsing (JSON/text)
- Comprehensive error handling with structured error objects

#### `bindRequestProperty(el: any, property: string, requestSpec: Request | DDOMRequestSpec): () => void`
Integrates with DDOM's property handling system to automatically convert Request properties to fetch signals. Supports both legacy and new syntax.

### Integration Points

The feature integrates with DDOM's existing property handling system in `elements.ts`. When processing element properties, the system now checks for both Request syntaxes and automatically converts them to fetch signals.

```javascript
// Handle DDOM Request objects for declarative fetch
else if (isRequest(descriptor.value)) {
    // Set up fetch effect that fetches the Request and stores the result
    bindRequestProperty(el, key, descriptor.value);
}
// Handle native Request objects for declarative fetch (legacy support)
else if (isNativeRequest(descriptor.value)) {
    // Set up fetch effect that fetches the Request and stores the result
    bindRequestProperty(el, key, descriptor.value);
}
```

### Body Type Conversion

The new syntax supports comprehensive body type conversion:

#### FormData
```javascript
body: {
  FormData: {
    field1: "value1",
    file: fileObject
  }
}
```

#### URLSearchParams
```javascript
body: {
  URLSearchParams: {
    param1: "value1",
    param2: "value2"
  }
}
```

#### Blob
```javascript
body: {
  Blob: {
    content: "text content",
    type: "text/plain"
  }
}
```

#### ArrayBuffer
```javascript
body: {
  ArrayBuffer: [1, 2, 3, 4, 5]  // Converted to ArrayBuffer
}
```

#### JSON (Default)
```javascript
body: {
  key: "value",
  nested: { data: "value" }
}
// Automatically converted to JSON.stringify()
```

### Error Handling

The implementation includes comprehensive error handling:

1. **Network Errors**: Captured and stored in signal as structured error objects
2. **HTTP Status Errors**: Non-2xx responses are treated as errors
3. **Parsing Errors**: JSON parsing failures fall back to text parsing
4. **Request Cloning**: Handles cases where request body is already consumed

Error objects have the structure:
```javascript
{
    error: "Error message",
    type: "fetch_error", 
    timestamp: "2024-01-01T00:00:00.000Z"
}
```

### Response Handling

The system automatically handles different response types:

1. **JSON Responses**: Detected by `Content-Type` header, parsed automatically
2. **Text Responses**: Used as fallback or for non-JSON content
3. **Content-Type Detection**: Uses response headers to determine parsing strategy

## Usage Examples

### Basic Usage (New Serializable Syntax)

```javascript
{
  tagName: 'user-profile',
  $userData: {
    Request: {
      url: "/api/users/123"
    }
  },
  $avatar: {
    Request: {
      url: "/api/users/123/avatar"
    }
  }
}
```

### With Full Options (New Serializable Syntax)

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

### Legacy Syntax (Still Supported)

```javascript
{
  tagName: 'user-profile',
  userData: new Request("/api/users/123"),
  avatar: new Request("/api/users/123/avatar", { method: "GET" })
}
```
```

### Accessing the Data

```javascript
// The property becomes a Signal containing the fetch result
const element = document.querySelector('user-profile');
const userData = element.userData.get(); // Access the fetched data

// Set up reactive effects
DDOM.createEffect(() => {
    const data = element.userData.get();
    if (data && !data.error) {
        console.log('User data:', data);
    }
});
```

## Benefits Achieved

✅ **Zero New Syntax**: Uses the standard `Request()` constructor  
✅ **Web Standards Compliance**: Uses the exact same API developers already know  
✅ **Self-Documenting**: Any web developer immediately understands what's happening  
✅ **Parser-Friendly**: Visual builders can easily detect `Request()` objects  
✅ **Automatic Signal Creation**: Properties become reactive signals  
✅ **Error Handling**: Network and parsing errors are captured gracefully  

## Current Limitations

1. **Static Requests**: Template literals and property accessors within Request constructor arguments are evaluated statically
2. **No Re-fetching**: Requests are fetched once when first encountered  
3. **Property-Level Reactivity**: Changes to the entire Request property will trigger a new fetch, but changes to dependencies within the Request won't

## Future Enhancements

The implementation provides a solid foundation for future enhancements:

1. **Reactive Request Parameters**: Support for template literals within Request constructor arguments
2. **Automatic Re-fetching**: Re-fetch when dependencies change
3. **Request Caching**: Avoid duplicate requests for the same URL
4. **AbortController Integration**: Request cancellation support
5. **Request Interceptors**: Middleware for authentication, logging, etc.

## Testing

The implementation includes:
- Comprehensive demo examples
- Error handling demonstrations  
- Real API integration tests (using JSONPlaceholder)
- TypeScript compilation verification
- Bundle inclusion verification

## Conclusion

The declarative fetch feature successfully implements the requirements from GitHub issue #9, providing a zero-syntax-overhead way to perform HTTP requests declaratively in DDOM applications. The implementation is production-ready for the core use cases and provides a foundation for future reactive enhancements.