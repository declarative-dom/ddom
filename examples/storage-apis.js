/**
 * Storage APIs Example
 * Demonstrates the use of Cookie, SessionStorage, LocalStorage, and IndexedDB namespaces
 * with automatic serialization for objects and arrays
 * 
 * IndexedDB Design Pattern:
 * - IndexedDB returns an actual IDBObjectStore instead of a signal (no anti-patterns)
 * - Manual reactivity is used - you update your reactive state when database operations complete
 * - This follows proper database patterns where the database is the source of truth
 * - Use signals for UI state, use IndexedDB for persistent data storage
 */

export default {
  // Document input state
  $newDocTitle: "",
  $newDocContent: "",
  
  // Documents array for reactive display (manual reactivity pattern)
  $documents: [],

  // Methods for document management
  addDocument: async function() {
    const title = this.$newDocTitle.get().trim();
    const content = this.$newDocContent.get().trim();
    
    if (title && content) {
      const newDoc = {
        title: title,
        content: content,
        created: new Date().toISOString()
      };
      
      try {
        // Use the IDBObjectStore directly for database operations
        const store = this.$appDataStore.getStore();
        const id = await new Promise((resolve, reject) => {
          const request = store.add(newDoc);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        
        // Manual reactivity: update the documents array
        const currentDocs = this.$documents.get();
        this.$documents.set([...currentDocs, { ...newDoc, id }]);
        
        // Clear inputs
        this.$newDocTitle.set("");
        this.$newDocContent.set("");
      } catch (error) {
        console.error('Failed to add document:', error);
      }
    }
  },

  removeDocument: async function(docId) {
    try {
      // Use the IDBObjectStore directly for database operations
      const store = this.$appDataStore.getStore();
      await new Promise((resolve, reject) => {
        const request = store.delete(docId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      // Manual reactivity: update the documents array
      const currentDocs = this.$documents.get();
      this.$documents.set(currentDocs.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Failed to remove document:', error);
    }
  },

  // Load all documents from database (called on init)
  loadDocuments: async function() {
    try {
      const store = this.$appDataStore.getStore('readonly');
      const docs = await new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      this.$documents.set(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      this.$documents.set([]);
    }
  },

  // Cookie for session authentication/security data
  $authCookie: {
    Cookie: {
      name: 'sessionAuth',
      value: {
        sessionId: 'abc123def456',
        expires: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        csrfToken: 'xyz789'
      },
      maxAge: 3600, // 1 hour
      secure: true,
      sameSite: 'strict'
    }
  },
  
  // SessionStorage for temporary UI state (lost on tab close)
  $uiState: {
    SessionStorage: {
      key: 'currentUIState',
      value: {
        selectedTab: 'storage',
        sidebarOpen: true,
        lastAction: 'page_loaded',
        actionCount: 0
      }
    }
  },
  
  // LocalStorage for persistent user preferences
  $userPreferences: {
    LocalStorage: {
      key: 'userPreferences',
      value: {
        theme: 'auto',
        language: 'en',
        notifications: true,
        autoSave: true,
        fontSize: 14
      }
    }
  },
  
  // IndexedDB for complex application data - returns actual IDBObjectStore
  $appDataStore: {
    IndexedDB: {
      database: 'AppDataDB',
      store: 'documents',
      version: 1,
      keyPath: 'id',
      autoIncrement: true,
      indexes: [
        {
          name: 'by-title',
          keyPath: 'title',
          unique: false
        },
        {
          name: 'by-created',
          keyPath: 'created',
          unique: false
        }
      ]
    }
  },

  document: {
    title: 'Storage APIs Demo - DDOM',
    body: {
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem',
        backgroundColor: '#f8f9fa',
        margin: 0,
        color: '#212529',
        lineHeight: 1.6
      },
      children: [
        {
          tagName: 'header',
          style: {
            textAlign: 'center',
            marginBottom: '2rem'
          },
          children: [
            {
              tagName: 'h1',
              textContent: '💾 Storage APIs Demo',
              style: {
                color: '#495057',
                marginBottom: '0.5rem'
              }
            },
            {
              tagName: 'p',
              textContent: 'Demonstrates Cookie, SessionStorage, LocalStorage, and IndexedDB namespaces with automatic object serialization',
              style: {
                color: '#6c757d',
                fontSize: '1.1rem',
                margin: 0
              }
            }
          ]
        },

        {
          tagName: 'main',
          style: {
            maxWidth: '1200px',
            margin: '0 auto'
          },
          children: [
            // Controls Section
            {
              tagName: 'section',
              style: {
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
              },
              children: [
                {
                  tagName: 'h2',
                  textContent: '🎛️ Storage Controls',
                  style: {
                    marginTop: 0,
                    marginBottom: '1.5rem',
                    color: '#495057'
                  }
                },
                {
                  tagName: 'div',
                  style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  },
                  children: [
                    {
                      tagName: 'button',
                      textContent: 'Toggle Theme (${this.$userPreferences.get().theme})',
                      style: {
                        padding: '0.75rem 1rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: '#0056b3'
                        }
                      },
                      onclick: function() {
                        const prefs = {...this.$userPreferences.get()};
                        const themes = ['auto', 'light', 'dark'];
                        const currentIndex = themes.indexOf(prefs.theme);
                        prefs.theme = themes[(currentIndex + 1) % themes.length];
                        this.$userPreferences.set(prefs);
                      }
                    },
                    {
                      tagName: 'button',
                      textContent: 'Action Count: ${this.$uiState.get().actionCount} (+1)',
                      style: {
                        padding: '0.75rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: '#1e7e34'
                        }
                      },
                      onclick: function() {
                        const uiState = {...this.$uiState.get()};
                        uiState.actionCount = (uiState.actionCount || 0) + 1;
                        uiState.lastAction = 'button_clicked';
                        this.$uiState.set(uiState);
                      }
                    },
                    {
                      tagName: 'button',
                      textContent: 'Toggle Sidebar (${this.$uiState.get().sidebarOpen ? "Open" : "Closed"})',
                      style: {
                        padding: '0.75rem 1rem',
                        backgroundColor: '#ffc107',
                        color: '#212529',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: '#e0a800'
                        }
                      },
                      onclick: function() {
                        const uiState = {...this.$uiState.get()};
                        uiState.sidebarOpen = !uiState.sidebarOpen;
                        uiState.lastAction = 'sidebar_toggled';
                        this.$uiState.set(uiState);
                      }
                    },
                    {
                      tagName: 'button',
                      textContent: 'Notifications: ${this.$userPreferences.get().notifications ? "ON" : "OFF"}',
                      style: {
                        padding: '0.75rem 1rem',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: '#117a8b'
                        }
                      },
                      onclick: function() {
                        const prefs = {...this.$userPreferences.get()};
                        prefs.notifications = !prefs.notifications;
                        this.$userPreferences.set(prefs);
                      }
                    },
                    {
                      tagName: 'button',
                      textContent: 'Regenerate Token',
                      style: {
                        padding: '0.75rem 1rem',
                        backgroundColor: '#6f42c1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: '#5a3a9a'
                        }
                      },
                      onclick: function() {
                        const auth = {...this.$authCookie.get()};
                        auth.csrfToken = Math.random().toString(36).substring(2, 15);
                        auth.sessionId = Math.random().toString(36).substring(2, 15);
                        this.$authCookie.set(auth);
                      }
                    },
                    {
                      tagName: 'button',
                      textContent: '🗑️ Clear All',
                      style: {
                        padding: '0.75rem 1rem',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'background-color 0.2s',
                        ':hover': {
                          backgroundColor: '#c82333'
                        }
                      },
                      onclick: function() {
                        if (confirm('Clear all storage data?')) {
                          // Reset each storage type to its default values
                          this.$userPreferences.set({
                            theme: 'auto',
                            language: 'en',
                            notifications: true,
                            autoSave: true,
                            fontSize: 14
                          });
                          this.$uiState.set({
                            selectedTab: 'storage',
                            sidebarOpen: true,
                            lastAction: 'reset',
                            actionCount: 0
                          });
                          this.$authCookie.set({
                            sessionId: 'new123session456',
                            expires: new Date(Date.now() + 3600000).toISOString(),
                            csrfToken: 'newtoken789'
                          });
                        }
                      }
                    }
                  ]
                }
              ]
            },

            // Document Management Section
            {
              tagName: 'section',
              style: {
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '0.5rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '2rem'
              },
              children: [
                {
                  tagName: 'h2',
                  textContent: '📝 Add New Document',
                  style: {
                    marginTop: 0,
                    marginBottom: '1.5rem',
                    color: '#495057'
                  }
                },
                {
                  tagName: 'div',
                  style: {
                    display: 'grid',
                    gap: '1rem',
                    marginBottom: '1rem'
                  },
                  children: [
                    {
                      tagName: 'input',
                      attributes: {
                        type: 'text',
                        placeholder: 'Document title...'
                      },
                      value: '${this.$newDocTitle.get()}',
                      style: {
                        padding: '0.75rem',
                        border: '2px solid #dee2e6',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                        ':focus': {
                          borderColor: '#6f42c1',
                          boxShadow: '0 0 0 3px rgba(111, 66, 193, 0.25)'
                        }
                      },
                      oninput: function(event) {
                        this.$newDocTitle.set(event.target.value);
                      }
                    },
                    {
                      tagName: 'textarea',
                      attributes: {
                        placeholder: 'Document content...',
                        rows: '4'
                      },
                      value: '${this.$newDocContent.get()}',
                      style: {
                        padding: '0.75rem',
                        border: '2px solid #dee2e6',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                        ':focus': {
                          borderColor: '#6f42c1',
                          boxShadow: '0 0 0 3px rgba(111, 66, 193, 0.25)'
                        }
                      },
                      oninput: function(event) {
                        this.$newDocContent.set(event.target.value);
                      }
                    }
                  ]
                },
                {
                  tagName: 'button',
                  textContent: 'Add Document',
                  style: {
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: '#5a3a9a'
                    },
                    ':disabled': {
                      backgroundColor: '#6c757d',
                      cursor: 'not-allowed'
                    }
                  },
                  attributes: {
                    disabled: function() {
                      return !this.$newDocTitle.get().trim() || !this.$newDocContent.get().trim();
                    }
                  },
                  onclick: function() {
                    window.addDocument();
                  }
                }
              ]
            },

            // Storage Display Section
            {
              tagName: 'section',
              children: [
                {
                  tagName: 'h2',
                  textContent: '📊 Current Storage Values',
                  style: {
                    marginBottom: '1.5rem',
                    color: '#495057'
                  }
                },
                {
                  tagName: 'div',
                  style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem'
                  },
                  children: [
                    // Cookie Storage
                    {
                      tagName: 'div',
                      style: {
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #dee2e6'
                      },
                      children: [
                        {
                          tagName: 'h3',
                          textContent: '🍪 Session Cookie',
                          style: {
                            marginTop: 0,
                            marginBottom: '1rem',
                            color: '#fd7e14',
                            fontSize: '1.1rem'
                          }
                        },
                        {
                          tagName: 'p',
                          textContent: 'Session authentication & security data',
                          style: {
                            fontSize: '0.9rem',
                            color: '#6c757d',
                            marginBottom: '1rem'
                          }
                        },
                        {
                          tagName: 'pre',
                          textContent: '${JSON.stringify(this.$authCookie.get(), null, 2)}',
                          style: {
                            backgroundColor: '#f8f9fa',
                            padding: '1rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.85rem',
                            overflow: 'auto',
                            margin: 0,
                            border: '1px solid #e9ecef'
                          }
                        }
                      ]
                    },

                    // Session Storage
                    {
                      tagName: 'div',
                      style: {
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #dee2e6'
                      },
                      children: [
                        {
                          tagName: 'h3',
                          textContent: '⏱️ Session Storage',
                          style: {
                            marginTop: 0,
                            marginBottom: '1rem',
                            color: '#28a745',
                            fontSize: '1.1rem'
                          }
                        },
                        {
                          tagName: 'p',
                          textContent: 'Temporary UI state (lost on tab close)',
                          style: {
                            fontSize: '0.9rem',
                            color: '#6c757d',
                            marginBottom: '1rem'
                          }
                        },
                        {
                          tagName: 'pre',
                          textContent: '${JSON.stringify(this.$uiState.get(), null, 2)}',
                          style: {
                            backgroundColor: '#f8f9fa',
                            padding: '1rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.85rem',
                            overflow: 'auto',
                            margin: 0,
                            border: '1px solid #e9ecef'
                          }
                        }
                      ]
                    },

                    // Local Storage
                    {
                      tagName: 'div',
                      style: {
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #dee2e6'
                      },
                      children: [
                        {
                          tagName: 'h3',
                          textContent: '💾 Local Storage',
                          style: {
                            marginTop: 0,
                            marginBottom: '1rem',
                            color: '#007bff',
                            fontSize: '1.1rem'
                          }
                        },
                        {
                          tagName: 'p',
                          textContent: 'Persistent user preferences',
                          style: {
                            fontSize: '0.9rem',
                            color: '#6c757d',
                            marginBottom: '1rem'
                          }
                        },
                        {
                          tagName: 'pre',
                          textContent: '${JSON.stringify(this.$userPreferences.get(), null, 2)}',
                          style: {
                            backgroundColor: '#f8f9fa',
                            padding: '1rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.85rem',
                            overflow: 'auto',
                            margin: 0,
                            border: '1px solid #e9ecef'
                          }
                        }
                      ]
                    },

                    // IndexedDB
                    {
                      tagName: 'div',
                      style: {
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '0.5rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: '1px solid #dee2e6'
                      },
                      children: [
                        {
                          tagName: 'h3',
                          textContent: '🗄️ IndexedDB',
                          style: {
                            marginTop: 0,
                            marginBottom: '1rem',
                            color: '#6f42c1',
                            fontSize: '1.1rem'
                          }
                        },
                        {
                          tagName: 'p',
                          textContent: 'Document database with full CRUD operations',
                          style: {
                            fontSize: '0.9rem',
                            color: '#6c757d',
                            marginBottom: '1rem'
                          }
                        },
                        {
                          tagName: 'div',
                          style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem'
                          },
                          children: [                        {
                          tagName: 'span',
                          textContent: 'Documents stored: ${this.$documents.get()?.length || 0}',
                          style: {
                            fontSize: '0.9rem',
                            color: '#495057',
                            fontWeight: '500'
                          }
                        },
                        {
                          tagName: 'button',
                          textContent: 'Clear All',
                          style: {
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          },
                          onclick: async function() {
                            if (confirm('Clear all documents?')) {
                              try {
                                const store = this.$appDataStore.getStore();
                                await new Promise((resolve, reject) => {
                                  const request = store.clear();
                                  request.onsuccess = () => resolve(request.result);
                                  request.onerror = () => reject(request.error);
                                });
                                this.$documents.set([]);
                              } catch (error) {
                                console.error('Failed to clear documents:', error);
                              }
                            }
                          }
                        }
                          ]
                        },
                        {
                          tagName: 'div',
                          style: {
                            maxHeight: '200px',
                            overflowY: 'auto',
                            border: '1px solid #e9ecef',
                            borderRadius: '0.25rem',
                            backgroundColor: '#f8f9fa'
                          },
                          children: [
                            {
                              tagName: 'document-list'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },

        // Footer
        {
          tagName: 'footer',
          style: {
            textAlign: 'center',
            marginTop: '3rem',
            padding: '2rem',
            color: '#6c757d'
          },
          children: [
            {
              tagName: 'p',
              textContent: 'Declarative DOM Storage APIs - Objects and arrays are automatically serialized/deserialized',
              style: {
                margin: 0,
                fontSize: '0.9rem'
              }
            }
          ]
        }
      ]
    }
  },

  customElements: [
    {
      tagName: 'document-list',
      children: {
        items: 'window.$documents',
        map: {
          tagName: 'document-item',
          $doc: (doc, _) => doc,
        }
      }
    },

    {
      tagName: 'document-item',
      $doc: {},

      children: [
        {
          tagName: 'div',
          style: {
            padding: '0.5rem',
            borderBottom: '1px solid #e9ecef',
            ':last-child': {
              borderBottom: 'none'
            }
          },
          children: [
            {
              tagName: 'div',
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                gap: '0.5rem'
              },
              children: [
                {
                  tagName: 'div',
                  style: {
                    flex: '1'
                  },
                  children: [
                    {
                      tagName: 'h4',
                      textContent: '${this.$doc.get().title}',
                      style: {
                        margin: '0 0 0.25rem 0',
                        fontSize: '0.9rem',
                        color: '#495057'
                      }
                    },
                    {
                      tagName: 'p',
                      textContent: '${this.$doc.get().content.substring(0, 100)}${this.$doc.get().content.length > 100 ? "..." : ""}',
                      style: {
                        margin: '0 0 0.25rem 0',
                        fontSize: '0.8rem',
                        color: '#6c757d'
                      }
                    },
                    {
                      tagName: 'small',
                      textContent: 'Created: ${new Date(this.$doc.get().created).toLocaleDateString()}',
                      style: {
                        fontSize: '0.75rem',
                        color: '#adb5bd'
                      }
                    }
                  ]
                },
                {
                  tagName: 'button',
                  textContent: '×',
                  style: {
                    width: '20px',
                    height: '20px',
                    padding: 0,
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ':hover': {
                      backgroundColor: '#c82333'
                    }
                  },
                  onclick: async function() {
                    const docId = this.$doc.get().id;
                    if (confirm('Delete this document?')) {
                      await window.removeDocument(docId);
                    }
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};