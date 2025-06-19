// Request Namespace Basic Tests
// Testing basic Request namespace functionality with JSONPlaceholder API

export default {
  document: {
    body: {
      style: {
        fontFamily: 'Arial, sans-serif',
        margin: '20px',
        backgroundColor: '#f5f5f5'
      },
      children: [
        {
          tagName: 'h1',
          textContent: 'Request Namespace Basic Tests',
          style: { color: '#333', marginBottom: '20px' }
        },
        {
          tagName: 'p',
          textContent: 'Testing basic Request namespace functionality with JSONPlaceholder API',
          style: { marginBottom: '30px', color: '#666' }
        },
        
        // Test 1: Basic GET Request
        {
          tagName: 'div',
          className: 'test-section',
          style: {
            margin: '20px 0',
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: 'white'
          },
          children: [
            {
              tagName: 'h3',
              textContent: 'Test 1: Basic GET Request',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test1-element',
              $userData: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/users/1"
                }
              },
              textContent: 'Loading user data...',
              style: {
                padding: '10px',
                margin: '10px 0',
                backgroundColor: '#f8f9fa',
                borderRadius: '3px'
              }
            },
            {
              tagName: 'div',
              id: 'test1-result',
              className: 'result loading',
              textContent: 'Initializing...',
              style: {
                padding: '10px',
                margin: '10px 0',
                borderRadius: '3px',
                backgroundColor: '#fff3cd',
                color: '#856404'
              }
            }
          ]
        },

        // Test 2: POST Request with JSON Body
        {
          tagName: 'div',
          className: 'test-section',
          style: {
            margin: '20px 0',
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: 'white'
          },
          children: [
            {
              tagName: 'h3',
              textContent: 'Test 2: POST Request with JSON Body',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test2-element',
              $postResult: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts",
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: {
                    title: "Test Post from DDOM",
                    body: "This is a test post created via DDOM Request namespace",
                    userId: 1
                  }
                }
              },
              textContent: 'Creating post...',
              style: {
                padding: '10px',
                margin: '10px 0',
                backgroundColor: '#f8f9fa',
                borderRadius: '3px'
              }
            },
            {
              tagName: 'div',
              id: 'test2-result',
              className: 'result loading',
              textContent: 'Initializing...',
              style: {
                padding: '10px',
                margin: '10px 0',
                borderRadius: '3px',
                backgroundColor: '#fff3cd',
                color: '#856404'
              }
            }
          ]
        },

        // Test 3: Request with Headers
        {
          tagName: 'div',
          className: 'test-section',
          style: {
            margin: '20px 0',
            padding: '15px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: 'white'
          },
          children: [
            {
              tagName: 'h3',
              textContent: 'Test 3: Request with Headers',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test3-element',
              $headerTest: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts/1",
                  method: "GET",
                  headers: {
                    "Accept": "application/json",
                    "User-Agent": "DDOM-Request-Test/1.0"
                  }
                }
              },
              textContent: 'Loading with custom headers...',
              style: {
                padding: '10px',
                margin: '10px 0',
                backgroundColor: '#f8f9fa',
                borderRadius: '3px'
              }
            },
            {
              tagName: 'div',
              id: 'test3-result',
              className: 'result loading',
              textContent: 'Initializing...',
              style: {
                padding: '10px',
                margin: '10px 0',
                borderRadius: '3px',
                backgroundColor: '#fff3cd',
                color: '#856404'
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
    
    // Test 1: Basic GET Request
    const test1Element = document.getElementById('test1-element');
    const test1Result = document.getElementById('test1-result');
    
    if (test1Element && test1Element.$userData) {
      DDOM.createEffect(() => {
        const data = test1Element.$userData.get();
        
        if (data) {
          if (data.error) {
            test1Result.style.backgroundColor = '#f8d7da';
            test1Result.style.color = '#721c24';
            test1Result.innerHTML = `<strong>Error:</strong> ${data.error}`;
          } else {
            test1Result.style.backgroundColor = '#d4edda';
            test1Result.style.color = '#155724';
            test1Result.innerHTML = `
              <strong>Success!</strong> Loaded user: ${data.name}<br>
              <strong>Email:</strong> ${data.email}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            test1Element.textContent = `User: ${data.name}`;
          }
        }
      });
    }

    // Test 2: POST Request with JSON Body
    const test2Element = document.getElementById('test2-element');
    const test2Result = document.getElementById('test2-result');
    
    if (test2Element && test2Element.$postResult) {
      DDOM.createEffect(() => {
        const data = test2Element.$postResult.get();
        
        if (data) {
          if (data.error) {
            test2Result.style.backgroundColor = '#f8d7da';
            test2Result.style.color = '#721c24';
            test2Result.innerHTML = `<strong>Error:</strong> ${data.error}`;
          } else {
            test2Result.style.backgroundColor = '#d4edda';
            test2Result.style.color = '#155724';
            test2Result.innerHTML = `
              <strong>Success!</strong> Created post with ID: ${data.id}<br>
              <strong>Title:</strong> ${data.title}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            test2Element.textContent = `Created post: ${data.title}`;
          }
        }
      });
    }

    // Test 3: Request with Headers
    const test3Element = document.getElementById('test3-element');
    const test3Result = document.getElementById('test3-result');
    
    if (test3Element && test3Element.$headerTest) {
      DDOM.createEffect(() => {
        const data = test3Element.$headerTest.get();
        
        if (data) {
          if (data.error) {
            test3Result.style.backgroundColor = '#f8d7da';
            test3Result.style.color = '#721c24';
            test3Result.innerHTML = `<strong>Error:</strong> ${data.error}`;
          } else {
            test3Result.style.backgroundColor = '#d4edda';
            test3Result.style.color = '#155724';
            test3Result.innerHTML = `
              <strong>Success!</strong> Loaded post: ${data.title}<br>
              <strong>User ID:</strong> ${data.userId}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            test3Element.textContent = `Post: ${data.title}`;
          }
        }
      });
    }
  }
};