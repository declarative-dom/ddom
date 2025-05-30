# Your Types Library

TypeScript type definitions for your library.

## Installation

```bash
npm install @your-org/your-types-library
```

## Usage

```typescript
import { Config, UserProfile, ApiResponse } from '@your-org/your-types-library';

// Use the types in your code
const config: Config = {
  name: 'my-config',
  enabled: true,
  metadata: { version: '1.0.0' }
};

const user: UserProfile = {
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  createdAt: new Date()
};

const response: ApiResponse<UserProfile> = {
  success: true,
  data: user
};
```

## Available Types

### Core Interfaces

- `Config` - Base configuration interface
- `UserProfile` - User profile interface
- `ApiResponse<T>` - Generic API response wrapper
- `PaginationParams` - Pagination parameters

### Utility Types

- `UserRole` - Available user roles
- `EventHandler<T>` - Event handler function type
- `Optional<T>` - Makes all properties optional
- `RequireFields<T, K>` - Makes specific properties required

## Development

### Building

```bash
npm run build
```

### Testing Types

```bash
npm test
```

### Publishing

```bash
npm publish
```

## License

MIT
