# Dynamic Content with ArrayExprs

DDOM provides **ArrayExprs** for dynamic content generation, particularly useful for rendering lists and repeated content. This feature enables data-driven UI construction while maintaining DDOM's declarative philosophy.

## Standards Alignment

ArrayExprs are modeled after the ECMAScript `Array.from(items, mapper)` method and chainable array functions. This design ensures familiar syntax for JavaScript developers while providing powerful data transformation capabilities:

* **`items`** - Source data array (equivalent to `Array.from` first parameter)
* **`map`** - Transformation function (equivalent to `Array.from` mapper parameter)
* **`filter`** - Declarative filtering (equivalent to `Array.prototype.filter`)
* **`sort`** - Declarative sorting (equivalent to `Array.prototype.sort`)
* **`prepend`/`append`** - Additional items for list composition

## Syntax

```javascript
{
  items: T[],                    // Source data array
  map: string | R | ((item: T, index: number) => R),  // Transformation
  filter?: FilterExpr[],  // Optional filtering
  sort?: SortExpr[],      // Optional sorting  
  prepend?: R[],                 // Optional items to prepend
  append?: R[]                   // Optional items to append
}
```

## Use Cases

ArrayExprs excel at:

* **Dynamic Lists**: Rendering data collections as UI elements
* **Template Mapping**: Converting data objects to UI components using string templates
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
    map: (item) => ({
      tagName: 'li',
      textContent: `${item.name} - $${item.price}`,
      id: `item-${item.id}`
    })
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
      textContent: '{name} ({role})',
      className: 'user-{role}'
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
    map: (user) => ({
      tagName: 'tr',
      children: [
        { tagName: 'td', textContent: user.name },
        { tagName: 'td', textContent: user.age.toString() }
      ]
    })
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
    map: (item) => ({
      tagName: 'a',
      textContent: item.text,
      href: item.href
    })
  }
}
```

## Integration with Templates

ArrayExprs work seamlessly with JavaScript template literals for even more dynamic content:

```javascript
{
  tagName: 'div',
  children: {
    items: userData,
    map: {
      tagName: 'div',
      textContent: 'User: ${this.name}',
      className: 'user-card user-${this.status}',
      style: { color: '${this.themeColor}' }
    }
  }
}
```