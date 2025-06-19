// Observable Request Features Demo
// Demonstrates the advanced Observable-powered Request namespace functionality

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
          textContent: 'Observable Request Features Demo',
          style: { 
            color: '#333', 
            marginBottom: '20px',
            textAlign: 'center'
          }
        },
        {
          tagName: 'p',
          textContent: 'This demo showcases the advanced Observable-powered Request namespace functionality with sophisticated async operations.',
          style: { 
            marginBottom: '30px', 
            color: '#666',
            textAlign: 'center',
            fontSize: '18px'
          }
        },
        
        // Test: Basic Observable Request
        {
          tagName: 'div',
          className: 'demo-section',
          style: {
            margin: '20px 0',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          children: [
            {
              tagName: 'h2',
              textContent: '🔄 Observable-Powered Request',
              style: { 
                marginTop: '0', 
                color: '#333',
                fontSize: '24px'
              }
            },
            {
              tagName: 'p',
              textContent: 'This request uses TC39 Observables internally for sophisticated async handling.',
              style: { color: '#666', marginBottom: '15px' }
            },
            {
              tagName: 'div',
              id: 'observable-request',
              $userData: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/users/1",
                  method: "GET",
                  headers: {
                    "Accept": "application/json",
                    "User-Agent": "DDOM-Observable/1.0"
                  }
                }
              },
              style: {
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                marginBottom: '15px'
              },
              children: [
                {
                  tagName: 'div',
                  id: 'observable-status',
                  textContent: 'Initializing Observable request...',
                  style: {
                    fontWeight: 'bold',
                    color: '#007bff'
                  }
                },
                {
                  tagName: 'div',
                  id: 'observable-result',
                  style: {
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }
                }
              ]
            }
          ]
        },

        // Test: Complex Body Types
        {
          tagName: 'div',
          className: 'demo-section',
          style: {
            margin: '20px 0',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          children: [
            {
              tagName: 'h2',
              textContent: '📦 Complex Body Processing',
              style: { 
                marginTop: '0', 
                color: '#333',
                fontSize: '24px'
              }
            },
            {
              tagName: 'p',
              textContent: 'Observable handles complex body types asynchronously - FormData, ArrayBuffer, ReadableStream.',
              style: { color: '#666', marginBottom: '15px' }
            },
            {
              tagName: 'div',
              id: 'complex-body-request',
              $complexPost: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts",
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: {
                    title: "Observable Complex Body Test",
                    body: "This request demonstrates complex body processing with Observables",
                    userId: 1,
                    metadata: {
                      timestamp: new Date().toISOString(),
                      bodyType: "complex-object",
                      processingType: "observable-async"
                    }
                  }
                }
              },
              style: {
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                marginBottom: '15px'
              },
              children: [
                {
                  tagName: 'div',
                  id: 'complex-status',
                  textContent: 'Processing complex body with Observable...',
                  style: {
                    fontWeight: 'bold',
                    color: '#28a745'
                  }
                },
                {
                  tagName: 'div',
                  id: 'complex-result',
                  style: {
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }
                }
              ]
            }
          ]
        },

        // Test: Error Handling
        {
          tagName: 'div',
          className: 'demo-section',
          style: {
            margin: '20px 0',
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          children: [
            {
              tagName: 'h2',
              textContent: '🚨 Enhanced Error Handling',
              style: { 
                marginTop: '0', 
                color: '#333',
                fontSize: '24px'
              }
            },
            {
              tagName: 'p',
              textContent: 'Observable provides sophisticated error handling with detailed error information.',
              style: { color: '#666', marginBottom: '15px' }
            },
            {
              tagName: 'div',
              id: 'error-request',
              $errorTest: {
                Request: {
                  url: "https://jsonplaceholder.typicode.com/posts/999999",
                  method: "GET",
                  timeout: 5000
                }
              },
              style: {
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '5px',
                marginBottom: '15px'
              },
              children: [
                {
                  tagName: 'div',
                  id: 'error-status',
                  textContent: 'Testing error handling with Observable...',
                  style: {
                    fontWeight: 'bold',
                    color: '#dc3545'
                  }
                },
                {
                  tagName: 'div',
                  id: 'error-result',
                  style: {
                    marginTop: '10px',
                    padding: '10px',
                    backgroundColor: '#e9ecef',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }
                }
              ]
            }
          ]
        },

        // Architecture Info
        {
          tagName: 'div',
          className: 'info-section',
          style: {
            margin: '30px 0',
            padding: '20px',
            border: '2px solid #007bff',
            borderRadius: '8px',
            backgroundColor: '#f8f9ff'
          },
          children: [
            {
              tagName: 'h2',
              textContent: '🏗️ Observable Architecture',
              style: { 
                marginTop: '0', 
                color: '#007bff',
                fontSize: '24px'
              }
            },
            {
              tagName: 'ul',
              style: { color: '#333', lineHeight: '1.6' },
              children: [
                {
                  tagName: 'li',
                  innerHTML: '<strong>TC39 Observables:</strong> Standards-based async operations'
                },
                {
                  tagName: 'li',
                  innerHTML: '<strong>Complex Body Handling:</strong> Async FormData, ReadableStream, ArrayBuffer processing'
                },
                {
                  tagName: 'li',
                  innerHTML: '<strong>Error Resilience:</strong> Sophisticated error handling and retry logic'
                },
                {
                  tagName: 'li',
                  innerHTML: '<strong>Signal Bridge:</strong> Observable results bridged to DDOM Signals'
                },
                {
                  tagName: 'li',
                  innerHTML: '<strong>AbortController:</strong> Automatic request cancellation and cleanup'
                }
              ]
            }
          ]
        }
      ]
    }
  },

  // Setup reactive effects
  onMounted() {
    const DDOM = window.DDOM;
    
    // Observable Request Demo
    const observableElement = document.getElementById('observable-request');
    const observableStatus = document.getElementById('observable-status');
    const observableResult = document.getElementById('observable-result');
    
    if (observableElement && observableElement.$userData) {
      DDOM.createEffect(() => {
        const data = observableElement.$userData.get();
        
        if (data) {
          if (data.error) {
            observableStatus.textContent = 'Observable Error Occurred';
            observableStatus.style.color = '#dc3545';
            observableResult.innerHTML = `
              <strong>Error Type:</strong> ${data.type}<br>
              <strong>Message:</strong> ${data.error}<br>
              <strong>Timestamp:</strong> ${data.timestamp}
            `;
            observableResult.style.backgroundColor = '#f8d7da';
          } else {
            observableStatus.textContent = 'Observable Request Completed Successfully';
            observableStatus.style.color = '#28a745';
            observableResult.innerHTML = `
              <strong>User:</strong> ${data.name}<br>
              <strong>Email:</strong> ${data.email}<br>
              <strong>Company:</strong> ${data.company?.name}<br>
              <pre style="margin-top: 10px; background: white; padding: 10px; border-radius: 3px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            observableResult.style.backgroundColor = '#d4edda';
          }
        }
      });
    }

    // Complex Body Demo
    const complexElement = document.getElementById('complex-body-request');
    const complexStatus = document.getElementById('complex-status');
    const complexResult = document.getElementById('complex-result');
    
    if (complexElement && complexElement.$complexPost) {
      DDOM.createEffect(() => {
        const data = complexElement.$complexPost.get();
        
        if (data) {
          if (data.error) {
            complexStatus.textContent = 'Complex Body Processing Error';
            complexStatus.style.color = '#dc3545';
            complexResult.innerHTML = `
              <strong>Error:</strong> ${data.error}<br>
              <strong>Type:</strong> ${data.type}
            `;
            complexResult.style.backgroundColor = '#f8d7da';
          } else {
            complexStatus.textContent = 'Complex Body Processed Successfully';
            complexStatus.style.color = '#28a745';
            complexResult.innerHTML = `
              <strong>Created Post ID:</strong> ${data.id}<br>
              <strong>Title:</strong> ${data.title}<br>
              <pre style="margin-top: 10px; background: white; padding: 10px; border-radius: 3px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            complexResult.style.backgroundColor = '#d4edda';
          }
        }
      });
    }

    // Error Handling Demo
    const errorElement = document.getElementById('error-request');
    const errorStatus = document.getElementById('error-status');
    const errorResult = document.getElementById('error-result');
    
    if (errorElement && errorElement.$errorTest) {
      DDOM.createEffect(() => {
        const data = errorElement.$errorTest.get();
        
        if (data) {
          if (data.error) {
            errorStatus.textContent = 'Observable Error Handling Demonstrated';
            errorStatus.style.color = '#dc3545';
            errorResult.innerHTML = `
              <strong>Error Type:</strong> ${data.type}<br>
              <strong>Message:</strong> ${data.error}<br>
              <strong>Timestamp:</strong> ${data.timestamp}<br>
              <em>This demonstrates sophisticated Observable error handling</em>
            `;
            errorResult.style.backgroundColor = '#f8d7da';
          } else {
            errorStatus.textContent = 'Unexpected Success';
            errorStatus.style.color = '#28a745';
            errorResult.innerHTML = `
              <pre style="background: white; padding: 10px; border-radius: 3px;">${JSON.stringify(data, null, 2)}</pre>
            `;
            errorResult.style.backgroundColor = '#d4edda';
          }
        }
      });
    }
  }
};