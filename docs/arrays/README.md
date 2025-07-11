# Dynamic Content with Array Namespaces

DDOM provides **Array namespaces** for dynamic content generation, particularly useful for rendering lists and repeated content. This feature enables data-driven UI construction while maintaining DDOM's declarative philosophy and following the Rule of Least Power.

## Standards Alignment

Array namespaces are modeled after the ECMAScript `Array.from(items, mapper)` method and chainable array functions, but strictly adhere to the Rule of Least Power by using only declarative templates instead of functions. This design ensures maintainable, serializable code while providing powerful data transformation capabilities:

* **`prototype: 'Array'`** - Declares the namespace as an Array-type configuration
* **`items`** - Source data array (equivalent to `Array.from` first parameter)
* **`map`** - Object or string template for transformation (declarative alternative to `Array.from` mapper)
* **`filter`** - Declarative filtering expressions (equivalent to `Array.prototype.filter`)
* **`sort`** - Declarative sorting expressions (equivalent to `Array.prototype.sort`)
* **`prepend`/`append`** - Additional items for list composition

## Syntax

```javascript
{
  prototype: 'Array',            // Required: declares this as an Array namespace
  items: T[] | string,           // Source data array or property accessor
  map?: string | object,         // Object template or string template (declarative only)
  filter?: FilterCriteria[],         // Optional filtering expressions
  sort?: SortCriteria[],            // Optional sorting expressions  
  prepend?: R[],                // Optional items to prepend
  append?: R[]                  // Optional items to append
}
```

## Mapping Types

### Object Templates
Use object templates with template string properties for dynamic values:
```javascript
map: {
  tagName: 'div',
  id: 'item-${item.id}',
  textContent: '${item.name} - $${item.price}',
  className: '${item.active ? "active" : "inactive"}'
}
```

### String Templates
Use string templates for simple text interpolation:
```javascript
map: '${item.name} costs $${item.price}'
```

## Use Cases
## Use Cases

Array namespaces excel at:

* **Dynamic Lists**: Rendering data collections as UI elements
* **Template Mapping**: Converting data objects to UI components using declarative object templates
* **Conditional Rendering**: Filtering items based on data properties using filter expressions
* **Sorted Displays**: Ordering content by various criteria using sort expressions
* **Data-Driven Components**: Building UIs that respond to changing datasets

## Examples

### Basic Data-to-Element Mapping

```javascript
{
  tagName: 'ul',
  children: {
    prototype: 'Array',
    items: [
      { id: 1, name: 'Apple', price: 1.50 },
      { id: 2, name: 'Banana', price: 0.75 },
      { id: 3, name: 'Cherry', price: 2.00 }
    ],
    map: {
      tagName: 'li',
      textContent: '${item.name} - $${item.price}',
      id: 'item-${item.id}'
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
    prototype: 'Array',
    items: 'window.userData',  // Property accessor to global data
    map: {
      tagName: 'div',
      textContent: '${user.name}',
      className: 'user-${user.role}'
    }
  }
}
```

### String Template Mapping

```javascript
{
  tagName: 'div',
  children: {
    prototype: 'Array',
    items: [{ name: 'John', role: 'Admin' }, { name: 'Jane', role: 'User' }],
    map: {
      tagName: 'span', 
      textContent: '${item.name} (${item.role})',
      className: 'user-${item.role}'
    }
  }
}
```

### Filtering and Sorting

```javascript
{
  tagName: 'table',
  children: {
    prototype: 'Array',
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
        { tagName: 'td', textContent: '${item.name}' },
        { tagName: 'td', textContent: '${item.age}' }
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
    prototype: 'Array',
    items: [{ text: 'Products', href: '/products' }],
    prepend: [{ tagName: 'a', textContent: 'Home', href: '/' }],
    append: [{ tagName: 'a', textContent: 'Contact', href: '/contact' }],
    map: {
      tagName: 'a',
      textContent: '${item.text}',
      href: '${item.href}'
    }
  }
}
```

### Reactive Properties Integration

```javascript
{
  tagName: 'div',
  children: {
    prototype: 'Array',
    items: 'window.$userList',  // Reactive signal
    map: {
      tagName: 'div',
      id: 'user-${item.id}',
      $textContent: '${item.name}',        // Reactive property
      $className: 'user-${item.role}',     // Updates automatically
      onclick: 'selectUser(${item.id})'    // Declarative event handler
}
```

## Integration with Property Accessors

Array namespaces work seamlessly with property accessors for referencing data:

```javascript
{
  tagName: 'div',
  children: {
    prototype: 'Array',
    items: 'this.parentNode.userList',  // Property accessor to parent data
    map: {
      tagName: 'div',
      textContent: 'window.$currentTheme',  // Property accessor in template
      className: 'user-card user-${item.status}'  // Declarative template
    }
  }
}
}
```