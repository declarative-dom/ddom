// Comprehensive DDOM Request Fetch Demo
// Real-world demonstration of Request namespace functionality

export default {
  document: {
    body: {
      style: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        color: '#333'
      },
      children: [
        {
          tagName: 'div',
          className: 'container',
          style: {
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          },
          children: [
            {
              tagName: 'h1',
              textContent: 'DDOM Declarative Fetch - Comprehensive Demo',
              style: {
                color: '#2c3e50',
                textAlign: 'center',
                marginBottom: '30px'
              }
            },
            {
              tagName: 'p',
              textContent: 'This demo showcases the full power of DDOM\'s Request namespace with real JSONPlaceholder API calls.',
              style: {
                textAlign: 'center',
                color: '#6c757d',
                marginBottom: '40px',
                fontSize: '18px'
              }
            },

            // User Profile Demo
            {
              tagName: 'div',
              className: 'demo-section',
              style: {
                margin: '30px 0',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #007bff'
              },
              children: [
                {
                  tagName: 'h2',
                  textContent: 'User Profile Dashboard',
                  style: {
                    color: '#495057',
                    marginTop: '0'
                  }
                },
                {
                  tagName: 'div',
                  id: 'user-profile',
                  $userData: {
                    Request: {
                      url: "https://jsonplaceholder.typicode.com/users/1"
                    }
                  },
                  $userPosts: {
                    Request: {
                      url: "https://jsonplaceholder.typicode.com/users/1/posts"
                    }
                  },
                  children: [
                    {
                      tagName: 'div',
                      id: 'user-info',
                      style: {
                        background: '#2d3748',
                        color: '#a0aec0',
                        padding: '15px',
                        borderRadius: '6px',
                        fontFamily: 'Monaco, Menlo, monospace',
                        fontSize: '14px',
                        marginBottom: '20px'
                      },
                      textContent: 'Loading user data...'
                    },
                    {
                      tagName: 'div',
                      id: 'user-posts',
                      style: {
                        background: '#2d3748',
                        color: '#a0aec0',
                        padding: '15px',
                        borderRadius: '6px',
                        fontFamily: 'Monaco, Menlo, monospace',
                        fontSize: '14px'
                      },
                      textContent: 'Loading user posts...'
                    }
                  ]
                }
              ]
            },

            // Blog Post Creation Demo
            {
              tagName: 'div',
              className: 'demo-section',
              style: {
                margin: '30px 0',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #28a745'
              },
              children: [
                {
                  tagName: 'h2',
                  textContent: 'Create Blog Post',
                  style: {
                    color: '#495057',
                    marginTop: '0'
                  }
                },
                {
                  tagName: 'button',
                  textContent: 'Create New Post',
                  style: {
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    marginBottom: '20px',
                    ':hover': {
                      background: '#218838'
                    }
                  },
                  onclick: 'window.createPost()'
                },
                {
                  tagName: 'div',
                  id: 'post-result',
                  style: {
                    background: '#2d3748',
                    color: '#a0aec0',
                    padding: '15px',
                    borderRadius: '6px',
                    fontFamily: 'Monaco, Menlo, monospace',
                    fontSize: '14px',
                    minHeight: '100px'
                  },
                  textContent: 'Click "Create New Post" to test POST functionality'
                }
              ]
            },

            // Form Data Demo
            {
              tagName: 'div',
              className: 'demo-section',
              style: {
                margin: '30px 0',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #ffc107'
              },
              children: [
                {
                  tagName: 'h2',
                  textContent: 'File Upload Simulation',
                  style: {
                    color: '#495057',
                    marginTop: '0'
                  }
                },
                {
                  tagName: 'div',
                  id: 'upload-demo',
                  $uploadResult: {
                    Request: {
                      url: "https://httpbin.org/post",
                      method: "POST",
                      body: {
                        FormData: {
                          title: "DDOM File Upload Demo",
                          description: "Testing FormData with Request namespace",
                          category: "demo",
                          timestamp: new Date().toISOString()
                        }
                      }
                    }
                  },
                  children: [
                    {
                      tagName: 'div',
                      id: 'upload-result',
                      style: {
                        background: '#2d3748',
                        color: '#a0aec0',
                        padding: '15px',
                        borderRadius: '6px',
                        fontFamily: 'Monaco, Menlo, monospace',
                        fontSize: '14px'
                      },
                      textContent: 'Uploading form data...'
                    }
                  ]
                }
              ]
            },

            // Error Handling Demo
            {
              tagName: 'div',
              className: 'demo-section',
              style: {
                margin: '30px 0',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                borderLeft: '4px solid #dc3545'
              },
              children: [
                {
                  tagName: 'h2',
                  textContent: 'Error Handling',
                  style: {
                    color: '#495057',
                    marginTop: '0'
                  }
                },
                {
                  tagName: 'div',
                  id: 'error-demo',
                  $errorTest: {
                    Request: {
                      url: "https://jsonplaceholder.typicode.com/posts/99999"
                    }
                  },
                  children: [
                    {
                      tagName: 'div',
                      id: 'error-result',
                      style: {
                        background: '#2d3748',
                        color: '#a0aec0',
                        padding: '15px',
                        borderRadius: '6px',
                        fontFamily: 'Monaco, Menlo, monospace',
                        fontSize: '14px'
                      },
                      textContent: 'Testing 404 error handling...'
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },

  // Setup reactive effects and interactions after DOM is created
  onMounted() {
    const DDOM = window.DDOM;
    
    // User Profile Demo Effects
    const userProfile = document.getElementById('user-profile');
    const userInfo = document.getElementById('user-info');
    const userPosts = document.getElementById('user-posts');
    
    if (userProfile && userProfile.$userData) {
      DDOM.createEffect(() => {
        const userData = userProfile.$userData.get();
        
        if (userData) {
          if (userData.error) {
            userInfo.textContent = `User Data Error: ${userData.error}`;
            userInfo.style.background = '#dc3545';
          } else {
            userInfo.innerHTML = `
              <strong>${userData.name}</strong> (@${userData.username})<br>
              📧 ${userData.email}<br>
              🏢 ${userData.company?.name || 'No company'}<br>
              🌐 ${userData.website || 'No website'}<br>
              📍 ${userData.address?.city || 'Unknown'}, ${userData.address?.zipcode || ''}<br>
              ☎️ ${userData.phone}
            `;
            userInfo.style.background = '#28a745';
          }
        }
      });
    }
    
    if (userProfile && userProfile.$userPosts) {
      DDOM.createEffect(() => {
        const postsData = userProfile.$userPosts.get();
        
        if (postsData) {
          if (postsData.error) {
            userPosts.textContent = `Posts Error: ${postsData.error}`;
            userPosts.style.background = '#dc3545';
          } else {
            userPosts.innerHTML = `
              <strong>Recent Posts (${postsData.length} total):</strong><br><br>
              ${postsData.slice(0, 3).map(post => 
                `📝 <strong>${post.title}</strong><br>   ${post.body.substring(0, 80)}...<br><br>`
              ).join('')}
            `;
            userPosts.style.background = '#17a2b8';
          }
        }
      });
    }

    // Upload Demo Effect
    const uploadDemo = document.getElementById('upload-demo');
    const uploadResult = document.getElementById('upload-result');
    
    if (uploadDemo && uploadDemo.$uploadResult) {
      DDOM.createEffect(() => {
        const uploadData = uploadDemo.$uploadResult.get();
        
        if (uploadData) {
          if (uploadData.error) {
            uploadResult.textContent = `Upload Error: ${uploadData.error}`;
            uploadResult.style.background = '#dc3545';
          } else {
            uploadResult.innerHTML = `
              <strong>✅ Upload Successful!</strong><br><br>
              Form Data Received:<br>
              ${JSON.stringify(uploadData.form || {}, null, 2)}
            `;
            uploadResult.style.background = '#28a745';
          }
        }
      });
    }

    // Error Demo Effect
    const errorDemo = document.getElementById('error-demo');
    const errorResult = document.getElementById('error-result');
    
    if (errorDemo && errorDemo.$errorTest) {
      DDOM.createEffect(() => {
        const errorData = errorDemo.$errorTest.get();
        
        if (errorData) {
          if (errorData.error) {
            errorResult.innerHTML = `
              <strong>✅ Error Handling Working!</strong><br><br>
              Error: ${errorData.error}<br>
              Type: ${errorData.type}<br>
              Timestamp: ${errorData.timestamp}
            `;
            errorResult.style.background = '#28a745';
          } else {
            errorResult.innerHTML = `
              <strong>❌ Unexpected Success</strong><br>
              Expected 404 error but got: ${JSON.stringify(errorData, null, 2)}
            `;
            errorResult.style.background = '#dc3545';
          }
        }
      });
    }

    // Create Post Function
    window.createPost = function() {
      const postResult = document.getElementById('post-result');
      postResult.textContent = 'Creating new post...';
      postResult.style.background = '#ffc107';
      postResult.style.color = '#333';
      
      const postSignal = DDOM.createFetchSignal(DDOM.convertDDOMRequestToNative({
        Request: {
          url: "https://jsonplaceholder.typicode.com/posts",
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: {
            title: `DDOM Blog Post - ${new Date().toLocaleString()}`,
            body: "This post was created using DDOM's declarative fetch functionality with the Request namespace. It demonstrates how easy it is to make API calls declaratively!",
            userId: 1
          }
        }
      }));
      
      DDOM.createEffect(() => {
        const result = postSignal.get();
        
        if (result) {
          if (result.error) {
            postResult.innerHTML = `
              <strong>❌ Post Creation Failed</strong><br>
              Error: ${result.error}
            `;
            postResult.style.background = '#dc3545';
            postResult.style.color = 'white';
          } else {
            postResult.innerHTML = `
              <strong>✅ Post Created Successfully!</strong><br><br>
              Post ID: ${result.id}<br>
              Title: ${result.title}<br>
              User ID: ${result.userId}<br><br>
              <strong>Response:</strong><br>
              ${JSON.stringify(result, null, 2)}
            `;
            postResult.style.background = '#28a745';
            postResult.style.color = 'white';
          }
        }
      });
    };

    console.log('✅ Comprehensive Fetch Demo initialized');
  }
};