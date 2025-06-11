# Declarative DOM Types

TypeScript type definitions for Declarative DOM (DDOM), a universal syntax for expressing DOM structures using JavaScript object literals. These types serve as the universal source of truth for defining DDOM syntax, enabling type-safe, declarative construction of web interfaces.

## Installation

```bash
npm install @declarative-dom/types
```

## Usage

```typescript
import { MappedArrayExpr, FilterExpr, StyleExpr, CustomElementSpec } from '@declarative-dom/types';

// Example: Define a mapped array expression
const mappedArray: MappedArrayExpr<{ id: number; name: string }, string> = {
  items: [{ id: 1, name: 'Item 1' }, { id: 2, name: 'Item 2' }],
  map: (item) => item.name,
  filter: [{ leftOperand: 'id', operator: '>=', rightOperand: 2 }],
};

// Example: Define a custom element specification
const customElement: CustomElementSpec = {
  tagName: 'my-element',
  connectedCallback: (element) => {
    console.log('Element connected:', element);
  },
};

// Example: Define a style expression
const style: StyleExpr = {
  backgroundColor: 'blue',
  ':hover': {
    backgroundColor: 'red',
  },
};
```

## Available Types

### Core Types

- `MappedArrayExpr<T, R>` - Defines declarative array mapping, filtering, and sorting.
- `FilterExpr<T>` - Defines filter expressions for array items.
- `SortExpr<T>` - Defines sorting expressions for array items.
- `StyleExpr` - Defines declarative CSS styles with support for nesting.
- `CustomElementSpec` - Defines specifications for custom elements.
- `DOMSpec` - Represents the declarative structure of DOM nodes.
- `ElementSpec` - Represents individual DOM elements.

### Utility Types

- `FilterOper` - Supported operators for filter expressions.
- `Operator` - Supported operators for general expressions.

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Publishing

```bash
npm publish
```

## License

MIT
