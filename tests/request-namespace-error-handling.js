// Request Namespace Error Handling Tests
// Testing error handling scenarios with Request namespace

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
          textContent: 'Request Namespace Error Handling Tests',
          style: { color: '#333', marginBottom: '20px' }
        },
        {
          tagName: 'p',
          textContent: 'Testing error handling scenarios with Request namespace',
          style: { marginBottom: '30px', color: '#666' }
        },
        
        // Test 1: 404 Not Found Error
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
              textContent: 'Test 1: 404 Not Found Error',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test1-element',
              $notFoundTest: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts/99999",
                  method: "GET"
                }
              },
              textContent: 'Testing 404 error...',
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

        // Test 2: Network Error (Invalid URL)
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
              textContent: 'Test 2: Network Error (Invalid URL)',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test2-element',
              $networkErrorTest: {
                Request: {
                  url: "https://invalid-domain-that-does-not-exist-12345.com/api/test",
                  method: "GET"
                }
              },
              textContent: 'Testing network error...',
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

        // Test 3: HTTP Error Status (500 Internal Server Error)
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
              textContent: 'Test 3: HTTP Error Status (500 Internal Server Error)',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test3-element',
              $httpErrorTest: {
                Request: {
                  url: "https://httpbin.org/status/500",
                  method: "GET"
                }
              },
              textContent: 'Testing HTTP error status...',
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

        // Test 4: Valid Request (Control)
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
              textContent: 'Test 4: Valid Request (Control)',
              style: { marginTop: '0', color: '#333' }
            },
            {
              tagName: 'div',
              id: 'test4-element',
              $validTest: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts/1",
                  method: "GET"
                }
              },
              textContent: 'Testing valid request...',
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
    
    // Test 1: 404 Not Found Error
    const test1Element = document.getElementById('test1-element');
    const test1Result = document.getElementById('test1-result');
    
    if (test1Element && test1Element.$notFoundTest) {
      DDOM.createEffect(() => {
        const data = test1Element.$notFoundTest.get();
        
        if (data) {
          if (data.error) {
            test1Result.style.backgroundColor = '#d4edda';  // Success because we expected an error
            test1Result.style.color = '#155724';
            test1Result.innerHTML = `
              <strong>Expected Error Caught!</strong><br>
              <strong>Error:</strong> ${data.error}<br>
              <strong>Type:</strong> ${data.type}<br>
              <strong>Timestamp:</strong> ${data.timestamp}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            test1Element.textContent = `Error handled: ${data.error}`;
          } else {
            test1Result.style.backgroundColor = '#f8d7da';
            test1Result.style.color = '#721c24';
            test1Result.innerHTML = `<strong>Unexpected Success:</strong> Expected 404 error but got data: <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>`;
          }
        }
      });
    }

    // Test 2: Network Error (Invalid URL)
    const test2Element = document.getElementById('test2-element');
    const test2Result = document.getElementById('test2-result');
    
    if (test2Element && test2Element.$networkErrorTest) {
      DDOM.createEffect(() => {
        const data = test2Element.$networkErrorTest.get();
        
        if (data) {
          if (data.error) {
            test2Result.style.backgroundColor = '#d4edda';  // Success because we expected an error
            test2Result.style.color = '#155724';
            test2Result.innerHTML = `
              <strong>Expected Network Error Caught!</strong><br>
              <strong>Error:</strong> ${data.error}<br>
              <strong>Type:</strong> ${data.type}<br>
              <strong>Timestamp:</strong> ${data.timestamp}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            test2Element.textContent = `Network error handled: ${data.error}`;
          } else {
            test2Result.style.backgroundColor = '#f8d7da';
            test2Result.style.color = '#721c24';
            test2Result.innerHTML = `<strong>Unexpected Success:</strong> Expected network error but got data: <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>`;
          }
        }
      });
    }

    // Test 3: HTTP Error Status (500 Internal Server Error)
    const test3Element = document.getElementById('test3-element');
    const test3Result = document.getElementById('test3-result');
    
    if (test3Element && test3Element.$httpErrorTest) {
      DDOM.createEffect(() => {
        const data = test3Element.$httpErrorTest.get();
        
        if (data) {
          if (data.error) {
            test3Result.style.backgroundColor = '#d4edda';  // Success because we expected an error
            test3Result.style.color = '#155724';
            test3Result.innerHTML = `
              <strong>Expected HTTP Error Caught!</strong><br>
              <strong>Error:</strong> ${data.error}<br>
              <strong>Type:</strong> ${data.type}<br>
              <strong>Timestamp:</strong> ${data.timestamp}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            test3Element.textContent = `HTTP error handled: ${data.error}`;
          } else {
            test3Result.style.backgroundColor = '#f8d7da';
            test3Result.style.color = '#721c24';
            test3Result.innerHTML = `<strong>Unexpected Success:</strong> Expected HTTP error but got data: <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>`;
          }
        }
      });
    }

    // Test 4: Valid Request (Control Test)
    const test4Element = document.getElementById('test4-element');
    const test4Result = document.getElementById('test4-result');
    
    if (test4Element && test4Element.$validTest) {
      DDOM.createEffect(() => {
        const data = test4Element.$validTest.get();
        
        if (data) {
          if (data.error) {
            test4Result.style.backgroundColor = '#f8d7da';
            test4Result.style.color = '#721c24';
            test4Result.innerHTML = `<strong>Unexpected Error:</strong> ${data.error}`;
          } else {
            test4Result.style.backgroundColor = '#d4edda';
            test4Result.style.color = '#155724';
            test4Result.innerHTML = `
              <strong>Success!</strong> Valid request worked correctly<br>
              <strong>Post Title:</strong> ${data.title}<br>
              <strong>User ID:</strong> ${data.userId}<br>
              <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px; margin-top: 10px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            test4Element.textContent = `Valid request: ${data.title}`;
          }
        }
      });
    }
  }
};