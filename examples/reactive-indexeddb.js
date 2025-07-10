/**
 * Reactive IndexedDB Example
 * Demonstrates declarative database queries that update automatically when search terms change.
 * Similar to the Request namespace pattern but for local database operations.
 *
 * Key Features:
 * - Reactive search queries (like Request namespace)
 * - Auto-updating results when search terms change
 * - Debounced queries to prevent excessive database operations
 * - Client-side filtering and sorting
 * - Real-time UI updates when data changes
 */

export default {
  // Search and filter state
  $searchQuery: "",
  $categoryFilter: "all",
  $sortOrder: "name",
  $minRating: 0,

  // Database setup - SETUP MODE (no operation/filter/query) → returns IDBObjectStore
  $allProducts: {
    prototype: 'IndexedDB',
    database: "ProductCatalogDB",
    store: "products",
    version: 1,
    keyPath: "id",
    autoIncrement: true,
    indexes: [
      { name: "by-category", keyPath: "category", unique: false },
      { name: "by-name", keyPath: "name", unique: false },
      { name: "by-rating", keyPath: "rating", unique: false },
      { name: "by-price", keyPath: "price", unique: false },
    ],
    value: [
      { name: 'Laptop Pro', category: 'electronics', price: 1299, rating: 4.5, description: 'High-performance laptop for professionals' },
      { name: 'Wireless Headphones', category: 'electronics', price: 199, rating: 4.2, description: 'Premium noise-canceling headphones' },
      { name: 'Coffee Maker', category: 'kitchen', price: 89, rating: 4.0, description: 'Automatic drip coffee maker' },
      { name: 'Running Shoes', category: 'sports', price: 129, rating: 4.7, description: 'Lightweight running shoes for athletes' },
      { name: 'Smartphone', category: 'electronics', price: 799, rating: 4.3, description: 'Latest smartphone with advanced features' },
      { name: 'Yoga Mat', category: 'sports', price: 39, rating: 4.1, description: 'Non-slip yoga mat for home workouts' },
      { name: 'Stand Mixer', category: 'kitchen', price: 249, rating: 4.8, description: 'Professional-grade stand mixer' },
      { name: 'Gaming Monitor', category: 'electronics', price: 349, rating: 4.4, description: '27-inch gaming monitor with high refresh rate' }
    ]
  },

  // Reactive search query - QUERY MODE using IDBRequest namespace
  $searchResults: {
    prototype: 'IDBRequest',
    objectStore: "this.$allProducts",
    operation: "getAll",
    debounce: 300, // Wait 300ms after last change (just like Request namespace)
    filter: [
      {
        leftOperand: 'item.name.toLowerCase() + " " + item.description.toLowerCase()',
        operator: "includes",
        rightOperand: 'window.$searchQuery.get().toLowerCase()'
      },
      {
        leftOperand: 'window.$categoryFilter.get() === "all" ? true : item.category === window.$categoryFilter.get()',
        operator: "===", 
        rightOperand: true
      },
      {
        leftOperand: "item.rating",
        operator: ">=",
        rightOperand: 'window.$minRating.get()'
      }
    ]
  },

  // Reactive category search using index
  $categoryProducts: {
    prototype: 'IDBRequest',
    objectStore: "this.$allProducts",
    operation: "getAll",
    index: "by-category",
    query: function () {
      const category = window.$categoryFilter.get();
      return category === "all" ? undefined : IDBKeyRange.only(category);
    },
  },

  // High-rated products (rating >= 4.5)
  $topRatedProducts: {
    prototype: 'IDBRequest',
    objectStore: "this.$allProducts",
    operation: "getAll",
    index: "by-rating",
    query: IDBKeyRange.lowerBound(4.5),
    manual: false, // Auto-update when database changes
  },

  // Product count by category
  $productStats: {
    items: "this.$searchResults",
    map: function (results) {
      const stats = {};
      results.forEach((product) => {
        stats[product.category] = (stats[product.category] || 0) + 1;
      });
      return Object.entries(stats).map(([category, count]) => ({
        category,
        count,
      }));
    },
  },

  // Methods
  addRandomProduct: async function () {
    const categories = [
      "electronics",
      "kitchen",
      "sports",
      "books",
      "clothing",
    ];
    const adjectives = [
      "Premium",
      "Deluxe",
      "Professional",
      "Advanced",
      "Smart",
      "Eco-Friendly",
    ];
    const nouns = [
      "Gadget",
      "Tool",
      "Device",
      "Equipment",
      "Accessory",
      "System",
    ];

    const randomProduct = {
      name: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
        nouns[Math.floor(Math.random() * nouns.length)]
      }`,
      category: categories[Math.floor(Math.random() * categories.length)],
      price: Math.floor(Math.random() * 500) + 50,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0 to 5.0
      description: "A fantastic product that will exceed your expectations",
    };        // Use IDBObjectStore directly
        const store = this.$allProducts.get();
        await new Promise((resolve, reject) => {
          const request = store.add(randomProduct);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      },

      clearAllProducts: async function () {
        if (confirm("Clear all products from database?")) {
          // Use IDBObjectStore directly
          const store = this.$allProducts.get();
          await new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }
  },

  document: {
    title: "Reactive IndexedDB Demo - DDOM",
    body: {
      style: {
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "2rem",
        backgroundColor: "#f8f9fa",
        margin: 0,
        color: "#212529",
        lineHeight: 1.6,
      },
      children: [
        {
          tagName: "header",
          style: {
            textAlign: "center",
            marginBottom: "2rem",
          },
          children: [
            {
              tagName: "h1",
              textContent: "🗄️ Reactive IndexedDB Demo",
              style: {
                color: "#495057",
                marginBottom: "0.5rem",
              },
            },
            {
              tagName: "p",
              textContent:
                "Declarative database queries that update automatically - just like Request namespace!",
              style: {
                color: "#6c757d",
                fontSize: "1.1rem",
                margin: 0,
              },
            },
          ],
        },

        // Controls
        {
          tagName: "section",
          style: {
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            marginBottom: "2rem",
          },
          children: [
            {
              tagName: "h2",
              textContent: "🔍 Search & Filter",
              style: {
                marginTop: 0,
                marginBottom: "1.5rem",
                color: "#495057",
              },
            },
            {
              tagName: "div",
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "1rem",
                marginBottom: "1rem",
              },
              children: [
                {
                  tagName: "input",
                  attributes: {
                    type: "text",
                    placeholder: "Search products...",
                  },
                  value: "${this.$searchQuery.get()}",
                  style: {
                    padding: "0.75rem",
                    border: "2px solid #dee2e6",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.2s",
                    ":focus": {
                      borderColor: "#6f42c1",
                      boxShadow: "0 0 0 3px rgba(111, 66, 193, 0.25)",
                    },
                  },
                  oninput: function (event) {
                    this.$searchQuery.set(event.target.value);
                  },
                },
                {
                  tagName: "select",
                  value: "${this.$categoryFilter.get()}",
                  style: {
                    padding: "0.75rem",
                    border: "2px solid #dee2e6",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                    backgroundColor: "white",
                    cursor: "pointer",
                  },
                  onchange: function (event) {
                    this.$categoryFilter.set(event.target.value);
                  },
                  children: [
                    {
                      tagName: "option",
                      value: "all",
                      textContent: "All Categories",
                    },
                    {
                      tagName: "option",
                      value: "electronics",
                      textContent: "Electronics",
                    },
                    {
                      tagName: "option",
                      value: "kitchen",
                      textContent: "Kitchen",
                    },
                    {
                      tagName: "option",
                      value: "sports",
                      textContent: "Sports",
                    },
                    { tagName: "option", value: "books", textContent: "Books" },
                    {
                      tagName: "option",
                      value: "clothing",
                      textContent: "Clothing",
                    },
                  ],
                },
                {
                  tagName: "input",
                  attributes: {
                    type: "range",
                    min: "0",
                    max: "5",
                    step: "0.1",
                  },
                  value: "${this.$minRating.get()}",
                  style: {
                    padding: "0.75rem",
                  },
                  oninput: function (event) {
                    this.$minRating.set(parseFloat(event.target.value));
                  },
                },
                {
                  tagName: "div",
                  textContent:
                    "Min Rating: ${this.$minRating.get().toFixed(1)} ⭐",
                  style: {
                    padding: "0.75rem",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "0.375rem",
                    border: "2px solid #dee2e6",
                    textAlign: "center",
                    fontWeight: "500",
                  },
                },
              ],
            },
            {
              tagName: "div",
              style: {
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
              },
              children: [
                {
                  tagName: "button",
                  textContent: "+ Add Random Product",
                  style: {
                    padding: "0.75rem 1rem",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  },
                  onclick: function () {
                    window.addRandomProduct();
                  },
                },
                {
                  tagName: "button",
                  textContent: "🗑️ Clear All",
                  style: {
                    padding: "0.75rem 1rem",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  },
                  onclick: function () {
                    window.clearAllProducts();
                  },
                },
              ],
            },
          ],
        },

        // Results Stats
        {
          tagName: "div",
          style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          },
          children: [
            {
              tagName: "div",
              style: {
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center",
              },
              children: [
                {
                  tagName: "div",
                  textContent: "${this.$searchResults.get().length}",
                  style: {
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#6f42c1",
                    marginBottom: "0.5rem",
                  },
                },
                {
                  tagName: "div",
                  textContent: "Search Results",
                  style: {
                    fontSize: "0.9rem",
                    color: "#6c757d",
                  },
                },
              ],
            },
            {
              tagName: "div",
              style: {
                backgroundColor: "white",
                padding: "1.5rem",
                borderRadius: "0.5rem",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "center",
              },
              children: [
                {
                  tagName: "div",
                  textContent: "${this.$topRatedProducts.get().length}",
                  style: {
                    fontSize: "2rem",
                    fontWeight: "bold",
                    color: "#28a745",
                    marginBottom: "0.5rem",
                  },
                },
                {
                  tagName: "div",
                  textContent: "Top Rated (4.5+)",
                  style: {
                    fontSize: "0.9rem",
                    color: "#6c757d",
                  },
                },
              ],
            },
          ],
        },

        // Search Results
        {
          tagName: "section",
          style: {
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "0.5rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          },
          children: [
            {
              tagName: "h2",
              textContent:
                "📦 Products (${this.$searchResults.get().length} found)",
              style: {
                marginTop: 0,
                marginBottom: "1.5rem",
                color: "#495057",
              },
            },
            {
              tagName: "div",
              style: {
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "1rem",
              },
              children: {
                items: "this.$searchResults",
                map: {
                  tagName: "product-card",
                  $product: (product, _) => product,
                },
              },
            },
          ],
        },
      ],
    },
  },

  customElements: [
    {
      tagName: "product-card",
      $product: {},

      children: [
        {
          tagName: "div",
          style: {
            padding: "1.5rem",
            border: "2px solid #e9ecef",
            borderRadius: "0.5rem",
            backgroundColor: "#f8f9fa",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          },
          children: [
            {
              tagName: "div",
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                marginBottom: "0.75rem",
              },
              children: [
                {
                  tagName: "h3",
                  textContent: "${this.$product.get().name}",
                  style: {
                    margin: 0,
                    fontSize: "1.1rem",
                    color: "#495057",
                    flex: "1",
                  },
                },
                {
                  tagName: "span",
                  textContent: "$${this.$product.get().price}",
                  style: {
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    color: "#28a745",
                  },
                },
              ],
            },
            {
              tagName: "div",
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.75rem",
              },
              children: [
                {
                  tagName: "span",
                  textContent: "${this.$product.get().category}",
                  style: {
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#6f42c1",
                    color: "white",
                    borderRadius: "0.25rem",
                    fontSize: "0.8rem",
                    textTransform: "capitalize",
                  },
                },
                {
                  tagName: "span",
                  textContent: "⭐ ${this.$product.get().rating}",
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "500",
                    color: "#ffc107",
                  },
                },
              ],
            },
            {
              tagName: "p",
              textContent: "${this.$product.get().description}",
              style: {
                margin: 0,
                fontSize: "0.9rem",
                color: "#6c757d",
                lineHeight: "1.4",
                flex: "1",
              },
            },
          ],
        },
      ],
    },
  ],
};
