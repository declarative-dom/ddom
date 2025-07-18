// filepath: /home/batonac/Development/declarative-dom/examples/live-search-demo.js
/**
 * Live Search Demo - Comprehensive DDOM Example
 * 
 * This demo combines:
 * - Declarative fetch from JSONPlaceholder API
 * - Interactive form with validation
 * - Dynamic list with real-time filtering
 * - Debounced search with loading states
 */

export default {
  // Reactive state for search functionality
  $searchTerm: '',
  $isLoading: false,
  $selectedUserId: '',
  $showAdvancedOptions: false,
  $resultsPerPage: 10,
  $currentPage: 1,

  // Fetch all posts from JSONPlaceholder
  $allPosts: {
    prototype: 'Request',
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'GET',
    delay: 300 // Debounce rapid requests
  },

  // Fetch users for filter dropdown
  $allUsers: {
    prototype: 'Request',
    url: 'https://jsonplaceholder.typicode.com/users',
    method: 'GET'
  },

  // Computed: Filter posts based on search criteria
  $filteredPosts: function() {
    const posts = this.$allPosts.get() || [];
    const searchTerm = this.$searchTerm.get().toLowerCase().trim();
    const selectedUserId = this.$selectedUserId.get();
    
    if (!Array.isArray(posts)) return [];
    
    return posts.filter(post => {
      // Text search in title and body
      const matchesSearch = !searchTerm || 
        post.title.toLowerCase().includes(searchTerm) ||
        post.body.toLowerCase().includes(searchTerm);
      
      // User filter
      const matchesUser = !selectedUserId || 
        post.userId.toString() === selectedUserId;
      
      return matchesSearch && matchesUser;
    });
  },

  // Computed: Paginated results
  $paginatedPosts: function() {
    const filtered = this.$filteredPosts();
    const perPage = this.$resultsPerPage.get();
    const currentPage = this.$currentPage.get();
    
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    return filtered.slice(startIndex, endIndex);
  },

  // Computed: Total pages for pagination
  $totalPages: function() {
    const filtered = this.$filteredPosts();
    const perPage = this.$resultsPerPage.get();
    return Math.ceil(filtered.length / perPage);
  },

  // Computed: Search statistics
  $searchStats: function() {
    const total = this.$allPosts.get()?.length || 0;
    const filtered = this.$filteredPosts().length;
    const searchTerm = this.$searchTerm.get();
    
    if (!searchTerm.trim()) {
      return `Showing all ${total} posts`;
    }
    
    return `Found ${filtered} of ${total} posts matching "${searchTerm}"`;
  },

  // Methods for pagination
  $goToPage: function(page) {
    const totalPages = this.$totalPages();
    if (page >= 1 && page <= totalPages) {
      this.$currentPage.set(page);
    }
  },

  $nextPage: function() {
    this.$goToPage(this.$currentPage.get() + 1);
  },

  $prevPage: function() {
    this.$goToPage(this.$currentPage.get() - 1);
  },

  // Reset search and filters
  $resetSearch: function() {
    this.$searchTerm.set('');
    this.$selectedUserId.set('');
    this.$currentPage.set(1);
    this.$showAdvancedOptions.set(false);
  },

  // Toggle advanced options
  $toggleAdvanced: function() {
    this.$showAdvancedOptions.set(!this.$showAdvancedOptions.get());
  },

  document: {
    head: {
      title: 'Live Search Demo - DDOM',
      children: [
        {
          tagName: 'meta',
          attributes: {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1.0'
          }
        }
      ]
    },
    body: {
      style: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        margin: 0,
        padding: '1rem',
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        color: '#1e293b'
      },
      children: [
        // Header
        {
          tagName: 'header',
          style: {
            textAlign: 'center',
            marginBottom: '2rem',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          },
          children: [
            {
              tagName: 'h1',
              textContent: '🔍 Live Search Demo',
              style: {
                margin: '0 0 0.5rem 0',
                color: '#0f172a',
                fontSize: '2.5rem',
                fontWeight: '700'
              }
            },
            {
              tagName: 'p',
              textContent: 'Real-time search with declarative fetch, interactive forms, and dynamic filtering',
              style: {
                margin: 0,
                color: '#64748b',
                fontSize: '1.1rem'
              }
            }
          ]
        },

        // Search Form Component
        {
          tagName: 'search-form'
        },

        // Statistics and Controls
        {
          tagName: 'search-stats'
        },

        // Results List Component
        {
          tagName: 'search-results'
        },

        // Pagination Component
        {
          tagName: 'search-pagination'
        }
      ]
    }
  },

  customElements: [
    // Search Form Component
    {
      tagName: 'search-form',
      style: {
        display: 'block',
        maxWidth: '800px',
        margin: '0 auto 2rem auto',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      },
      children: [
        {
          tagName: 'div',
          style: {
            marginBottom: '1rem'
          },
          children: [
            {
              tagName: 'label',
              textContent: 'Search Posts',
              style: {
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#374151'
              }
            },
            {
              tagName: 'div',
              style: {
                position: 'relative',
                display: 'flex',
                gap: '0.5rem'
              },
              children: [
                {
                  tagName: 'input',
                  attributes: {
                    type: 'text',
                    placeholder: 'Type to search post titles and content...'
                  },
                  value: '${window.$searchTerm}',
                  style: {
                    flex: '1',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    ':focus': {
                      borderColor: '#3b82f6',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }
                  },
                  oninput: function(event) {
                    window.$searchTerm.set(event.target.value);
                    window.$currentPage.set(1); // Reset to first page on new search
                  }
                },
                {
                  tagName: 'button',
                  textContent: '⚙️',
                  attributes: {
                    'data-advanced': '${window.$showAdvancedOptions}'
                  },
                  style: {
                    padding: '0.75rem',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'all 0.2s',
                    '[data-advanced="true"]': {
                      backgroundColor: '#3b82f6'
                    },
                    ':hover': {
                      backgroundColor: '#4b5563'
                    },
                    '[data-advanced="true"]:hover': {
                      backgroundColor: '#2563eb'
                    }
                  },
                  onclick: function() {
                    window.$toggleAdvanced();
                  }
                },
                {
                  tagName: 'button',
                  textContent: '🗑️',
                  style: {
                    padding: '0.75rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'background-color 0.2s',
                    ':hover': {
                      backgroundColor: '#dc2626'
                    }
                  },
                  onclick: function() {
                    window.$resetSearch();
                  }
                }
              ]
            }
          ]
        },

        // Advanced Options (conditionally shown)
        {
          tagName: 'div',
          attributes: {
            'data-show-advanced': '${window.$showAdvancedOptions}'
          },
          style: {
            display: 'none',
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            '[data-show-advanced="true"]': {
              display: 'block'
            }
          },
		  $authorOptions: function() {
			const users = window.$allUsers.get() || [];
			return [{ id: '', name: 'All Authors' }, ...users];
		  },
          children: [
            {
              tagName: 'div',
              style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              },
              children: [
                // User Filter
                {
                  tagName: 'div',
                  children: [
                    {
                      tagName: 'label',
                      textContent: 'Filter by Author',
                      style: {
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }
                    },
                    {
                      tagName: 'select',
                      value: '${window.$selectedUserId}',
                      style: {
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'white'
                      },
                      onchange: function(event) {
                        window.$selectedUserId.set(event.target.value);
                        window.$currentPage.set(1);
                      },
                      children: {
                        prototype: 'Array',
                        items: 'this.$authorOptions',
                        map: {
                          tagName: 'option',
                          value: 'item.id',
                          textContent: 'item.name'
                        }
                      }
                    }
                  ]
                },

                // Results per page
                {
                  tagName: 'div',
                  children: [
                    {
                      tagName: 'label',
                      textContent: 'Results per page',
                      style: {
                        display: 'block',
                        marginBottom: '0.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }
                    },
                    {
                      tagName: 'select',
                      value: '${window.$resultsPerPage}',
                      style: {
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        backgroundColor: 'white'
                      },
                      onchange: function(event) {
                        window.$resultsPerPage.set(parseInt(event.target.value));
                        window.$currentPage.set(1);
                      },
                      children: [
                        { tagName: 'option', value: '5', textContent: '5' },
                        { tagName: 'option', value: '10', textContent: '10' },
                        { tagName: 'option', value: '20', textContent: '20' },
                        { tagName: 'option', value: '50', textContent: '50' }
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

    // Search Statistics Component
    {
      tagName: 'search-stats',
      style: {
        display: 'block',
        maxWidth: '800px',
        margin: '0 auto 1rem auto',
        padding: '1rem',
        backgroundColor: '#dbeafe',
        borderRadius: '0.5rem',
        textAlign: 'center',
        color: '#1e40af',
        fontWeight: '500'
      },
      children: [
        {
          tagName: 'span',
          textContent: '${window.$searchStats()}'
        }
      ]
    },

    // Search Results Component  
    {
      tagName: 'search-results',
      style: {
        display: 'block',
        maxWidth: '800px',
        margin: '0 auto 2rem auto'
      },
      children: {
        prototype: 'Array',
        items: 'window.$paginatedPosts',
        map: {
          tagName: 'post-card',
          $post: 'item'
        }
      }
    },

    // Individual Post Card Component
    {
      tagName: 'post-card',
      $post: {},
      style: {
        display: 'block',
        marginBottom: '1rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
        transition: 'all 0.2s',
        ':hover': {
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          transform: 'translateY(-1px)'
        }
      },
	  author: function() {
		const users = window.$allUsers.get() || [];
		const userID = this.$post.get().userId;
		const user = users.find(u => u.id === userID);
		return user ? user : null;
	  },
	  $authorText: function() {
		const author = this.author();
		return author? `By ${author.name}` : `Author ID: ${this.$post.userId}`;
	  },
	  $authorEmail: function() {
		const author = this.author();
		return author?.email || '';
	  },
      children: [
        {
          tagName: 'div',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            marginBottom: '0.75rem'
          },
          children: [
            {
              tagName: 'h3',
              textContent: '${this.$post.title}',
              style: {
                margin: 0,
                color: '#0f172a',
                fontSize: '1.25rem',
                fontWeight: '600',
                lineHeight: '1.4'
              }
            },
            {
              tagName: 'span',
              textContent: '#${this.$post.id}',
              style: {
                fontSize: '0.75rem',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '0.25rem 0.5rem',
                borderRadius: '0.25rem',
                fontWeight: '500'
              }
            }
          ]
        },
        {
          tagName: 'p',
          textContent: '${this.$post.body}',
          style: {
            margin: '0 0 1rem 0',
            color: '#4b5563',
            lineHeight: '1.6'
          }
        },
        {
          tagName: 'div',
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: '#6b7280'
          },
          children: [
            {
              tagName: 'span',
              textContent: '${this.$authorText()}',
              style: {
                fontWeight: '500'
              }
            },
            {
              tagName: 'span',
              textContent: '${this.$authorEmail()}',
              style: {
                color: '#3b82f6'
              }
            }
          ]
        }
      ]
    },

    // Pagination Component
    {
      tagName: 'search-pagination',
      attributes: {
        'data-has-pages': function() {
          return window.$totalPages() > 1;
        }
      },
      style: {
        display: 'none',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '1rem',
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        textAlign: 'center',
        '[data-has-pages]': {
          display: 'block'
        }
      },
      children: [
        {
          tagName: 'div',
          style: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          },
          children: [
            {
              tagName: 'button',
              textContent: '← Previous',
              attributes: {
                'data-can-prev': function() {
                  return window.$currentPage.get() > 1;
                },
                disabled: function() {
                  return window.$currentPage.get() <= 1;
                }
              },
              style: {
                padding: '0.5rem 1rem',
                backgroundColor: '#d1d5db',
                color: '#6b7280',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'not-allowed',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                '[data-can-prev]': {
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer'
                },
                '[data-can-prev]:hover': {
                  backgroundColor: '#2563eb'
                }
              },
              onclick: function() {
                window.$prevPage();
              }
            },
            {
              tagName: 'span',
              textContent: 'Page ${window.$currentPage} of ${window.$totalPages()}',
              style: {
                padding: '0.5rem 1rem',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: '500'
              }
            },
            {
              tagName: 'button',
              textContent: 'Next →',
              attributes: {
                'data-can-next': function() {
                  return window.$currentPage.get() < window.$totalPages();
                },
                disabled: function() {
                  return window.$currentPage.get() >= window.$totalPages();
                }
              },
              style: {
                padding: '0.5rem 1rem',
                backgroundColor: '#d1d5db',
                color: '#6b7280',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'not-allowed',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s',
                '[data-can-next]': {
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer'
                },
                '[data-can-next]:hover': {
                  backgroundColor: '#2563eb'
                }
              },
              onclick: function() {
                window.$nextPage();
              }
            }
          ]
        }
      ]
    }
  ]
};