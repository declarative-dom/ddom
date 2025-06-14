import { describe, test, expect, beforeEach } from 'vitest';
import { adoptWindow } from '../lib/dist/index.js';

describe('Interactive Form Example', () => {
  beforeEach(() => {
    // Clear document body
    document.body.innerHTML = '';
  });

  test('should create interactive form with reactive properties', () => {
    const spec = {
      form: {
        name: '',
        email: '',
        age: 0,
        newsletter: false
      },
      validation: {
        nameValid: false,
        emailValid: false,
        ageValid: false
      }
    };

    adoptWindow(spec);

    expect(window.form).toBeDefined();
    expect(window.form.name).toBe('');
    expect(window.form.email).toBe('');
    expect(window.form.age).toBe(0);
    expect(window.form.newsletter).toBe(false);

    expect(window.validation).toBeDefined();
    expect(window.validation.nameValid).toBe(false);
    expect(window.validation.emailValid).toBe(false);
    expect(window.validation.ageValid).toBe(false);
  });

  test('should handle form field updates', () => {
    const spec = {
      formData: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
      },
      updateField: function(field, value) {
        this.formData[field] = value;
      }
    };

    adoptWindow(spec);

    expect(window.formData.firstName).toBe('');
    expect(window.formData.email).toBe('');

    // Test field updates
    window.formData.firstName = 'John';
    window.formData.lastName = 'Doe';
    window.formData.email = 'john@example.com';

    expect(window.formData.firstName).toBe('John');
    expect(window.formData.lastName).toBe('Doe');
    expect(window.formData.email).toBe('john@example.com');

    // Test update method
    if (typeof window.updateField === 'function') {
      window.updateField('phone', '123-456-7890');
      expect(window.formData.phone).toBe('123-456-7890');
    }
  });

  test('should handle form validation', () => {
    const spec = {
      form: {
        name: '',
        email: '',
        age: 0
      },
      validateName: function(name) {
        return name && name.length >= 2;
      },
      validateEmail: function(email) {
        return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      validateAge: function(age) {
        return age && age >= 13 && age <= 120;
      },
      get isFormValid() {
        return this.validateName(this.form.name) && 
               this.validateEmail(this.form.email) && 
               this.validateAge(this.form.age);
      }
    };

    adoptWindow(spec);

    // Test initial state
    expect(window.isFormValid).toBe(false);

    // Test validation functions
    expect(window.validateName('John')).toBe(true);
    expect(window.validateName('J')).toBe(false);
    expect(window.validateName('')).toBe(false);

    expect(window.validateEmail('john@example.com')).toBe(true);
    expect(window.validateEmail('invalid-email')).toBe(false);
    expect(window.validateEmail('')).toBe(false);

    expect(window.validateAge(25)).toBe(true);
    expect(window.validateAge(5)).toBe(false);
    expect(window.validateAge(150)).toBe(false);

    // Test form validation with valid data
    window.form.name = 'John Doe';
    window.form.email = 'john@example.com';
    window.form.age = 25;

    expect(window.isFormValid).toBe(true);
  });

  test('should handle checkbox and radio button states', () => {
    const spec = {
      preferences: {
        newsletter: false,
        sms: false,
        notifications: true
      },
      selectedColor: 'blue',
      colors: ['red', 'green', 'blue', 'yellow'],
      togglePreference: function(pref) {
        this.preferences[pref] = !this.preferences[pref];
      }
    };

    adoptWindow(spec);

    expect(window.preferences.newsletter).toBe(false);
    expect(window.preferences.sms).toBe(false);
    expect(window.preferences.notifications).toBe(true);
    expect(window.selectedColor).toBe('blue');

    // Test toggle function
    if (typeof window.togglePreference === 'function') {
      window.togglePreference('newsletter');
      expect(window.preferences.newsletter).toBe(true);

      window.togglePreference('notifications');
      expect(window.preferences.notifications).toBe(false);
    }

    // Test direct updates
    window.selectedColor = 'red';
    expect(window.selectedColor).toBe('red');
  });

  test('should handle select dropdown states', () => {
    const spec = {
      selectedCountry: 'US',
      countries: [
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' },
        { code: 'UK', name: 'United Kingdom' }
      ],
      selectedCategory: 'general',
      categories: ['general', 'technical', 'billing', 'support']
    };

    adoptWindow(spec);

    expect(window.selectedCountry).toBe('US');
    expect(window.selectedCategory).toBe('general');
    expect(Array.isArray(window.countries)).toBe(true);
    expect(window.countries.length).toBe(3);
    expect(Array.isArray(window.categories)).toBe(true);
    expect(window.categories.length).toBe(4);

    // Test selection updates
    window.selectedCountry = 'CA';
    window.selectedCategory = 'technical';

    expect(window.selectedCountry).toBe('CA');
    expect(window.selectedCategory).toBe('technical');
  });

  test('should handle form submission', () => {
    let submittedData = null;
    let submissionCount = 0;

    const spec = {
      form: {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      },
      isSubmitting: false,
      submitForm: function() {
        this.isSubmitting = true;
        submittedData = { ...this.form };
        submissionCount++;
        
        // Simulate async submission
        setTimeout(() => {
          this.isSubmitting = false;
        }, 100);
      },
      resetForm: function() {
        this.form.name = '';
        this.form.email = '';
        this.form.message = '';
      }
    };

    adoptWindow(spec);

    expect(window.isSubmitting).toBe(false);

    // Test form submission
    if (typeof window.submitForm === 'function') {
      window.submitForm();
      expect(window.isSubmitting).toBe(true);
      expect(submissionCount).toBe(1);
      expect(submittedData).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      });
    }

    // Test form reset
    if (typeof window.resetForm === 'function') {
      window.resetForm();
      expect(window.form.name).toBe('');
      expect(window.form.email).toBe('');
      expect(window.form.message).toBe('');
    }
  });

  test('should handle form error states', () => {
    const spec = {
      form: {
        email: '',
        password: '',
        confirmPassword: ''
      },
      errors: {
        email: '',
        password: '',
        confirmPassword: ''
      },
      validateForm: function() {
        this.errors.email = this.form.email ? '' : 'Email is required';
        this.errors.password = this.form.password.length >= 8 ? '' : 'Password must be at least 8 characters';
        this.errors.confirmPassword = this.form.password === this.form.confirmPassword ? '' : 'Passwords do not match';
      },
      get hasErrors() {
        return Object.values(this.errors).some(error => error !== '');
      }
    };

    adoptWindow(spec);

    // Test initial state
    expect(window.hasErrors).toBe(false);

    // Test validation with errors
    if (typeof window.validateForm === 'function') {
      window.validateForm();
      expect(window.errors.email).toBe('Email is required');
      expect(window.errors.password).toBe('Password must be at least 8 characters');
      expect(window.hasErrors).toBe(true);

      // Fix email error
      window.form.email = 'test@example.com';
      window.validateForm();
      expect(window.errors.email).toBe('');

      // Fix password error
      window.form.password = 'password123';
      window.validateForm();
      expect(window.errors.password).toBe('');

      // Test password confirmation
      window.form.confirmPassword = 'different';
      window.validateForm();
      expect(window.errors.confirmPassword).toBe('Passwords do not match');

      window.form.confirmPassword = 'password123';
      window.validateForm();
      expect(window.errors.confirmPassword).toBe('');
      expect(window.hasErrors).toBe(false);
    }
  });

  test('should handle dynamic form fields', () => {
    const spec = {
      formFields: [
        { id: 'name', type: 'text', label: 'Name', required: true },
        { id: 'email', type: 'email', label: 'Email', required: true }
      ],
      formData: {},
      addField: function(field) {
        this.formFields.push(field);
      },
      removeField: function(id) {
        this.formFields = this.formFields.filter(field => field.id !== id);
        delete this.formData[id];
      },
      updateFieldValue: function(id, value) {
        this.formData[id] = value;
      }
    };

    adoptWindow(spec);

    expect(window.formFields.length).toBe(2);
    expect(window.formFields[0].id).toBe('name');
    expect(window.formFields[1].id).toBe('email');

    // Test adding a field
    if (typeof window.addField === 'function') {
      window.addField({ id: 'phone', type: 'tel', label: 'Phone', required: false });
      expect(window.formFields.length).toBe(3);
      expect(window.formFields[2].id).toBe('phone');
    }

    // Test updating field values
    if (typeof window.updateFieldValue === 'function') {
      window.updateFieldValue('name', 'John Doe');
      window.updateFieldValue('email', 'john@example.com');
      expect(window.formData.name).toBe('John Doe');
      expect(window.formData.email).toBe('john@example.com');
    }

    // Test removing a field
    if (typeof window.removeField === 'function') {
      window.removeField('phone');
      expect(window.formFields.length).toBe(2);
      expect(window.formData.phone).toBeUndefined();
    }
  });

  test('should handle form with nested objects', () => {
    const spec = {
      user: {
        personal: {
          firstName: '',
          lastName: '',
          dateOfBirth: ''
        },
        contact: {
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            zipCode: ''
          }
        }
      },
      updatePersonal: function(field, value) {
        this.user.personal[field] = value;
      },
      updateContact: function(field, value) {
        this.user.contact[field] = value;
      },
      updateAddress: function(field, value) {
        this.user.contact.address[field] = value;
      }
    };

    adoptWindow(spec);

    expect(window.user.personal.firstName).toBe('');
    expect(window.user.contact.email).toBe('');
    expect(window.user.contact.address.street).toBe('');

    // Test nested updates
    window.user.personal.firstName = 'John';
    window.user.personal.lastName = 'Doe';
    window.user.contact.email = 'john@example.com';
    window.user.contact.address.street = '123 Main St';

    expect(window.user.personal.firstName).toBe('John');
    expect(window.user.personal.lastName).toBe('Doe');
    expect(window.user.contact.email).toBe('john@example.com');
    expect(window.user.contact.address.street).toBe('123 Main St');

    // Test update methods
    if (typeof window.updatePersonal === 'function') {
      window.updatePersonal('dateOfBirth', '1990-01-15');
      expect(window.user.personal.dateOfBirth).toBe('1990-01-15');
    }

    if (typeof window.updateAddress === 'function') {
      window.updateAddress('city', 'New York');
      window.updateAddress('zipCode', '10001');
      expect(window.user.contact.address.city).toBe('New York');
      expect(window.user.contact.address.zipCode).toBe('10001');
    }
  });
});