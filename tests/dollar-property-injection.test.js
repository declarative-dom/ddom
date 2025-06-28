import { describe, test, expect, beforeEach } from 'vitest';
import DDOM, { createElement } from '../lib/dist/index.js';

describe('Reactive Property Injection', () => {
  beforeEach(() => {
    // Clean up any global variables
    document.body.innerHTML = '';
    if (typeof window !== 'undefined') {
      // Clean up any test properties
      Object.keys(window).forEach((key) => {
        if (key.startsWith('test') || key.startsWith('$')) {
          delete window[key];
        }
      });
    }
    // Use fake timers to control microtask execution
    vi.useFakeTimers({ toFake: ['nextTick', 'queueMicrotask'] });
  });

  afterEach(() => {
    // Clean up fake timers after each test
    vi.useRealTimers();
  });

  test('should inject scope properties into template literals', () => {
    const spec = {
      $name: 'Alice',
      $age: 30,
      document: {
        body: {
          children: [
            {
              tagName: 'div',
              id: 'template-test',
              textContent:
                'Hello ${$name.get()}, you are ${$age.get()} years old!',
            },
          ],
        },
      },
    };

    DDOM(spec);

    const element = document.getElementById('template-test');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Hello Alice, you are 30 years old!');
  });

  test('should inject scope properties into functions', () => {
    let clickedName = null;

    const spec = {
      $userName: 'Bob',
      $userAge: 25,
      document: {
        body: {
          children: [
            {
              tagName: 'button',
              id: 'function-test',
              onclick: function (event) {
                clickedName = $userName.get() + ' (' + $userAge.get() + ')';
              },
            },
          ],
        },
      },
    };

    DDOM(spec);

    const button = document.getElementById('function-test');
    expect(button).toBeDefined();

    // Simulate a click
    button.click();
    expect(clickedName).toBe('Bob (25)');
  });

  test('should inject scope properties into getters', () => {
    const spec = {
      $firstName: 'John',
      $lastName: 'Doe',
      document: {
        body: {
          children: [
            {
              tagName: 'div',
              id: 'getter-test',
              fullName: function () {
                return `${$firstName.get()} ${$lastName.get()}`;
              },
            },
          ],
        },
      },
    };

    DDOM(spec);

    const element = document.getElementById('getter-test');
    expect(element).toBeDefined();
    expect(element.fullName()).toBe('John Doe');
  });

  test('should inject scope properties into attributes', () => {
    const spec = {
      $theme: 'dark',
      $size: 'large',
      document: {
        body: {
          children: [
            {
              tagName: 'div',
              id: 'attribute-test',
              attributes: {
                'data-theme': '${window.$theme.get()}',
                'data-size': '${window.$size.get()}',
                class:
                  'component theme-${window.$theme.get()} size-${window.$size.get()}',
              },
            },
          ],
        },
      },
    };

    DDOM(spec);

    const element = document.getElementById('attribute-test');
    expect(element).toBeDefined();
    expect(element.getAttribute('data-theme')).toBe('dark');
    expect(element.getAttribute('data-size')).toBe('large');
    expect(element.getAttribute('class')).toBe(
      'component theme-dark size-large'
    );
  });

  test('debug custom element', () => {
    const spec = {
      customElements: [
        {
          tagName: 'debug-card',
          $userName: 'Carol',
          $userRole: 'Admin',
          displayText: function () {
            console.log('Custom element getter - this:', this);
            console.log('Custom element $userName:', this.$userName.get());
            console.log(
              'Global $userName:',
              typeof globalThis !== 'undefined'
                ? globalThis.$userName
                : 'undefined'
            );
            return `${$userName.get()} - ${$userRole.get()}`;
          },
        },
      ],
      document: {
        body: {
          children: [
            {
              tagName: 'debug-card',
              id: 'debug-custom-element',
            },
          ],
        },
      },
    };

    DDOM(spec);

    const element = document.getElementById('debug-custom-element');
    console.log('Element:', element);
    console.log(
      'Element $userName:',
      element ? element.$userName : 'element is null'
    );
    console.log(
      'Element displayText:',
      element && 'displayText' in element ? element.displayText : 'undefined'
    );

    expect(element).toBeDefined();
  });

  test('should work with custom elements', () => {
    const spec = {
      customElements: [
        {
          tagName: 'user-card',
          $userName: 'Carol',
          $userRole: 'Admin',
          textContent: '${this.$userName.get()} (${this.$userRole.get()})',
        },
      ],
      document: {
        body: {
          children: [
            {
              tagName: 'user-card',
              id: 'custom-element-test',
            },
          ],
        },
      },
    };

    DDOM(spec);

    vi.runAllTicks(); // Flush microtasks (including reactive effects)
    const element = document.getElementById('custom-element-test');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Carol (Admin)');
  });

  test('should handle complex nested structures', () => {
    const spec = {
      $appName: 'My App',
      $version: '1.0.0',
      $author: 'Developer',
      document: {
        body: {
          children: [
            {
              tagName: 'header',
              id: 'app-header',
              textContent: '${$appName.get()} v${$version.get()}',
              children: [
                {
                  tagName: 'small',
                  textContent: 'by ${$author.get()}',
                  fullCredits: function () {
                    return `${$appName.get()} v${$version.get()} by ${$author.get()}`;
                  },
                },
              ],
            },
          ],
        },
      },
    };

    DDOM(spec);

    const header = document.getElementById('app-header');
    expect(header).toBeDefined();
    expect(header.textContent).toContain('My App v1.0.0');

    const small = header.querySelector('small');
    expect(small).toBeDefined();
    expect(small.textContent).toBe('by Developer');
    expect(small.fullCredits()).toBe('My App v1.0.0 by Developer');
  });

  test('should work without scope properties (backward compatibility)', () => {
    const spec = {
      regularProp: 'test',
      document: {
        body: {
          children: [
            {
              tagName: 'div',
              id: 'no-reactive-test',
              textContent: 'Regular text',
            },
          ],
        },
      },
    };

    expect(() => DDOM(spec)).not.toThrow();

    const element = document.getElementById('no-reactive-test');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Regular text');
  });

  test('should handle signal values in scope properties', () => {
    const spec = {
      $counter: 0,
      document: {
        body: {
          children: [
            {
              tagName: 'div',
              id: 'signal-test',
              textContent: 'Count: ${$counter.get()}',
              onclick: function () {
                // Access the signal and update it
                if (typeof $counter === 'object' && 'set' in $counter) {
                  $counter.set($counter.get() + 1);
                }
              },
            },
          ],
        },
      },
    };

    DDOM(spec);

    const element = document.getElementById('signal-test');
    expect(element).toBeDefined();
    expect(element.textContent).toBe('Count: 0');

    // The counter should be available as a signal
    expect(window.$counter).toBeDefined();
  });
});
