import { describe, test } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Debug Slot Creation', () => {
  test('can create slot element', () => {
    // Test if slot element can be created
    DDOM({
      document: {
        body: {
          children: [{
            tagName: 'div',
            id: 'test-div',
            children: [{
              tagName: 'slot',
              id: 'test-slot',
              textContent: 'Fallback content'
            }]
          }]
        }
      }
    });

    const testDiv = document.getElementById('test-div');
    const testSlot = document.getElementById('test-slot');
    console.log('Test div:', testDiv);
    console.log('Test div innerHTML:', testDiv ? testDiv.innerHTML : 'not found');
    console.log('Test slot:', testSlot);
    console.log('Test slot tagName:', testSlot ? testSlot.tagName : 'not found');
  });
});
