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

      // Props passed from parent
      label: '',
      type: 'text',
      placeholder: '',
      validator: () => true, // Default validator always returns true
      errorMessage: '',
      rows: 1,

      // Computed validation using the passed signal
      isValid: function() {
        if (!this.valueSignal || !DDOM.Signal.isState(this.valueSignal)) return true;
        const value = this.valueSignal.get();
        if (typeof value !== 'string') return true; // No validation if not a string
        const validator = this.validator;
        return validator ? validator(value) : true;
      },

      shouldShowError: function() {
        if (!this.valueSignal || !DDOM.Signal.isState(this.valueSignal)) return false;
        const value = this.valueSignal.get();
        if (typeof value !== 'string') return false;
        return value.length > 0 && !this.isValid();
      },

      currentErrorMessage: function() {
        return this.shouldShowError() ? this.errorMessage : '';
      },

      // Computed functions for conditional rendering
      isInputField: function() {
        return this.type.get() !== 'textarea';
      },

      isTextareaField: function() {
        return this.type.get() === 'textarea';
      },

      // Methods
      updateValue: function (newValue) {
        // Direct signal binding - update the signal directly
        if (this.valueSignal && DDOM.Signal.isState(this.valueSignal)) {
          this.valueSignal.set(newValue);
        }
      },

      connectedCallback: function () {
        // Set up reactive attributes for CSS styling  
        DDOM.createEffect(() => {
          this.setAttribute('data-valid', this.isValid());
          this.setAttribute('data-show-error', this.shouldShowError());
          this.setAttribute('data-field-type', this.type.get());
          this.setAttribute('data-is-input', this.isInputField());
          this.setAttribute('data-is-textarea', this.isTextareaField());
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
          value: '${(this.parentNode.valueSignal && this.parentNode.valueSignal.get()) ? this.parentNode.valueSignal.get() : ""}',
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
          value: '${(this.parentNode.valueSignal && this.parentNode.valueSignal.get()) ? this.parentNode.valueSignal.get() : ""}',
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
          textContent: '${this.parentNode.currentErrorMessage()}',
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

      // Form validation computed functions
      isNameValid: function() {
        return this.$name.get().trim().length >= 2;
      },

      isEmailValid: function() {
        const email = this.$email.get();
        return email.includes('@') && email.includes('.') && email.length > 5;
      },

      isMessageValid: function() {
        return this.$message.get().trim().length >= 10;
      },

      isFormValid: function() {
        return this.isNameValid() && this.isEmailValid() && this.isMessageValid();
      },

      // Form methods
      submitForm: function () {
        if (this.isFormValid()) {
          alert(`Form submitted!\nName: ${this.$name.get()}\nEmail: ${this.$email.get()}\nMessage: ${this.$message.get()}`);
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
          this.setAttribute('data-form-valid', this.isFormValid());
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
          errorMessage: 'Name must be at least 2 characters',
          valueSignal: 'this.parentNode.$name'
        },
        {
          tagName: 'form-field',
          label: 'Email:',
          type: 'email',
          placeholder: 'Enter your email address',
          validator: (value) => value.includes('@') && value.includes('.') && value.length > 5,
          errorMessage: 'Please enter a valid email address',
          valueSignal: 'this.parentNode.$email'
        },
        {
          tagName: 'form-field',
          label: 'Message:',
          type: 'textarea',
          rows: 4,
          placeholder: 'Enter your message (minimum 10 characters)',
          validator: (value) => value.trim().length >= 10,
          errorMessage: 'Message must be at least 10 characters',
          valueSignal: 'this.parentNode.$message'
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
                  tag: function () { return this.parent.parent.parent.$name },
                  textContent: 'Name: ${this.parentNode.parentNode.parentNode.$name.get()}'
                },
                {
                  tagName: 'div',
                  textContent: 'Email: ${this.parentNode.parentNode.parentNode.$email.get()}'
                },
                {
                  tagName: 'div',
                  textContent: 'Message: ${this.parentNode.parentNode.parentNode.$message.get()}'
                },
                {
                  tagName: 'div',
                  textContent: 'Valid: ${this.parentNode.parentNode.parentNode.isFormValid() ? "Yes" : "No"}',
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