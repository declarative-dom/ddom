// DDOM Request Namespace Syntax Demo
// Demonstrates the new serializable Request object syntax

export default {
  document: {
    body: {
      style: {
        fontFamily: 'sans-serif',
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: '#f5f5f5'
      },
      children: [
        {
          tagName: 'h1',
          textContent: 'DDOM Request Namespace Syntax Demo',
          style: { color: '#333', textAlign: 'center', marginBottom: '20px' }
        },
        {
          tagName: 'p',
          textContent: 'This page demonstrates the new serializable Request object syntax.',
          style: { textAlign: 'center', marginBottom: '40px', color: '#666' }
        },

        // Example 1: Basic GET Request
        {
          tagName: 'div',
          className: 'example',
          style: {
            background: '#fff',
            border: '1px solid #ddd',
            padding: '20px',
            margin: '20px 0',
            borderRadius: '8px'
          },
          children: [
            {
              tagName: 'h2',
              textContent: 'Example 1: Basic GET Request',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              className: 'code',
              style: {
                background: '#2d3748',
                color: '#e2e8f0',
                padding: '15px',
                borderRadius: '5px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                marginBottom: '15px'
              },
              innerHTML: `{
  tagName: 'user-profile',
  $userData: {
    Request: {
      url: "https://jsonplaceholder.typicode.com/users/1"
    }
  }
}`
            },
            {
              tagName: 'div',
              id: 'example1-result',
              className: 'result',
              style: {
                background: '#f8f9fa',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '5px',
                minHeight: '50px'
              },
              textContent: 'Loading...'
            }
          ]
        },

        // Example 2: POST Request with JSON Body
        {
          tagName: 'div',
          className: 'example',
          style: {
            background: '#fff',
            border: '1px solid #ddd',
            padding: '20px',
            margin: '20px 0',
            borderRadius: '8px'
          },
          children: [
            {
              tagName: 'h2',
              textContent: 'Example 2: POST Request with JSON Body',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              className: 'code',
              style: {
                background: '#2d3748',
                color: '#e2e8f0',
                padding: '15px',
                borderRadius: '5px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                marginBottom: '15px'
              },
              innerHTML: `{
  tagName: 'create-user-form',
  $createUser: {
    Request: {
      url: "https://jsonplaceholder.typicode.com/posts",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        title: "DDOM Request Test",
        body: "Testing new serializable Request syntax",
        userId: 1
      }
    }
  }
}`
            },
            {
              tagName: 'div',
              id: 'example2-result',
              className: 'result',
              style: {
                background: '#f8f9fa',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '5px',
                minHeight: '50px'
              },
              textContent: 'Loading...'
            }
          ]
        },

        // Example 3: FormData Request
        {
          tagName: 'div',
          className: 'example',
          style: {
            background: '#fff',
            border: '1px solid #ddd',
            padding: '20px',
            margin: '20px 0',
            borderRadius: '8px'
          },
          children: [
            {
              tagName: 'h2',
              textContent: 'Example 3: FormData Request',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              className: 'code',
              style: {
                background: '#2d3748',
                color: '#e2e8f0',
                padding: '15px',
                borderRadius: '5px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                marginBottom: '15px'
              },
              innerHTML: `{
  tagName: 'upload-form',
  $uploadFile: {
    Request: {
      url: "https://httpbin.org/post",
      method: "POST",
      body: {
        FormData: {
          field1: "value1",
          field2: "value2"
        }
      }
    }
  }
}`
            },
            {
              tagName: 'div',
              id: 'example3-result',
              className: 'result',
              style: {
                background: '#f8f9fa',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '5px',
                minHeight: '50px'
              },
              textContent: 'Loading...'
            }
          ]
        },

        // Example 4: Comprehensive Request Options
        {
          tagName: 'div',
          className: 'example',
          style: {
            background: '#fff',
            border: '1px solid #ddd',
            padding: '20px',
            margin: '20px 0',
            borderRadius: '8px'
          },
          children: [
            {
              tagName: 'h2',
              textContent: 'Example 4: Comprehensive Request Options',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              className: 'code',
              style: {
                background: '#2d3748',
                color: '#e2e8f0',
                padding: '15px',
                borderRadius: '5px',
                fontFamily: 'monospace',
                overflowX: 'auto',
                marginBottom: '15px'
              },
              innerHTML: `{
  tagName: 'comprehensive-request',
  $comprehensiveRequest: {
    Request: {
      url: "https://jsonplaceholder.typicode.com/users/2",
      method: "GET",
      headers: {
        "Accept": "application/json",
        "X-Custom-Header": "test-value"
      },
      mode: "cors",
      credentials: "omit",
      cache: "no-cache"
    }
  }
}`
            },
            {
              tagName: 'div',
              id: 'example4-result',
              className: 'result',
              style: {
                background: '#f8f9fa',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '5px',
                minHeight: '50px'
              },
              textContent: 'Loading...'
            }
          ]
        },

        // Hidden elements to create Request objects
        {
          tagName: 'div',
          style: { display: 'none' },
          children: [
            {
              tagName: 'user-profile',
              id: 'user-profile-element',
              $userData: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/users/1"
                }
              }
            },
            {
              tagName: 'create-user-form',
              id: 'create-user-form-element',
              $createUser: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts",
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: {
                    title: "DDOM Request Test",
                    body: "Testing new serializable Request syntax",
                    userId: 1
                  }
                }
              }
            },
            {
              tagName: 'upload-form',
              id: 'upload-form-element',
              $uploadFile: {
                Request: {
                  url: "https://httpbin.org/post",
                  method: "POST",
                  body: {
                    FormData: {
                      field1: "value1",
                      field2: "value2"
                    }
                  }
                }
              }
            },
            {
              tagName: 'comprehensive-request',
              id: 'comprehensive-request-element',
              $comprehensiveRequest: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/users/2",
                  method: "GET",
                  headers: {
                    "Accept": "application/json",
                    "X-Custom-Header": "test-value"
                  },
                  mode: "cors",
                  credentials: "omit",
                  cache: "no-cache"
                }
              }
            }
          ]
        }
      ]
    }
  },

  // Setup reactive effects after DOM is created
  onMounted() {
    const DDOM = window.DDOM;
    
    // Test Example 1
    const userProfile = document.getElementById('user-profile-element');
    const example1Result = document.getElementById('example1-result');
    
    if (userProfile && userProfile.$userData) {
      example1Result.innerHTML = '<span style="color: #007bff;">✓ userData Signal created, fetching...</span>';
      
      DDOM.createEffect(() => {
        const userData = userProfile.$userData.get();
        
        if (userData === null) {
          return; // Still loading
        } else if (userData.error) {
          example1Result.innerHTML = `<div style="color: #dc3545;">❌ Error: ${userData.error}</div>`;
        } else {
          example1Result.innerHTML = `
            <div style="color: #28a745;">✅ User Data Loaded:</div>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px; overflow: auto;">${JSON.stringify(userData, null, 2)}</pre>
          `;
        }
      });
    } else {
      example1Result.innerHTML = '<div style="color: #dc3545;">❌ Failed to create userData Signal</div>';
    }

    // Test Example 2
    const createUserForm = document.getElementById('create-user-form-element');
    const example2Result = document.getElementById('example2-result');
    
    if (createUserForm && createUserForm.$createUser) {
      example2Result.innerHTML = '<span style="color: #007bff;">✓ createUser Signal created, posting...</span>';
      
      DDOM.createEffect(() => {
        const result = createUserForm.$createUser.get();
        
        if (result === null) {
          return; // Still loading
        } else if (result.error) {
          example2Result.innerHTML = `<div style="color: #dc3545;">❌ POST Error: ${result.error}</div>`;
        } else {
          example2Result.innerHTML = `
            <div style="color: #28a745;">✅ POST Request Successful:</div>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px; overflow: auto;">${JSON.stringify(result, null, 2)}</pre>
          `;
        }
      });
    } else {
      example2Result.innerHTML = '<div style="color: #dc3545;">❌ Failed to create createUser Signal</div>';
    }

    // Test Example 3
    const uploadForm = document.getElementById('upload-form-element');
    const example3Result = document.getElementById('example3-result');
    
    if (uploadForm && uploadForm.$uploadFile) {
      example3Result.innerHTML = '<span style="color: #007bff;">✓ uploadFile Signal created, uploading...</span>';
      
      DDOM.createEffect(() => {
        const result = uploadForm.$uploadFile.get();
        
        if (result === null) {
          return; // Still loading
        } else if (result.error) {
          example3Result.innerHTML = `<div style="color: #dc3545;">❌ Upload Error: ${result.error}</div>`;
        } else {
          example3Result.innerHTML = `
            <div style="color: #28a745;">✅ FormData Upload Successful:</div>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px; overflow: auto;">${JSON.stringify(result, null, 2)}</pre>
          `;
        }
      });
    } else {
      example3Result.innerHTML = '<div style="color: #dc3545;">❌ Failed to create uploadFile Signal</div>';
    }

    // Test Example 4
    const comprehensiveRequest = document.getElementById('comprehensive-request-element');
    const example4Result = document.getElementById('example4-result');
    
    if (comprehensiveRequest && comprehensiveRequest.$comprehensiveRequest) {
      example4Result.innerHTML = '<span style="color: #007bff;">✓ comprehensiveRequest Signal created, fetching...</span>';
      
      DDOM.createEffect(() => {
        const result = comprehensiveRequest.$comprehensiveRequest.get();
        
        if (result === null) {
          return; // Still loading
        } else if (result.error) {
          example4Result.innerHTML = `<div style="color: #dc3545;">❌ Error: ${result.error}</div>`;
        } else {
          example4Result.innerHTML = `
            <div style="color: #28a745;">✅ Comprehensive Request Successful:</div>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px; overflow: auto;">${JSON.stringify(result, null, 2)}</pre>
          `;
        }
      });
    } else {
      example4Result.innerHTML = '<div style="color: #dc3545;">❌ Failed to create comprehensiveRequest Signal</div>';
    }

    console.log('All examples initialized');
  }
};