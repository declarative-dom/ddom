# Computed Properties Example

This example demonstrates DDOM's support for **computed properties** using native JavaScript getter syntax. Computed properties allow you to define dynamic values that automatically recalculate when their dependencies change.

## Syntax

DDOM supports **native ES6+ getter syntax** for computed properties:

```javascript
get propertyName() {
  return /* computed value */;
}
```

This uses standard JavaScript getter syntax - no new DSL to learn!

## Key Benefits

1. **Native JavaScript**: Uses standard JavaScript getter syntax - no new DSL to learn
2. **Automatic Reactivity**: Works seamlessly with DDOM's reactive signals (`$properties`)
3. **Template Integration**: Computed properties can be accessed in JavaScript template literal expressions
4. **Performance**: Only recalculates when dependencies actually change
5. **Reactive Attributes**: Computed properties can drive attribute updates for CSS styling

## Reactive Styling Pattern

Instead of trying to use computed properties directly in styles (which aren't reactive), use computed properties to set attributes that CSS can target:

```javascript
// ❌ Don't do this - styles aren't reactive
style: {
  backgroundColor: '{parentNode.badgeColor}' // Won't update!
}

// ✅ Do this - use reactive attributes with CSS selectors
levelClass: {
  get() {
    const score = this.$score.get();
    return score >= 90 ? 'expert' : 'beginner';
  }
},

connectedCallback() {
  // Update attributes reactively
  const updateAttributes = () => {
    this.setAttribute('data-level', this.levelClass);
  };
  
  this.$score.subscribe(updateAttributes);
  updateAttributes(); // Initial
},

style: {
  // Static CSS that targets reactive attributes
  '[data-level="expert"] .badge': { backgroundColor: '#28a745' },
  '[data-level="beginner"] .badge': { backgroundColor: '#6c757d' }
}
```

## Example Usage

```javascript
{
  tagName: 'user-profile',
  
  // Reactive state
  $firstName: 'John',
  $lastName: 'Doe',
  $score: 85,
  
  // Computed properties using native getter syntax
  get fullName() {
    return `${this.$firstName.get()} ${this.$lastName.get()}`;
  },
  
  get userLevel() {
    const score = this.$score.get();
    if (score >= 90) return 'Expert';
    if (score >= 70) return 'Advanced';  
    return 'Beginner';
  },
  
  // Use in templates
  children: [
    {
      tagName: 'h2',
      textContent: '{parentNode.fullName}' // Accesses computed property
    },
    {
      tagName: 'span',
      textContent: 'Level: {parentNode.userLevel}'
    }
  ]
}
```

## Implementation Details

The implementation leverages JavaScript's `Object.defineProperty()` to create actual getter properties on DOM elements:

- Detects objects with a `get` function
- Defines a getter property using `Object.defineProperty()`
- The getter function is bound to the element context (`this`)
- Template expressions can access these properties naturally

## Integration with Templates

Computed properties work seamlessly with JavaScript template literal expressions:

```javascript
// In component definition
displayMessage: {
  get() {
    return `Welcome, ${this.$userName.get()}!`;
  }
},

// In template
textContent: '${this.parentNode.displayMessage}'
```

## Best Practices

1. **Keep getters pure**: Avoid side effects in getter functions
2. **Use reactive signals**: Access `$properties` via `.get()` for reactivity
3. **Optimize expensive computations**: Consider memoization for complex calculations
4. **Name clearly**: Use descriptive names that indicate the computed nature

This approach maintains DDOM's philosophy of leveraging native web standards while providing powerful reactive capabilities without introducing new syntax or complexity.