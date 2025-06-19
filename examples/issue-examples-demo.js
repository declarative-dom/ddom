// DDOM Declarative Fetch - Issue Examples
// Exact examples from the GitHub issue demonstration

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
          textContent: 'DDOM Declarative Fetch - Issue Examples',
          style: { color: '#333', textAlign: 'center', marginBottom: '20px' }
        },
        {
          tagName: 'p',
          textContent: 'This page demonstrates the exact examples from the GitHub issue.',
          style: { textAlign: 'center', marginBottom: '40px', color: '#666' }
        },

        // Example 1: Direct Request Constructor Usage
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
              textContent: 'Example 1: Direct Request Constructor Usage',
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
      url: "/api/users/123"
    }
  },
  $avatar: {
    Request: {
      url: "/api/users/123/avatar"
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

        // Example 2: Request with Full Options
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
              textContent: 'Example 2: Request with Full Options',
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
  tagName: 'product-form',
  $submitResult: {
    Request: {
      url: "/api/products",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: { name: "Product Name", price: 99.99 }
    }
  }
}`
            },
            {
              tagName: 'button',
              textContent: 'Test POST Request',
              style: {
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginBottom: '15px',
                ':hover': { background: '#0056b3' }
              },
              onclick: 'window.testPostRequest()'
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
              textContent: 'Click button to test POST request'
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
              },
              $avatar: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/users/1"
                }
              }
            }
          ]
        }
      ]
    }
  },

  // Setup reactive effects and interactions after DOM is created
  onMounted() {
    const DDOM = window.DDOM;
    
    // Test Example 1
    const userProfile = document.getElementById('user-profile-element');
    const example1Result = document.getElementById('example1-result');
    
    if (userProfile && userProfile.$userData) {
      example1Result.innerHTML = '<span style="color: #007bff;">✓ userData Signal created, fetching...</span>';
      
      DDOM.createEffect(() => {
        const userData = userProfile.$userData.get();
        const avatarData = userProfile.$avatar.get();
        
        let result = '<h3>Results:</h3>';
        
        if (userData !== null) {
          if (userData.error) {
            result += `<div style="color: #dc3545;">userData Error: ${userData.error}</div>`;
          } else {
            result += `<div style="color: #28a745;">✓ userData loaded: ${userData.name} (${userData.email})</div>`;
          }
        }
        
        if (avatarData !== null) {
          if (avatarData.error) {
            result += `<div style="color: #dc3545;">avatar Error: ${avatarData.error}</div>`;
          } else {
            result += `<div style="color: #28a745;">✓ avatar data loaded</div>`;
          }
        }
        
        if (userData === null && avatarData === null) {
          result += '<div style="color: #007bff;">Loading both requests...</div>';
        }
        
        example1Result.innerHTML = result;
      });
    } else {
      example1Result.innerHTML = '<div style="color: #dc3545;">❌ userData is not a Signal</div>';
    }

    // Test Example 2
    window.testPostRequest = function() {
      const example2Result = document.getElementById('example2-result');
      example2Result.innerHTML = '<span style="color: #007bff;">Creating POST request...</span>';
      
      const postSignal = DDOM.createFetchSignal(DDOM.convertDDOMRequestToNative({
        Request: {
          url: "https://jsonplaceholder.typicode.com/posts",
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: { 
            name: "DDOM Product", 
            price: 99.99,
            description: "A product created with DDOM declarative fetch"
          }
        }
      }));
      
      DDOM.createEffect(() => {
        const result = postSignal.get();
        
        if (result === null) {
          return; // Still loading
        } else if (result.error) {
          example2Result.innerHTML = `<div style="color: #dc3545;">❌ POST Error: ${result.error}</div>`;
        } else {
          example2Result.innerHTML = `
            <div style="color: #28a745;">✓ POST Successful!</div>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px; overflow: auto;">${JSON.stringify(result, null, 2)}</pre>
          `;
        }
      });
    };

    console.log('✅ Issue examples setup complete');
    console.log('userProfile element:', userProfile);
    console.log('userData signal:', userProfile.$userData);
    console.log('avatar signal:', userProfile.$avatar);
  }
};