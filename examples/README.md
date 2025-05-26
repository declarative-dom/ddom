# Declarative DOM Examples

This directory contains example files demonstrating various features and use cases of the Declarative DOM library.

## Main Example Viewer

The easiest way to explore all examples is through the **main example viewer**:

- Open `index.html` in your browser
- Use the navigation buttons to switch between different examples
- All examples are defined as declarative DOM configurations in separate JS modules

## Examples

### 1. Basic Example (`basic.js`)
A simple introduction showing:
- Basic element creation
- Styling with CSS-in-JS
- Simple event handling
- Text content and layout

### 2. Custom Elements (`custom-elements.js`)
Demonstrates the power of custom elements:
- Defining reusable components
- Component composition
- Custom element styling
- Creating component libraries

### 3. Interactive Form (`interactive-form.js`)
Shows form handling and interactivity:
- Form inputs and validation
- Event handling for user input
- State management
- Form submission

### 4. Dynamic List (`dynamic-list.js`)
Advanced example with dynamic content:
- Adding and removing items
- Dynamic DOM updates
- List rendering patterns
- Interactive user interface

## Running the Examples

To run these examples:

1. Make sure you have the declarative-dom library built and available
2. Serve the examples directory with a local web server
3. Open `index.html` in your browser

```bash
# Example using Python's built-in server
cd examples
python -m http.server 8000

# Then visit http://localhost:8000/
```

## Structure

- `index.html` - Main entry point with the example switcher
- `index.js` - Main application logic using declarative DOM
- `basic.js` - Basic example configuration
- `custom-elements.js` - Custom elements example configuration
- `interactive-form.js` - Interactive form example configuration  
- `dynamic-list.js` - Dynamic list example configuration
- Legacy HTML files (individual examples) - Available for reference

## Creating Your Own Examples

Each example follows a similar pattern:
1. Export a default object with declarative DOM configuration
2. Include any necessary helper functions and state
3. Use the `onRender` callback for post-render setup if needed

Example structure:
```js
export default {
  document: {
    body: {
      style: { /* styles */ },
      children: [
        { /* declarative elements */ }
      ]
    }
  },
  onRender: () => {
    // Optional post-render logic
  }
}
```

Feel free to modify these examples or create new ones to explore the capabilities of Declarative DOM!