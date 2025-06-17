# Requests Module

The `requests` module provides declarative fetch capabilities for DDOM, allowing you to use the standard `Request` constructor to automatically fetch data and store it in reactive signals.

## What is Declarative Fetch?

Declarative fetch allows you to define HTTP requests directly in your DDOM object specifications using the standard `Request` constructor. When DDOM encounters a `Request` object as a property value, it automatically:

1. Performs the fetch operation
2. Creates a Signal to store the result
3. Updates the Signal when the fetch completes
4. Handles errors gracefully

## Basic Usage

### Simple GET Request

```javascript
{
  tagName: 'user-profile',
  userData: new Request("/api/users/123")
}
```

The `userData` property becomes a Signal containing the fetched data.

### Request with Options

```javascript
{
  tagName: 'product-form',
  submitResult: new Request("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Product Name", price: 99.99 })
  })
}
```

### Using the Signal

```javascript
// In your component or effect
const element = document.querySelector('user-profile');
const userData = element.userData.get(); // Access the fetched data
```

## Features

- **Zero New Syntax**: Uses the standard `Request()` constructor
- **Automatic Signal Creation**: Properties become reactive signals
- **Error Handling**: Fetch errors are captured and stored in the signal
- **JSON/Text Parsing**: Automatically tries JSON parsing, falls back to text

## Response Handling

The module automatically handles response parsing:

1. First tries to parse as JSON
2. Falls back to text if JSON parsing fails
3. Stores errors in the signal if fetch fails

Example error response:
```javascript
{ error: "Network error message" }
```

## Current Limitations

1. **Static Requests**: Template literals and property accessors within Request constructor arguments are evaluated statically when the object is created
2. **No Re-fetching**: Requests are fetched once when first encountered
3. **Property-Level Reactivity**: Changes to the entire Request property will trigger a new fetch, but changes to dependencies within the Request won't

## Future Enhancements

- Support for reactive Request parameters using template literals
- Automatic re-fetching when dependencies change
- Request caching and deduplication
- AbortController integration for request cancellation

## API Reference

### `isRequest(value: any): boolean`

Detects if a value is a Request object.

### `createFetchSignal(request: Request): Signal.State<any>`

Creates a fetch signal for a Request object that automatically fetches and stores the result.

### `bindRequestProperty(el: any, property: string, request: Request): () => void`

Sets up reactive fetch binding for a property. Used internally by DDOM's property handling system.