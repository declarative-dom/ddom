/**
 * Storage APIs Example
 * Demonstrates the use of Cookie, SessionStorage, LocalStorage, and IndexedDB namespaces
 * with automatic serialization for objects and arrays
 */

import { createElement } from '../lib/dist/index.js';

// Example: User preferences management with multiple storage types
const userPreferencesApp = createElement({
  tagName: 'div',
  id: 'preferences-app',
  
  // Cookie for temporary session preferences (strings only - no auto serialization)
  $sessionPrefs: {
    Cookie: {
      name: 'sessionPrefs',
      value: '{"theme":"auto","language":"en"}',  // Cookies require manual JSON for objects
      maxAge: 3600 // 1 hour
    }
  },
  
  // SessionStorage for temporary app state (automatic serialization)
  $tempState: {
    SessionStorage: {
      key: 'tempAppState',
      value: {  // Objects are automatically serialized
        lastVisited: new Date().toISOString(),
        pageViews: 0
      }
    }
  },
  
  // LocalStorage for persistent user settings (automatic serialization)
  $userSettings: {
    LocalStorage: {
      key: 'userSettings',
      value: {  // Objects are automatically serialized
        theme: 'light',
        notifications: true,
        autoSave: true,
        language: 'en'
      }
    }
  },
  
  // IndexedDB for complex user data
  $userProfile: {
    IndexedDB: {
      database: 'UserAppDB',
      store: 'profiles',
      key: 'currentUser',
      value: {
        name: '',
        email: '',
        avatar: null,
        preferences: {},
        history: []
      },
      version: 1
    }
  },
  
  style: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  
  children: [
    {
      tagName: 'h1',
      textContent: 'Storage APIs Demo - Automatic Serialization'
    },
    {
      tagName: 'div',
      className: 'preferences-section',
      children: [
        {
          tagName: 'h2',
          textContent: 'Current Storage Values:'
        },
        {
          tagName: 'div',
          innerHTML: `
            <h3>Session Cookie (strings only, manual JSON):</h3>
            <pre id="cookie-value">Loading...</pre>
            
            <h3>Session Storage (automatic object serialization):</h3>
            <pre id="session-value">Loading...</pre>
            
            <h3>Local Storage (automatic object serialization):</h3>
            <pre id="local-value">Loading...</pre>
            
            <h3>IndexedDB (database storage):</h3>
            <pre id="indexeddb-value">Database object available with async methods</pre>
          `
        },
        {
          tagName: 'div',
          className: 'controls',
          style: { marginTop: '20px' },
          children: [
            {
              tagName: 'button',
              textContent: 'Update Theme',
              onclick: () => {
                const settings = userPreferencesApp.$userSettings.get(); // Gets object directly
                settings.theme = settings.theme === 'light' ? 'dark' : 'light';
                userPreferencesApp.$userSettings.set(settings); // Automatically serialized
              }
            },
            {
              tagName: 'button',
              textContent: 'Increment Page Views',
              onclick: () => {
                const tempState = userPreferencesApp.$tempState.get(); // Gets object directly
                tempState.pageViews = (tempState.pageViews || 0) + 1;
                userPreferencesApp.$tempState.set(tempState); // Automatically serialized
              },
              style: { marginLeft: '10px' }
            },
            {
              tagName: 'button',
              textContent: 'Update Session Language',
              onclick: () => {
                // Cookie still requires manual JSON handling (strings only)
                const sessionPrefs = JSON.parse(userPreferencesApp.$sessionPrefs.get() || '{}');
                sessionPrefs.language = sessionPrefs.language === 'en' ? 'es' : 'en';
                userPreferencesApp.$sessionPrefs.set(JSON.stringify(sessionPrefs));
              },
              style: { marginLeft: '10px' }
            }
          ]
        }
      ]
    }
  ]
});

// Update display values periodically to show automatic serialization
function updateDisplay() {
  const cookieEl = document.getElementById('cookie-value');
  const sessionEl = document.getElementById('session-value');
  const localEl = document.getElementById('local-value');
  
  if (cookieEl) {
    // Cookie value is a string
    const cookieValue = userPreferencesApp.$sessionPrefs.get();
    cookieEl.textContent = cookieValue || 'null';
  }
  
  if (sessionEl) {
    // SessionStorage value is automatically deserialized to object
    const sessionValue = userPreferencesApp.$tempState.get();
    sessionEl.textContent = JSON.stringify(sessionValue, null, 2);
  }
  
  if (localEl) {
    // LocalStorage value is automatically deserialized to object
    const localValue = userPreferencesApp.$userSettings.get();
    localEl.textContent = JSON.stringify(localValue, null, 2);
  }
}

// Update display initially and on changes
updateDisplay();
setInterval(updateDisplay, 1000);

// Log initial storage state
console.log('Storage Demo App Created - Automatic Serialization');
console.log('Cookie value (string):', userPreferencesApp.$sessionPrefs.get());
console.log('Session storage (object):', userPreferencesApp.$tempState.get());
console.log('Local storage (object):', userPreferencesApp.$userSettings.get());
console.log('IndexedDB object:', userPreferencesApp.$userProfile.get());

// Example of accessing IndexedDB asynchronously
const dbObject = userPreferencesApp.$userProfile.get();
if (dbObject && typeof dbObject.get === 'function') {
  dbObject.get().then(userData => {
    console.log('IndexedDB user data:', userData);
  }).catch(err => {
    console.log('IndexedDB not available in this environment:', err.message);
  });
}

export { userPreferencesApp };