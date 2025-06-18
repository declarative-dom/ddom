# Request Namespace Tests

This directory contains dedicated tests for the DDOM Request namespace functionality.

## Test Files

### 1. request-namespace-basic-test.html
Tests basic Request namespace functionality including:
- Simple GET requests
- POST requests with JSON bodies
- Requests with custom headers
- Reactive signal updates
- JSONPlaceholder API integration

### 2. request-namespace-body-types-test.html
Tests various body type conversions:
- JSON object bodies (automatic JSON.stringify)
- Array bodies (automatic JSON.stringify)
- FormData bodies (using FormData wrapper syntax)
- URLSearchParams bodies (using URLSearchParams wrapper syntax)

### 3. request-namespace-error-handling-test.html
Tests error handling scenarios:
- 404 Not Found errors
- Network errors (invalid URLs)
- HTTP status errors (500, etc.)
- Error object structure validation
- Control test for valid requests

## Usage

1. Build the library: `npm run build` (from the `lib` directory)
2. Start a local server: `python3 -m http.server 8080` (from the `examples` directory)
3. Open test files in a browser: `http://localhost:8080/request-namespace-basic-test.html`

## Expected Results

All tests should demonstrate:
- ✅ Proper Request namespace detection and handling
- ✅ Automatic signal creation and updates
- ✅ Correct body type conversions
- ✅ Structured error handling
- ✅ Integration with JSONPlaceholder API
- ✅ Reactive UI updates based on fetch results

## Test Structure

Each test file follows this pattern:
1. Creates DDOM components with Request namespace specifications
2. Uses `DDOM.createElement` to create elements
3. Sets up `DDOM.createEffect` for reactive updates
4. Displays results in the UI with success/error styling
5. Shows raw JSON responses for debugging

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
- Legacy `new Request()` syntax is no longer supported or tested