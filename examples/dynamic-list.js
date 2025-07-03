// New Reactivity Model - Dynamic List Example
// No more $-prefixed properties! Uses transparent signal proxies and template literals.

export default {
  $items: {
    LocalStorage: {
      key: "todo-list",
      value: ["Apple", "Banana", "Cherry"],
    },
  },

  $newItemText: "",

  $addItem: function () {
    const newItem = this.$newItemText.get().trim();
    if (newItem) {
      this.$items.set([...this.$items.get(), newItem]);
      this.$newItemText.set(""); // Clear the input
    }
  },

  removeItem: function (index) {
    // Transparent signal proxy allows normal array operations
    const items = [...this.$items.get()];
    if (index < 0 || index >= items.length) {
      console.error("Index out of bounds:", index);
      return;
    }
    const updatedItems = items.filter((_, i) => i !== index);
    this.$items.set(updatedItems);
  },

  updateItem: function (index, newText) {
    if (newText && newText.trim()) {
      const updatedItems = [...this.$items.get()];
      updatedItems[index] = newText.trim();
      this.$items.set(updatedItems);
    }
  },

  document: {
    body: {
      style: {
        fontFamily: "Arial, sans-serif",
        padding: "2em",
        backgroundColor: "#f5f5f5",
        margin: "0",
      },
      children: [
        {
          tagName: "h1",
          textContent: "Dynamic List - DDOM Reactivity Model",
          style: {
            color: "#333",
            textAlign: "center",
            marginBottom: "0.5em",
          },
        },
        {
          tagName: "p",
          textContent:
            "$-prefixed reactive properties! Template literals with \\${.} get automatic reactivity.",
          style: {
            textAlign: "center",
            color: "#666",
            marginBottom: "2em",
            fontStyle: "italic",
          },
        },
        {
          tagName: "div",
          style: {
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "white",
            padding: "2em",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          },
          children: [
            {
              tagName: "div",
              style: {
                display: "flex",
                gap: "0.5em",
                marginBottom: "1.5em",
              },
              children: [
                {
                  tagName: "input",
                  attributes: {
                    type: "text",
                    placeholder: "Add a new item...",
                  },
                  value: "${this.$newItemText.get()}",
                  style: {
                    flex: "1",
                    padding: "0.75em",
                    border: "2px solid #dee2e6",
                    borderRadius: "4px",
                    fontSize: "1em",
                    outline: "none",
                    ":focus": {
                      borderColor: "#007bff",
                      boxShadow: "0 0 0 3px rgba(0, 123, 255, 0.25)",
                    },
                  },
                  oninput: function (event) {
                    this.$newItemText.set(event.target.value);
                  },
                  onkeydown: function (event) {
                    if (event.key === "Enter") {
                      this.$addItem();
                    }
                  },
                },
                {
                  tagName: "button",
                  textContent: "Add",
                  style: {
                    padding: "0.75em 1.5em",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "1em",
                    fontWeight: "500",
                    transition: "background-color 0.2s",
                    ":hover": {
                      backgroundColor: "#218838",
                    },
                    ":disabled": {
                      backgroundColor: "#6c757d",
                      cursor: "not-allowed",
                    },
                  },
                  attributes: {
                    disabled: function () {
                      return !this.$newItemText.get().trim();
                    },
                  },
                  onclick: function () {
                    this.$addItem();
                  },
                },
              ],
            },
            {
              tagName: "div",
              style: {
                marginBottom: "1em",
                padding: "0.5em",
                backgroundColor: "#e9ecef",
                borderRadius: "4px",
                fontSize: "0.9em",
                color: "#6c757d",
              },
              children: [
                {
                  tagName: "strong",
                  textContent: "Tips: ",
                },
                {
                  tagName: "span",
                  textContent:
                    "Type and press Enter to add items. Click items to edit them inline. All changes are automatically saved to localStorage.",
                },
              ],
            },
            {
              tagName: "dynamic-list-items",
            },
          ],
        },
      ],
    },
  },

  customElements: [
    {
      tagName: "dynamic-list-items",

      children: {
        // Use string address for signal resolution
        items: "window.$items",
        map: {
          tagName: "dynamic-list-item",
          // These are also transparent signal proxies now
          $item: (item, _) => item,
          $index: (_, index) => index,
        },
      },
      style: {
        display: "block",
        padding: "0",
        margin: "1em 0",
      },
    },

    {
      tagName: "dynamic-list-item",
      $item: "",
      $index: 0,

      children: [
        {
          tagName: "li",
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.75em",
            margin: "0.5em 0",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            border: "1px solid #dee2e6",
            listStyle: "none",
          },
          children: [
            {
              tagName: "span",
              // Template literal automatically gets computed signal + effect!
              textContent: "${this.$item.get()}",
              contentEditable: true,
              style: {
                flex: "1",
                padding: "0.25em",
                borderRadius: "2px",
                outline: "none",
                ":focus": {
                  outline: "2px solid #007bff",
                  backgroundColor: "#fff",
                },
              },
              onblur: function (_event) {
                const newText = this.textContent.trim();
                const index = this.$index.get();
                const originalItem = this.$item.get();

                if (newText && newText !== originalItem) {
                  window.updateItem(index, newText);
                }
              },
              onkeydown: function (event) {
                if (event.key === "Enter") {
                  event.preventDefault();
                  this.blur(); // Trigger onblur to save
                }
                if (event.key === "Escape") {
                  // Reset to original value
                  this.textContent = this.$item.get();
                  this.blur();
                }
              },
            },
            {
              tagName: "button",
              textContent: "Remove",
              style: {
                padding: "0.25em 0.5em",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "0.875em",
              },
              onclick: function (_event) {
                const index = this.$index.get();
                const item = this.$item.get();
                if (confirm(`Are you sure you want to remove "${item}"?`)) {
                  window.removeItem(index);
                }
              },
            },
          ],
        },
      ],
    },
  ],
};
