# Dynamic Content with MappedArrayExprs

DDOM provides **MappedArrayExprs** for dynamic content generation, particularly useful for rendering lists and repeated content. This feature enables data-driven UI construction while maintaining DDOM's declarative philosophy.

## Standards Alignment

MappedArrayExprs are modeled after the ECMAScript `Array.from(items, mapper)` method and chainable array functions. This design ensures familiar syntax for JavaScript developers while providing powerful data transformation capabilities:

* **`items`** - Source data array (equivalent to `Array.from` first parameter)
* **`map`** - Object or string template for transformation (declarative alternative to `Array.from` mapper)
* **`filter`** - Declarative filtering (equivalent to `Array.prototype.filter`)
* **`sort`** - Declarative sorting (equivalent to `Array.prototype.sort`)
* **`prepend`/`append`** - Additional items for list composition

## Syntax

```javascript
{
  items: T[],                    // Source data array
  map: string | object,          // Object template or string template
  filter?: FilterExpr[],         // Optional filtering
  sort?: SortExpr[],            // Optional sorting  
  prepend?: R[],                // Optional items to prepend
  append?: R[]                  // Optional items to append
}
```

## Mapping Types

### Object Templates
Use object templates with function properties for dynamic values:
```javascript
map: {
  tagName: 'div',
  id: (item) => `item-${item.id}`,
  textContent: (item) => `${item.name} - $${item.price}`,
  className: (item) => item.active ? 'active' : 'inactive'
}
```

### String Templates
Use string templates for simple text interpolation:
```javascript
map: '${item.name} costs $${item.price}'
```

## Use Cases

MappedArrayExprs excel at:

* **Dynamic Lists**: Rendering data collections as UI elements
* **Template Mapping**: Converting data objects to UI components using object templates
* **Conditional Rendering**: Filtering items based on data properties
* **Sorted Displays**: Ordering content by various criteria
* **Data-Driven Components**: Building UIs that respond to changing datasets

## Examples

### Basic Data-to-Element Mapping

```javascript
{
  tagName: 'ul',
  children: {
    items: [
      { id: 1, name: 'Apple', price: 1.50 },
      { id: 2, name: 'Banana', price: 0.75 },
      { id: 3, name: 'Cherry', price: 2.00 }
    ],
    map: {
      tagName: 'li',
      textContent: (item) => `${item.name} - $${item.price}`,
      id: (item) => `item-${item.id}`
    }
  }
}
```

### Property Accessor Integration

```javascript
// Reference global or parent data using property accessors
{
  tagName: 'div',
  children: {
    items: 'window.userData',  // Property accessor to global data
    map: {
      tagName: 'div',
      textContent: (user) => user.name,
      className: (user) => `user-${user.role}`
    }
  }
}
```

### String Template Mapping

```javascript
{
  tagName: 'div',
  children: {
    items: [{ name: 'John', role: 'Admin' }, { name: 'Jane', role: 'User' }],
    map: {
      tagName: 'span', 
      textContent: '${name} (${role})',
      className: 'user-${role}'
    }
  }
}
```

### Filtering and Sorting

```javascript
{
  tagName: 'table',
  children: {
    items: [
      { name: 'John', age: 30, active: true },
      { name: 'Jane', age: 25, active: false },
      { name: 'Bob', age: 35, active: true }
    ],
    filter: [
      { leftOperand: 'active', operator: '===', rightOperand: true },
      { leftOperand: 'age', operator: '>=', rightOperand: 30 }
    ],
    sort: [
      { sortBy: 'age', direction: 'desc' }
    ],
    map: {
      tagName: 'tr',
      children: [
        { tagName: 'td', textContent: (user) => user.name },
        { tagName: 'td', textContent: (user) => user.age.toString() }
      ]
    }
  }
}
```

### List Composition

```javascript
{
  tagName: 'nav',
  children: {
    items: [{ text: 'Products', href: '/products' }],
    prepend: [{ tagName: 'a', textContent: 'Home', href: '/' }],
    append: [{ tagName: 'a', textContent: 'Contact', href: '/contact' }],
    map: {
      tagName: 'a',
      textContent: (item) => item.text,
      href: (item) => item.href
    }
  }
}
```

### Reactive Properties Integration

```javascript
{
  tagName: 'div',
  children: {
    items: 'window.$userList',  // Reactive signal
    map: {
      tagName: 'div',
      id: (item) => `user-${item.id}`,
      $textContent: (item) => item.name,        // Reactive property
      $className: (item) => `user-${item.role}`, // Updates automatically
      onclick: (item) => () => selectUser(item.id)
    }
  }
}
```

## Integration with Property Accessors

MappedArrayExprs work seamlessly with property accessors for referencing data:

```javascript
{
  tagName: 'div',
  children: {
    items: 'this.parentNode.userList',  // Property accessor to parent data
    map: {
      tagName: 'div',
      textContent: 'window.$currentTheme',  // Property accessor in template
      className: (item) => `user-card user-${item.status}`
    }
  }
}
```