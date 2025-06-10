export default {
  document: {
    head: {
      title: 'Interactive Form Example'
    },
    body: {
      style: {
        fontFamily: 'Arial, sans-serif',
        padding: '2em',
        backgroundColor: '#f0f2f5',
        margin: '0'
      },
      children: [
        {
          tagName: 'h1',
          textContent: 'Interactive Form Example',
          style: {
            color: '#333',
            textAlign: 'center',
            marginBottom: '2em'
          }
        },
        {
          tagName: 'contact-form'
        }
      ]
    }
  },

  customElements: [
    {
      tagName: 'form-field',

      // properties
      $value: '',
      label: '',
      type: 'text',
      placeholder: '',
      validator: () => true, // Default validator always returns true
      errorMessage: '',
      rows: 1,

      // Computed validation
      get isValid() {
        const value = this.$value.get();
        return this.validator ? this.validator(value) : true;
      },

      get shouldShowError() {
        const value = this.$value.get();
        return value.length > 0 && !this.isValid;
      },

      get currentErrorMessage() {
        return this.shouldShowError ? this.errorMessage.get() : '';
      },

      // Computed properties for conditional rendering
      get isInputField() {
        return this.type !== 'textarea';
      },

      get isTextareaField() {
        return this.type === 'textarea';
      },

      // Methods
      updateValue: function (newValue) {
        this.$value.set(newValue);
        // Also update the parent's signal if it exists
        if (this.parentSignal) {
          this.parentSignal.set(newValue);
        }
      },

      // Set up parent signal binding when connected
      connectedCallback: function () {
        // Debug: log the properties to see what's actually set
        console.log('Form field connected with properties:', {
          label: this.label.get(),
          type: this.type.get(),
          placeholder: this.placeholder.get()
        });

        // Find and bind to parent form's corresponding signal
        const parentForm = this.closest('contact-form');
        if (parentForm) {
          if (this.type === 'text' && parentForm.$name) {
            this.parentSignal = parentForm.$name;
            // Sync initial value
            this.$value.set(parentForm.$name.get());
          } else if (this.type === 'email' && parentForm.$email) {
            this.parentSignal = parentForm.$email;
            this.$value.set(parentForm.$email.get());
          } else if (this.type === 'textarea' && parentForm.$message) {
            this.parentSignal = parentForm.$message;
            this.$value.set(parentForm.$message.get());
          }
        }

        // Set up reactive attributes for CSS styling
        DDOM.createEffect(() => {
          this.setAttribute('data-valid', this.isValid);
          this.setAttribute('data-show-error', this.shouldShowError);
          this.setAttribute('data-field-type', this.type);
          this.setAttribute('data-is-input', this.isInputField);
          this.setAttribute('data-is-textarea', this.isTextareaField);
        });
      },

      style: {
        display: 'block',
        marginBottom: '1.5em',

        // Validation styling
        '[data-valid="true"] .field-input': {
          borderColor: '#28a745'
        },
        '[data-valid="false"] .field-input': {
          borderColor: '#dc3545'
        },
        '[data-show-error="true"] .error-message': {
          opacity: '1'
        },
        '[data-show-error="false"] .error-message': {
          opacity: '0'
        },
        // Field type styling
        '[data-field-type="textarea"] .field-input': {
          resize: 'vertical'
        },
        '[data-field-type="text"] .field-input, [data-field-type="email"] .field-input': {
          resize: 'none'
        },
        // Conditional display using attributes
        '[data-is-input="false"] .input-field': {
          display: 'none'
        },
        '[data-is-textarea="false"] .textarea-field': {
          display: 'none'
        }
      },

      children: [
        {
          tagName: 'label',
          textContent: '${this.parentNode.label.get()}',
          style: {
            display: 'block',
            marginBottom: '0.5em',
            fontWeight: 'bold'
          }
        },
        {
          tagName: 'input',
          name: '${this.parentNode.label.get()}',
          type: '${this.parentNode.type.get()}',
          placeholder: '${this.parentNode.placeholder.get()}',
          value: '${this.parentNode.$value.get()}',
          className: 'field-input input-field',
          style: {
            width: '100%',
            padding: '0.75em',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1em'
          },
          oninput: function (e) {
            this.parentNode.updateValue(e.target.value);
          }
        },
        {
          tagName: 'textarea',
          name: '${this.parentNode.label.get()}',
          placeholder: '${this.parentNode.placeholder.get()}',
          value: '${this.parentNode.$value.get()}',
          rows: '${this.parentNode.rows.get()}',
          className: 'field-input textarea-field',
          style: {
            width: '100%',
            padding: '0.75em',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1em'
          },
          oninput: function (e) {
            this.parentNode.updateValue(e.target.value);
          }
        },
        {
          tagName: 'div',
          textContent: '${this.parentNode.currentErrorMessage}',
          className: 'error-message',
          style: {
            color: '#dc3545',
            fontSize: '0.875em',
            marginTop: '0.25em',
            minHeight: '1.2em',
            transition: 'opacity 0.2s ease'
          }
        }
      ]
    },

    {
      tagName: 'contact-form',

      // Reactive form data properties
      $name: '',
      $email: '',
      $message: '',

      // Form validation computed properties
      get isNameValid() {
        return this.$name.get().trim().length >= 2;
      },

      get isEmailValid() {
        const email = this.$email.get();
        return email.includes('@') && email.includes('.') && email.length > 5;
      },

      get isMessageValid() {
        return this.$message.get().trim().length >= 10;
      },

      get isFormValid() {
        return this.isNameValid && this.isEmailValid && this.isMessageValid;
      },

      get formData() {
        return {
          name: this.$name.get(),
          email: this.$email.get(),
          message: this.$message.get()
        };
      },

      // Form methods
      submitForm: function () {
        if (this.isFormValid) {
          alert(`Form submitted!\nName: ${this.formData.name.get()}\nEmail: ${this.formData.email.get()}\nMessage: ${this.formData.message.get()}`);
          this.resetForm();
        } else {
          alert('Please fill out all fields correctly before submitting.');
        }
      },

      resetForm: function () {
        this.$name.set('');
        this.$email.set('');
        this.$message.set('');
      },

      // Set up reactive attributes for CSS styling
      connectedCallback: function () {
        DDOM.createEffect(() => {
          this.setAttribute('data-form-valid', this.isFormValid);
        });
      },

      style: {
        display: 'block',
        maxWidth: '500px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2em',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',

        // Form validation styling using attributes
        '[data-form-valid="true"] .submit-button': {
          backgroundColor: '#28a745',
          cursor: 'pointer'
        },
        '[data-form-valid="false"] .submit-button': {
          backgroundColor: '#6c757d',
          cursor: 'not-allowed'
        },
        '[data-form-valid="true"] .form-status': {
          color: '#28a745'
        },
        '[data-form-valid="false"] .form-status': {
          color: '#dc3545'
        }
      },

      children: [
        {
          tagName: 'form-field',
          label: 'Name:',
          type: 'text',
          placeholder: 'Enter your name (minimum 2 characters)',
          validator: (value) => value.trim().length >= 2,
          errorMessage: 'Name must be at least 2 characters'
        },
        {
          tagName: 'form-field',
          label: 'Email:',
          type: 'email',
          placeholder: 'Enter your email address',
          validator: (value) => value.includes('@') && value.includes('.') && value.length > 5,
          errorMessage: 'Please enter a valid email address'
        },
        {
          tagName: 'form-field',
          label: 'Message:',
          type: 'textarea',
          rows: 4,
          placeholder: 'Enter your message (minimum 10 characters)',
          validator: (value) => value.trim().length >= 10,
          errorMessage: 'Message must be at least 10 characters'
        },
        {
          tagName: 'div',
          style: {
            display: 'flex',
            gap: '1em',
            justifyContent: 'space-between'
          },
          children: [
            {
              tagName: 'button',
              type: 'button',
              textContent: 'Submit Form',
              className: 'submit-button',
              style: {
                flex: '1',
                padding: '0.75em',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1em'
              },
              onclick: function () {
                this.parentNode.parentNode.submitForm();
              }
            },
            {
              tagName: 'button',
              type: 'button',
              textContent: 'Reset',
              style: {
                flex: '0 0 auto',
                padding: '0.75em 1.5em',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1em',
                cursor: 'pointer'
              },
              onclick: function () {
                this.parentNode.parentNode.resetForm();
              }
            }
          ]
        },
        {
          tagName: 'div',
          style: {
            marginTop: '1.5em',
            padding: '1em',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          },
          children: [
            {
              tagName: 'h4',
              textContent: 'Form Data (Live Preview):',
              style: {
                margin: '0 0 0.5em 0',
                color: '#495057'
              }
            },
            {
              tagName: 'div',
              style: { fontSize: '0.875em', color: '#6c757d' },
              children: [
                {
                  tagName: 'div',
                  value: function () {
                    // debug
                    console.log('this.value() called in live preview');
                    console.log('this: ', this);
                    const form = this.parentElement.parentElement.parentElement;
                    console.log('form: ', form);
                    console.log('form.$name: ', form.$name.get());
                    return form.$name;
                  },
                  textContent: 'Name: ${this.value().get()}'
                },
                {
                  tagName: 'div',
                  value: function () {
                    // debug
                    console.log('this.value() called in live preview');
                    return this.parentElement.parentElement.parentElement.$email;
                  },
                  textContent: 'Email: ${this.value().get()}'
                },
                {
                  tagName: 'div',
                  value: function () {
                    // debug
                    console.log('this.value() called in live preview');
                    return this.parentElement.parentElement.parentElement.$message;
                  },
                  textContent: 'Message: ${this.value().get()}'
                },
                {
                  tagName: 'div',
                  textContent: 'Valid: ${this.parentElement.parentElement.parentElement.isFormValid ? "Yes" : "No"}',
                  className: 'form-status',
                  style: {
                    marginTop: '0.5em',
                    fontWeight: 'bold'
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}