# DDOM Tests

This directory contains dedicated tests for DDOM functionality, particularly the Request namespace feature.

## Test Structure

All tests follow a consistent DDOM-only pattern:
- **HTML files**: Provide minimal bootstrapping (HTML document with script imports)
- **JavaScript files**: Contain complete DDOM declarative specifications with all UI, styling, and logic

## Request Namespace Tests

### request-namespace-basic
Tests fundamental Request namespace functionality:
- Basic GET requests with JSONPlaceholder API
- POST requests with JSON body data
- Custom headers handling
- Reactive signal creation and updates

### request-namespace-body-types
Tests various request body type conversions:
- JSON objects (automatic JSON.stringify)
- Arrays (automatic JSON.stringify)
- FormData wrapper syntax
- URLSearchParams wrapper syntax

### request-namespace-error-handling
Tests comprehensive error handling scenarios:
- 404 Not Found responses
- Network errors (invalid domains)
- HTTP status errors (500, etc.)
- Structured error objects with type and timestamp
- Control tests for valid requests

## Running Tests

1. Build the library:
   ```bash
   cd lib && npm install && npm run build
   ```

2. Start a local server from the root directory:
   ```bash
   python3 -m http.server 8080
   ```

3. Open test files in a browser:
   - http://localhost:8080/tests/request-namespace-basic.html
   - http://localhost:8080/tests/request-namespace-body-types.html
   - http://localhost:8080/tests/request-namespace-error-handling.html

## Test Features

### DDOM-Only Implementation
- All UI elements declared in DDOM objects
- Styling applied through DDOM style properties
- No imperative DOM manipulation
- Reactive effects managed through `onMounted` callbacks

### Real API Integration
- Uses JSONPlaceholder API (https://jsonplaceholder.typicode.com) for realistic JSON data
- Uses httpbin.org for form data and HTTP status code testing
- Actual network requests demonstrate real-world functionality

### Request Namespace Syntax
Tests use the current serializable syntax:

```javascript
$userData: {
  Request: {
    url: "https://api.example.com/users/123",
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: {
      name: "John Doe",
      email: "john@example.com"
    }
  }
}
```

### Expected Results
All tests should demonstrate:
- ✅ Proper Request namespace detection and handling
- ✅ Automatic signal creation and reactive updates
- ✅ Correct body type conversions
- ✅ Structured error handling with timestamps
- ✅ Real API integration with live data
- ✅ Complete DDOM declarative implementation