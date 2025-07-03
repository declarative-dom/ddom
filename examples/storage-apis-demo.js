/**
 * Storage APIs Example
 * Demonstrates the use of Cookie, SessionStorage, LocalStorage, and IndexedDB namespaces
 */

import { createElement } from '../lib/dist/index.js';

// Example: User preferences management with multiple storage types
const userPreferencesApp = createElement({
  tagName: 'div',
  id: 'preferences-app',
  
  // Cookie for temporary session preferences
  $sessionPrefs: {
    Cookie: {
      name: 'sessionPrefs',
      value: JSON.stringify({ theme: 'auto', language: 'en' }),
      maxAge: 3600 // 1 hour
    }
  },
  
  // SessionStorage for temporary app state
  $tempState: {
    SessionStorage: {
      key: 'tempAppState',
      value: {
        lastVisited: new Date().toISOString(),
        pageViews: 0
      }
    }
  },
  
  // LocalStorage for persistent user settings
  $userSettings: {
    LocalStorage: {
      key: 'userSettings',
      value: {
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
      textContent: 'Storage APIs Demo'
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
            <h3>Session Cookie (expires in 1 hour):</h3>
            <pre id="cookie-value">${JSON.stringify(JSON.parse('${this.$sessionPrefs.get()}' || '{}'), null, 2)}</pre>
            
            <h3>Session Storage (cleared on tab close):</h3>
            <pre id="session-value">${JSON.stringify('${this.$tempState.get()}', null, 2)}</pre>
            
            <h3>Local Storage (persistent):</h3>
            <pre id="local-value">${JSON.stringify('${this.$userSettings.get()}', null, 2)}</pre>
            
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
                const settings = userPreferencesApp.$userSettings.get();
                settings.theme = settings.theme === 'light' ? 'dark' : 'light';
                userPreferencesApp.$userSettings.set(settings);
              }
            },
            {
              tagName: 'button',
              textContent: 'Increment Page Views',
              onclick: () => {
                const tempState = userPreferencesApp.$tempState.get();
                tempState.pageViews = (tempState.pageViews || 0) + 1;
                userPreferencesApp.$tempState.set(tempState);
              },
              style: { marginLeft: '10px' }
            },
            {
              tagName: 'button',
              textContent: 'Update Session Language',
              onclick: () => {
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

// Log initial storage state
console.log('Storage Demo App Created');
console.log('Cookie value:', userPreferencesApp.$sessionPrefs.get());
console.log('Session storage:', userPreferencesApp.$tempState.get());
console.log('Local storage:', userPreferencesApp.$userSettings.get());
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