// Request Namespace Body Types Tests
// Testing various body types with Request namespace

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
          textContent: 'Request Namespace Body Types Tests',
          style: { color: '#333', marginBottom: '20px' }
        },
        {
          tagName: 'p',
          textContent: 'Testing various body types with Request namespace',
          style: { marginBottom: '30px', color: '#666' }
        },
        
        // Test 1: JSON Object Body
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
              textContent: 'Test 1: JSON Object Body',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test1-element',
              $jsonPost: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts",
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: {
                    title: "JSON Object Test",
                    body: "Testing JSON object body conversion",
                    userId: 42,
                    metadata: {
                      test: true,
                      timestamp: new Date().toISOString()
                    }
                  }
                }
              },
              textContent: 'Posting JSON object...',
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

        // Test 2: Array Body
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
              textContent: 'Test 2: Array Body',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test2-element',
              $arrayPost: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts",
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: [
                    { action: "create", type: "user" },
                    { action: "update", type: "post" },
                    { action: "delete", type: "comment" }
                  ]
                }
              },
              textContent: 'Posting array...',
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

        // Test 3: FormData Body
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
              textContent: 'Test 3: FormData Body',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test3-element',
              $formPost: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts",
                  method: "POST",
                  body: {
                    FormData: {
                      title: "FormData Test",
                      body: "Testing FormData body conversion",
                      userId: "99",
                      category: "test"
                    }
                  }
                }
              },
              textContent: 'Posting FormData...',
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
        },

        // Test 4: URLSearchParams Body
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
              textContent: 'Test 4: URLSearchParams Body',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test4-element',
              $paramsPost: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts",
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                  },
                  body: {
                    URLSearchParams: {
                      title: "URLSearchParams Test",
                      body: "Testing URLSearchParams body conversion",
                      userId: "88"
                    }
                  }
                }
              },
              textContent: 'Posting URLSearchParams...',
              style: {
                padding: '10px',
                margin: '10px 0',
                backgroundColor: '#f8f9fa',
                borderRadius: '3px'
              }
            },
            {
              tagName: 'div',
              id: 'test4-result',
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
    
    // Test 1: JSON Object Body
    const test1Element = document.getElementById('test1-element');
    const test1Result = document.getElementById('test1-result');
    
    if (test1Element && test1Element.$jsonPost) {
      DDOM.createEffect(() => {
        const data = test1Element.$jsonPost.get();
        
        if (data) {
          if (data.error) {
            test1Result.style.backgroundColor = '#f8d7da';
            test1Result.style.color = '#721c24';
            test1Result.innerHTML = `<strong>Error:</strong> ${data.error}`;
          } else {
            test1Result.style.backgroundColor = '#d4edda';
            test1Result.style.color = '#155724';
            test1Result.innerHTML = `
              <strong>Success!</strong> JSON object posted, received ID: ${data.id}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
          }
        }
      });
    }

    // Test 2: Array Body
    const test2Element = document.getElementById('test2-element');
    const test2Result = document.getElementById('test2-result');
    
    if (test2Element && test2Element.$arrayPost) {
      DDOM.createEffect(() => {
        const data = test2Element.$arrayPost.get();
        
        if (data) {
          if (data.error) {
            test2Result.style.backgroundColor = '#f8d7da';
            test2Result.style.color = '#721c24';
            test2Result.innerHTML = `<strong>Error:</strong> ${data.error}`;
          } else {
            test2Result.style.backgroundColor = '#d4edda';
            test2Result.style.color = '#155724';
            test2Result.innerHTML = `
              <strong>Success!</strong> Array posted, received ID: ${data.id}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
          }
        }
      });
    }

    // Test 3: FormData Body
    const test3Element = document.getElementById('test3-element');
    const test3Result = document.getElementById('test3-result');
    
    if (test3Element && test3Element.$formPost) {
      DDOM.createEffect(() => {
        const data = test3Element.$formPost.get();
        
        if (data) {
          if (data.error) {
            test3Result.style.backgroundColor = '#f8d7da';
            test3Result.style.color = '#721c24';
            test3Result.innerHTML = `<strong>Error:</strong> ${data.error}`;
          } else {
            test3Result.style.backgroundColor = '#d4edda';
            test3Result.style.color = '#155724';
            test3Result.innerHTML = `
              <strong>Success!</strong> FormData posted, received ID: ${data.id}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
          }
        }
      });
    }

    // Test 4: URLSearchParams Body
    const test4Element = document.getElementById('test4-element');
    const test4Result = document.getElementById('test4-result');
    
    if (test4Element && test4Element.$paramsPost) {
      DDOM.createEffect(() => {
        const data = test4Element.$paramsPost.get();
        
        if (data) {
          if (data.error) {
            test4Result.style.backgroundColor = '#f8d7da';
            test4Result.style.color = '#721c24';
            test4Result.innerHTML = `<strong>Error:</strong> ${data.error}`;
          } else {
            test4Result.style.backgroundColor = '#d4edda';
            test4Result.style.color = '#155724';
            test4Result.innerHTML = `
              <strong>Success!</strong> URLSearchParams posted, received ID: ${data.id}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
          }
        }
      });
    }
  }
};