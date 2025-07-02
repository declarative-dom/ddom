# Request Namespace

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