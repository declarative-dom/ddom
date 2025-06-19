# Request Namespace Tests

This directory contains dedicated tests for the DDOM Request namespace functionality.

## Test Files

All tests are now located in the `tests/` directory:

### 1. request-namespace-basic.html / request-namespace-basic.js
Tests basic Request namespace functionality including:
- Simple GET requests
- POST requests with JSON bodies
- Requests with custom headers
- Reactive signal updates
- JSONPlaceholder API integration

### 2. request-namespace-body-types.html / request-namespace-body-types.js
Tests various body type conversions:
- JSON object bodies (automatic JSON.stringify)
- Array bodies (automatic JSON.stringify)
- FormData bodies (using FormData wrapper syntax)
- URLSearchParams bodies (using URLSearchParams wrapper syntax)

### 3. request-namespace-error-handling.html / request-namespace-error-handling.js
Tests error handling scenarios:
- 404 Not Found errors
- Network errors (invalid URLs)
- HTTP status errors (500, etc.)
- Error object structure validation
- Control test for valid requests

## Usage

1. Build the library: `npm run build` (from the `lib` directory)
2. Start a local server: `python3 -m http.server 8080` (from the root directory)
3. Open test files in a browser: `http://localhost:8080/tests/request-namespace-basic.html`

## Expected Results

All tests should demonstrate:
- ✅ Proper Request namespace detection and handling
- ✅ Automatic signal creation and updates
- ✅ Correct body type conversions
- ✅ Structured error handling
- ✅ Integration with JSONPlaceholder API
- ✅ Reactive UI updates based on fetch results

## Test Structure

Each test is built entirely with DDOM:
1. HTML files only provide basic bootstrapping
2. JavaScript files contain complete DDOM declarative specifications
3. All UI, styling, and interactions are declared in DDOM objects
4. Reactive effects are set up in the `onMounted` callback
5. Results display with success/error styling using DDOM styles

## Key Features Tested

- **Namespace Detection**: Verifies `{ Request: { ... } }` syntax is properly recognized
- **Request Conversion**: Tests conversion from namespace spec to native Request objects
- **Fetch Execution**: Confirms actual HTTP requests are made
- **Signal Integration**: Validates reactive signal creation and updates
- **Error Handling**: Tests network errors, HTTP errors, and parsing errors
- **Body Processing**: Verifies different body types are handled correctly
- **Response Parsing**: Tests JSON/text content-type detection and parsing

## Notes

- Tests use JSONPlaceholder (https://jsonplaceholder.typicode.com) for real API calls
- Error handling tests intentionally trigger various error conditions
- All tests demonstrate the serializable Request namespace syntax
- Tests are completely declarative using DDOM syntax (no imperative DOM manipulation)