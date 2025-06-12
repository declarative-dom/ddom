# Property Accessor Resolution

The `accessors` module provides utilities for resolving JavaScript property accessor expressions in DDOM. Property accessors enable declarative reference to values throughout the application using standard JavaScript dot notation.

## What are Property Accessors?

Property accessors are string expressions that use JavaScript's property access syntax to reference values. They provide a clean, intuitive way to reference data from anywhere in your application without complex wiring.

## Supported Patterns

- `window.*` - Access global window properties
- `document.*` - Access document properties  
- `this.*` - Access properties relative to the current element

## Examples

### Basic Usage

```javascript
// Reference global data
{
  tagName: 'div',
  userData: 'window.currentUser',  // Resolves to window.currentUser
  settings: 'document.appSettings' // Resolves to document.appSettings
}

// Reference parent element data
{
  tagName: 'child-element', 
  parentData: 'this.parentNode.sharedData' // Resolves to parent's sharedData property
}
```

### Signal References

```javascript
// Parent component with signals
{
  tagName: 'parent-component',
  $count: 0,
  $message: 'Hello',
  
  children: [
    {
      tagName: 'child-component',
      // Direct signal references
      counterSignal: 'this.parentNode.$count',
      messageSignal: 'this.parentNode.$message'
    }
  ]
}
```

### Array Data References

```javascript
// Reference array data for dynamic lists
{
  tagName: 'div',
  children: {
    items: 'window.todoList',  // Reference global todo array
    map: (item) => ({
      tagName: 'div',
      textContent: item.text
    })
  }
}
```

### Complex Object References

```javascript
// Reference nested object properties
{
  tagName: 'user-profile',
  avatarUrl: 'document.currentUser.profile.avatar',
  preferences: 'window.app.userSettings.theme'
}
```

## API Reference

### `isPropertyAccessor(value: string): boolean`

Detects if a string is a property accessor expression.

### `resolvePropertyAccessor(accessor: string, contextNode: Node): any`

Resolves a property accessor string to its actual value. Returns the resolved value or `null` if resolution fails.

## Integration

Property accessors are automatically detected and resolved by DDOM when:
1. A string property starts with `window.`, `document.`, or `this.`
2. The property is not a template literal (doesn't contain `${`)
3. The accessor can be successfully resolved

This provides a seamless way to reference data throughout your application without manual wiring or complex setup.
