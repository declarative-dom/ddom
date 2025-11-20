import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Slot Support in Custom Elements', () => {
  beforeEach(() => {
    // Clean up any custom elements from previous tests
    document.body.innerHTML = '';
  });

  test('should support default slot in custom element template', () => {
    // Define a custom element with a default slot
    DDOM({
      customElements: [{
        tagName: 'card-component',
        children: [
          {
            tagName: 'div',
            className: 'card-header',
            children: [
              {
                tagName: 'h2',
                textContent: 'Card Title'
              }
            ]
          },
          {
            tagName: 'div',
            className: 'card-body',
            children: [
              {
                tagName: 'slot' // Default slot - should receive any child content
              }
            ]
          }
        ]
      }]
    });

    // Use the custom element with slotted content
    DDOM({
      document: {
        body: {
          children: [
            {
              tagName: 'card-component',
              children: [
                {
                  tagName: 'p',
                  textContent: 'This is slotted content'
                }
              ]
            }
          ]
        }
      }
    });

    // Wait for custom element to be initialized
    const card = document.querySelector('card-component');
    expect(card).toBeTruthy();

    // The slotted content should be projected into the slot
    const slottedParagraph = card.querySelector('p');
    expect(slottedParagraph).toBeTruthy();
    expect(slottedParagraph.textContent).toBe('This is slotted content');
  });

  test('should support named slots in custom element template', () => {
    // Define a custom element with named slots
    DDOM({
      customElements: [{
        tagName: 'panel-component',
        children: [
          {
            tagName: 'header',
            children: [
              {
                tagName: 'slot',
                attributes: { name: 'header' }
              }
            ]
          },
          {
            tagName: 'main',
            children: [
              {
                tagName: 'slot' // Default slot
              }
            ]
          },
          {
            tagName: 'footer',
            children: [
              {
                tagName: 'slot',
                attributes: { name: 'footer' }
              }
            ]
          }
        ]
      }]
    });

    // Use the custom element with named slotted content
    DDOM({
      document: {
        body: {
          children: [
            {
              tagName: 'panel-component',
              children: [
                {
                  tagName: 'h1',
                  attributes: { slot: 'header' },
                  textContent: 'Panel Header'
                },
                {
                  tagName: 'p',
                  textContent: 'Main content'
                },
                {
                  tagName: 'small',
                  attributes: { slot: 'footer' },
                  textContent: 'Panel Footer'
                }
              ]
            }
          ]
        }
      }
    });

    const panel = document.querySelector('panel-component');
    expect(panel).toBeTruthy();

    // Check that content is projected to the correct slots
    const headerSlot = panel.querySelector('header slot[name="header"]');
    const footerSlot = panel.querySelector('footer slot[name="footer"]');
    const defaultSlot = panel.querySelector('main slot:not([name])');

    expect(headerSlot).toBeTruthy();
    expect(footerSlot).toBeTruthy();
    expect(defaultSlot).toBeTruthy();
  });

  test('should show fallback content when no slotted content provided', () => {
    // Define a custom element with fallback content in slot
    DDOM({
      customElements: [{
        tagName: 'button-component',
        children: [
          {
            tagName: 'button',
            children: [
              {
                tagName: 'slot',
                children: [
                  {
                    tagName: 'span',
                    textContent: 'Default Button Text'
                  }
                ]
              }
            ]
          }
        ]
      }]
    });

    // Use the custom element without providing slotted content
    DDOM({
      document: {
        body: {
          children: [
            {
              tagName: 'button-component'
            }
          ]
        }
      }
    });

    const buttonComponent = document.querySelector('button-component');
    expect(buttonComponent).toBeTruthy();

    // The fallback content should be displayed
    const slot = buttonComponent.querySelector('slot');
    expect(slot).toBeTruthy();
    
    const fallbackSpan = slot.querySelector('span');
    expect(fallbackSpan).toBeTruthy();
    expect(fallbackSpan.textContent).toBe('Default Button Text');
  });

  test('should replace fallback content when slotted content is provided', () => {
    // Define a custom element with fallback content
    DDOM({
      customElements: [{
        tagName: 'greeting-component',
        children: [
          {
            tagName: 'div',
            children: [
              {
                tagName: 'slot',
                children: [
                  {
                    tagName: 'span',
                    textContent: 'Hello, Guest!'
                  }
                ]
              }
            ]
          }
        ]
      }]
    });

    // Use the custom element with slotted content
    DDOM({
      document: {
        body: {
          children: [
            {
              tagName: 'greeting-component',
              children: [
                {
                  tagName: 'strong',
                  textContent: 'Hello, John!'
                }
              ]
            }
          ]
        }
      }
    });

    const greeting = document.querySelector('greeting-component');
    expect(greeting).toBeTruthy();

    // The slotted content should be used instead of fallback
    const slot = greeting.querySelector('slot');
    expect(slot).toBeTruthy();
    
    // Check for the slotted content
    const slottedStrong = greeting.querySelector('strong');
    expect(slottedStrong).toBeTruthy();
    expect(slottedStrong.textContent).toBe('Hello, John!');
  });
});
