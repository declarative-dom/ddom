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

  test('should properly handle currentErrorMessage function', () => {
    // Test the specific currentErrorMessage function logic
    const mockFormField = {
      errorMessage: 'Test error message',
      valueSignal: {
        get: function() { return 'hi'; } // Only 2 characters, should be invalid
      },
      validator: (value) => value.length >= 5, // Requires 5+ characters
      shouldShowError: function() {
        const value = this.valueSignal.get();
        return value.length > 0 && !this.validator(value);
      },
      currentErrorMessage: function() {
        return this.shouldShowError() ? this.errorMessage : '';
      }
    };

    // Test that error message shows when shouldShowError is true
    // 'hi' has length 2, validator requires 5+, so should show error
    expect(mockFormField.shouldShowError()).toBe(true);
    expect(mockFormField.currentErrorMessage()).toBe('Test error message');

    // Test that error message is empty when valid
    mockFormField.valueSignal.get = function() { return 'valid input'; }; // 11 characters, should be valid
    expect(mockFormField.shouldShowError()).toBe(false);
    expect(mockFormField.currentErrorMessage()).toBe('');

    // Test that error message is empty when no input
    mockFormField.valueSignal.get = function() { return ''; };
    expect(mockFormField.shouldShowError()).toBe(false);
    expect(mockFormField.currentErrorMessage()).toBe('');
  });

  test('should create form field with proper error message handling', () => {
    const formFieldSpec = {
      customElements: [
        {
          tagName: 'form-field',
          label: 'Test Field',
          type: 'text',
          placeholder: 'Enter test value',
          validator: (value) => value.length >= 3,
          errorMessage: 'Field must be at least 3 characters',
          
          // Mock value signal for testing
          valueSignal: {
            get: function() { return 'hi'; }, // Invalid input (too short)
            set: function(value) { this._value = value; }
          },
          
          isValid: function() {
            if (!this.valueSignal || !this.valueSignal.get) return true;
            const value = this.valueSignal.get();
            if (typeof value !== 'string') return true;
            const validator = this.validator;
            return validator ? validator(value) : true;
          },

          shouldShowError: function() {
            if (!this.valueSignal || !this.valueSignal.get) return false;
            const value = this.valueSignal.get();
            if (typeof value !== 'string') return false;
            return value.length > 0 && !this.isValid();
          },

          currentErrorMessage: function() {
            return this.shouldShowError() ? this.errorMessage : '';
          },
          
          children: [
            {
              tagName: 'div',
              textContent: '${this.parentNode.currentErrorMessage()}',
              className: 'error-message'
            }
          ]
        }
      ],
      document: {
        body: {
          children: [
            {
              tagName: 'form-field'
            }
          ]
        }
      }
    };

    // Test that DDOM can process the form field with error message
    expect(() => DDOM(formFieldSpec)).not.toThrow();
  });

  test('should handle complete form error message scenarios', () => {
    // Test different error message scenarios for each field type
    const nameFieldTest = {
      errorMessage: 'Name must be at least 2 characters',
      validator: (value) => value.trim().length >= 2,
      valueSignal: { get: () => 'A' }, // Invalid
      shouldShowError: function() {
        const value = this.valueSignal.get();
        return value.length > 0 && !this.validator(value);
      },
      currentErrorMessage: function() {
        return this.shouldShowError() ? this.errorMessage : '';
      }
    };

    const emailFieldTest = {
      errorMessage: 'Please enter a valid email address',
      validator: (value) => value.includes('@') && value.includes('.') && value.length > 5,
      valueSignal: { get: () => 'invalid-email' }, // Invalid
      shouldShowError: function() {
        const value = this.valueSignal.get();
        return value.length > 0 && !this.validator(value);
      },
      currentErrorMessage: function() {
        return this.shouldShowError() ? this.errorMessage : '';
      }
    };

    const messageFieldTest = {
      errorMessage: 'Message must be at least 10 characters',
      validator: (value) => value.trim().length >= 10,
      valueSignal: { get: () => 'Short' }, // Invalid
      shouldShowError: function() {
        const value = this.valueSignal.get();
        return value.length > 0 && !this.validator(value);
      },
      currentErrorMessage: function() {
        return this.shouldShowError() ? this.errorMessage : '';
      }
    };

    // Test that all fields show appropriate error messages
    expect(nameFieldTest.currentErrorMessage()).toBe('Name must be at least 2 characters');
    expect(emailFieldTest.currentErrorMessage()).toBe('Please enter a valid email address');
    expect(messageFieldTest.currentErrorMessage()).toBe('Message must be at least 10 characters');

    // Test that error messages clear when fields become valid
    nameFieldTest.valueSignal.get = () => 'John Doe';
    emailFieldTest.valueSignal.get = () => 'test@example.com';
    messageFieldTest.valueSignal.get = () => 'This is a valid message';

    expect(nameFieldTest.currentErrorMessage()).toBe('');
    expect(emailFieldTest.currentErrorMessage()).toBe('');
    expect(messageFieldTest.currentErrorMessage()).toBe('');
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