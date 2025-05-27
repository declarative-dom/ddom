# Declarative DOM Builder

A visual interface builder that demonstrates the Declarative DOM format by providing a WYSIWYG editor for creating web interfaces.

## Features

- **Element Palette**: Drag and drop HTML elements (headings, paragraphs, buttons, etc.)
- **Visual Canvas**: Live preview of your interface as you build it
- **Properties Panel**: Edit attributes, styles, and content for selected elements
- **Structure Tree**: Hierarchical view of your document structure
- **Export Functionality**: Download your creation as a JSON file in Declarative DOM format

## How to Use

1. **Add Elements**: Click on element types in the left panel to add them to your canvas
2. **Select Elements**: Click on elements in the canvas or structure tree to select them
3. **Edit Properties**: Use the right panel to modify text, colors, spacing, and other properties
4. **Export**: Click "Export JSON" to download your structure as a Declarative DOM file

## What This Demonstrates

This builder showcases several key aspects of Declarative DOM:

- **Reactive Rendering**: Changes to the declarative structure immediately update the visual output
- **Type Safety**: The structure maintains proper typing throughout the editing process
- **Serialization**: The entire interface can be exported as JSON for storage or transport
- **Self-Contained**: Each example is a complete, working application using only Declarative DOM

## Technical Implementation

The builder maintains a `DeclarativeWindow` object that represents the current state of the interface being built. When users interact with the builder:

1. The declarative structure is modified
2. The canvas is re-rendered using `DDOM.buildElementTree()`
3. The properties panel reflects the current selection
4. The structure tree shows the hierarchical layout

This demonstrates how Declarative DOM can be used not just for static content, but for dynamic, interactive applications where the UI structure itself is data that can be manipulated programmatically.

## Example Output

When you export from the builder, you get a JSON file like this:

```json
{
  "document": {
    "body": {
      "style": {
        "margin": "0",
        "padding": "20px",
        "fontFamily": "Arial, sans-serif",
        "backgroundColor": "#f5f5f5"
      },
      "children": [
        {
          "tagName": "h1",
          "id": "element-1234567890",
          "textContent": "My Heading",
          "style": {
            "color": "#333",
            "fontSize": "2em",
            "margin": "0.5em 0"
          }
        }
      ]
    }
  }
}
```

This JSON can then be loaded back into any Declarative DOM renderer to recreate the exact same interface.