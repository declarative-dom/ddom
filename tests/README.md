# DDOM Testing Framework

This directory contains comprehensive tests for the DDOM (Declarative DOM) library.

## Test Structure

- **`validation.test.js`** - Core DDOM functionality tests based on validation-test.html
- **`basic-reactivity.test.js`** - Tests for basic reactivity features
- **`complete-demo.test.js`** - Tests for complete demo functionality
- **`dynamic-list.test.js`** - Tests for dynamic list operations
- **`performance.test.js`** - Performance and stress tests
- **`template-literal.test.js`** - Template literal functionality tests
- **`reactive-custom-elements.test.js`** - Custom elements with reactivity tests
- **`interactive-form.test.js`** - Form handling and validation tests

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Test Coverage
```bash
npm run test:coverage
```

### UI Mode
```bash
npm run test:ui
```

### Specific Test File
```bash
npm test -- tests/validation.test.js
```

## Test Features

### Core DDOM Features Tested

1. **Library Loading & Exports**
   - All required functions and classes are properly exported
   - DDOM function works as expected

2. **Transparent Signal Proxies**
   - Properties become reactive automatically
   - Property updates work correctly

3. **Template Literal Reactivity**
   - `${...}` expressions are processed correctly
   - Updates to referenced properties trigger re-evaluation

4. **String Address Resolution**
   - Property accessor strings work (e.g., `'window.property'`)
   - Nested object access works

5. **Protected Properties**
   - `id` and `tagName` properties have special handling
   - Other properties remain fully reactive

6. **Performance Benchmarks**
   - Multiple property updates are efficient
   - Stress tests complete in reasonable time

### Example-Specific Tests

Each test file corresponds to an example in the `examples/` folder:

- **Basic Reactivity**: Signal creation and element updates
- **Complete Demo**: Comprehensive feature demonstration
- **Dynamic List**: Array operations and filtering
- **Performance**: Benchmarking and optimization
- **Template Literal**: Expression parsing and evaluation
- **Reactive Custom Elements**: Component-based development
- **Interactive Form**: Form handling and validation

## Test Environment

- **Framework**: Vitest with jsdom
- **Environment**: Node.js with DOM simulation
- **Coverage**: Comprehensive coverage reporting
- **CI/CD**: GitHub Actions integration

## Test Methodology

Tests are designed to:
- Validate actual DDOM behavior (not assumptions)
- Test both success and edge cases
- Ensure performance requirements are met
- Verify all examples work correctly
- Maintain compatibility across Node.js versions