# DDOM Testing Framework

This directory contains comprehensive tests for the DDOM (Declarative DOM) library.

## Overview

The testing framework validates all core DDOM functionality including:
- ✅ Library loading and exports
- ✅ Transparent signal proxies
- ✅ Template literal reactivity
- ✅ String address resolution
- ✅ Protected properties
- ✅ Performance benchmarks
- ✅ Basic reactivity features
- ✅ Complete demo functionality

## Test Structure

### Core Test Files

- **`validation.test.js`** - Core DDOM functionality tests (12 tests)
- **`basic-reactivity.test.js`** - Basic reactivity features (4 tests)
- **`complete-demo-simple.test.js`** - Complete demo functionality (4 tests)
- **`performance-simple.test.js`** - Performance and stress tests (5 tests)

### Test Infrastructure

- **`setup.js`** - Test environment setup and utilities
- **`vitest.config.js`** - Vitest configuration with jsdom
- **`.github/workflows/test.yml`** - CI/CD automation

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Test Coverage
```bash
npm run test:coverage
```

### UI Mode (interactive)
```bash
npm run test:ui
```

### Specific Test File
```bash
npm test -- tests/validation.test.js
```

## Test Results

**Current Status: ✅ 25/25 tests passing**

- Core functionality: 12/12 ✅
- Basic reactivity: 4/4 ✅  
- Complete demo: 4/4 ✅
- Performance: 5/5 ✅

## Key Features Tested

### 1. Library Loading & Exports
- All required functions and classes are properly exported
- DDOM function creates reactive window properties

### 2. Transparent Signal Proxies
- Properties become reactive automatically via Signal objects
- Property updates work correctly with `.get()` and `.set()` methods

### 3. Template Literal Reactivity
- `${...}` expressions are processed correctly
- Template literals reference reactive properties

### 4. String Address Resolution  
- Property accessor strings work (e.g., `'window.property'`)
- Nested object access functions properly

### 5. Protected Properties
- `id` and `tagName` properties have special handling
- Other properties remain fully reactive

### 6. Performance Benchmarks
- Multiple property updates complete efficiently
- Signal creation and updates meet performance requirements
- Element creation performs adequately

## Test Environment

- **Framework**: Vitest v3.2.3
- **Environment**: jsdom (Node.js with DOM simulation)
- **Coverage**: Built-in Vitest coverage reporting
- **CI/CD**: GitHub Actions with Node.js 18.x and 20.x

## Test Methodology

Tests validate actual DDOM behavior by:
- Creating DDOM instances and checking window properties
- Testing Signal object behavior with `.get()` and `.set()` methods
- Validating reactive updates and property changes
- Measuring performance of common operations
- Ensuring all examples work correctly

## Development Notes

- DDOM creates Signal objects for reactive properties on `window`
- Use `getSignalValue()` utility to extract values from Signal objects
- Tests avoid complex DOM operations that aren't well-supported in jsdom
- Focus on validating core reactivity and functionality over visual DOM testing