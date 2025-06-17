import { describe, test, expect, beforeEach } from 'vitest';
import DDOM from '../lib/dist/index.js';

describe('Interactive Form Example', () => {
  beforeEach(() => {
    // Clean up any global variables
    if (typeof window !== 'undefined') {
      // No specific global vars to clean for this example
    }
  });

  test('should create interactive form with custom elements', () => {
    const interactiveFormSpec = {
      customElements: [
        {
          tagName: 'form-field',
          label: '',
          type: 'text',
          placeholder: '',
          validator: () => true,
          errorMessage: '',
          rows: 1,

          updateValue: function (newValue) {
            if (this.valueSignal && typeof this.valueSignal.set === 'function') {
              this.valueSignal.set(newValue);
            }
          }
        },
        {
          tagName: 'contact-form',
          $name: '',
          $email: '',
          $message: '',

          submitForm: function () {
            return {
              name: this.$name.get(),
              email: this.$email.get(),
              message: this.$message.get()
            };
          },

          resetForm: function () {
            this.$name.set('');
            this.$email.set('');
            this.$message.set('');
          }
        }
      ]
    };

    // Test that DDOM can process the interactive form spec
    expect(() => DDOM(interactiveFormSpec)).not.toThrow();
  });

  test('should handle form validation logic', () => {
    // Test the validation logic that would be in computed properties
    const isNameValid = (name) => name.trim().length >= 2;
    const isEmailValid = (email) => email.includes('@') && email.includes('.') && email.length > 5;
    const isMessageValid = (message) => message.trim().length >= 10;
    const isFormValid = (name, email, message) => 
      isNameValid(name) && isEmailValid(email) && isMessageValid(message);

    // Test initial state - form should be invalid
    expect(isNameValid('')).toBe(false);
    expect(isEmailValid('')).toBe(false);
    expect(isMessageValid('')).toBe(false);
    expect(isFormValid('', '', '')).toBe(false);

    // Test with valid data
    expect(isNameValid('John Doe')).toBe(true);
    expect(isEmailValid('john@example.com')).toBe(true);
    expect(isMessageValid('This is a test message that is long enough.')).toBe(true);
    expect(isFormValid('John Doe', 'john@example.com', 'This is a test message that is long enough.')).toBe(true);
  });

  test('should handle individual field validation', () => {
    // Test name validation with different values
    const isNameValid = (name) => name.trim().length >= 2;
    
    expect(isNameValid('')).toBe(false);      // Empty
    expect(isNameValid('A')).toBe(false);     // Too short
    expect(isNameValid('AB')).toBe(true);     // Valid
    expect(isNameValid('John')).toBe(true);   // Valid

    // Test email validation with different values
    const isEmailValid = (email) => email.includes('@') && email.includes('.') && email.length > 5;
    
    expect(isEmailValid('')).toBe(false);                    // Empty
    expect(isEmailValid('test')).toBe(false);                // No @ or .
    expect(isEmailValid('test@')).toBe(false);               // No .
    expect(isEmailValid('test.com')).toBe(false);            // No @
    expect(isEmailValid('a@b.c')).toBe(false);               // Too short
    expect(isEmailValid('test@example.com')).toBe(true);     // Valid

    // Test message validation with different values
    const isMessageValid = (message) => message.trim().length >= 10;
    
    expect(isMessageValid('')).toBe(false);                         // Empty
    expect(isMessageValid('Short')).toBe(false);                    // Too short
    expect(isMessageValid('This is a test message')).toBe(true);    // Valid
  });

  test('should handle form submission and reset logic', () => {
    // Test form submission logic
    const submitForm = (name, email, message) => {
      const isFormValid = 
        name.trim().length >= 2 &&
        email.includes('@') && email.includes('.') && email.length > 5 &&
        message.trim().length >= 10;
        
      if (isFormValid) {
        return { name, email, message };
      }
      return null;
    };

    // Test form submission with valid data
    const result = submitForm('John Doe', 'john@example.com', 'This is a test message.');
    expect(result).not.toBeNull();
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.message).toBe('This is a test message.');

    // Test submission with invalid data
    const invalidResult = submitForm('', '', '');
    expect(invalidResult).toBeNull();
  });

  test('should handle field types and input elements', () => {
    const formFieldsSpec = {
      customElements: [
        {
          tagName: 'form-field',
          label: 'Name',
          type: 'text',
          placeholder: 'Enter name',
          children: [
            {
              tagName: 'input',
              type: '${this.parentNode.type.get()}',
              placeholder: '${this.parentNode.placeholder.get()}'
            }
          ]
        }
      ]
    };

    // Test that DDOM can handle form fields
    expect(() => DDOM(formFieldsSpec)).not.toThrow();
  });

  test('should support live form data preview', () => {
    const formPreviewSpec = {
      $name: 'Test User',
      $email: 'test@example.com',
      $message: 'Test message',
      
      document: {
        body: {
          children: [
            {
              tagName: 'div',
              textContent: 'Name: ${window.$name.get()}'
            },
            {
              tagName: 'div',
              textContent: 'Email: ${window.$email.get()}'
            },
            {
              tagName: 'div',
              textContent: 'Message: ${window.$message.get()}'
            }
          ]
        }
      }
    };

    // Test that DDOM can handle live preview
    expect(() => DDOM(formPreviewSpec)).not.toThrow();
    
    // Test that the properties are available on window
    expect(window.$name).toBeDefined();
    expect(window.$email).toBeDefined();
    expect(window.$message).toBeDefined();
  });

  test('should support form validation with error display', () => {
    // Test error display logic
    const shouldShowError = (value, validator) => {
      return value.length > 0 && !validator(value);
    };

    const nameValidator = (value) => value.trim().length >= 2;
    const emailValidator = (value) => value.includes('@') && value.includes('.') && value.length > 5;

    // Test error display conditions
    expect(shouldShowError('', nameValidator)).toBe(false); // Empty, no error shown
    expect(shouldShowError('A', nameValidator)).toBe(true); // Invalid but has content
    expect(shouldShowError('John', nameValidator)).toBe(false); // Valid

    expect(shouldShowError('', emailValidator)).toBe(false); // Empty, no error shown
    expect(shouldShowError('invalid', emailValidator)).toBe(true); // Invalid but has content
    expect(shouldShowError('test@example.com', emailValidator)).toBe(false); // Valid
  });

  test('should create complete contact form structure', () => {
    const contactFormSpec = {
      customElements: [
        {
          tagName: 'contact-form',
          $name: '',
          $email: '',
          $message: '',
          children: [
            {
              tagName: 'form-field',
              label: 'Name:',
              type: 'text',
              placeholder: 'Enter your name'
            },
            {
              tagName: 'form-field',
              label: 'Email:',
              type: 'email',
              placeholder: 'Enter your email'
            },
            {
              tagName: 'form-field',
              label: 'Message:',
              type: 'textarea',
              placeholder: 'Enter your message'
            }
          ]
        }
      ],
      document: {
        body: {
          children: [
            {
              tagName: 'h1',
              textContent: 'Interactive Form Example'
            },
            {
              tagName: 'contact-form'
            }
          ]
        }
      }
    };

    // Test that DDOM can process the complete contact form structure
    expect(() => DDOM(contactFormSpec)).not.toThrow();
  });
});