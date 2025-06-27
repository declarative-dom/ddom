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

      // Reactived properties - these become reactive signals
      $label: '',
      $type: 'text',
      $placeholder: '',
      $errorMessage: '',
      $rows: 1,
      $value: '',

      // Validator function property
      validator: () => true,

      // Computed validation using scoped properties (functions, not templates)
      $isValid: function() {
        const validator = this.validator;
        return validator ? validator($value.get()) : true;
      },
      
      $shouldShowError: function() {
        return $value.get().length > 0 && !this.$isValid();
      },
      
      $currentErrorMessage: function() {
        return $shouldShowError() ? $errorMessage.get() : '';
      },
      
      $isInputField: function() {
        return $type.get() !== 'textarea';
      },
      
      $isTextareaField: function() {
        return $type.get() === 'textarea';
      },

      // Methods
      updateValue: function (newValue) {
        this.$value.set(newValue);
      },

      attributes: {
        'data-valid': '${$isValid()}',
        'data-show-error': '${$shouldShowError()}',
        'data-field-type': '${$type.get()}',
        'data-is-input': '${$isInputField()}',
        'data-is-textarea': '${$isTextareaField()}'
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
          textContent: '${$label.get()}',
          style: {
            display: 'block',
            marginBottom: '0.5em',
            fontWeight: 'bold'
          }
        },
        {
          tagName: 'input',
          name: '${$label.get()}',
          type: '${$type.get()}',
          placeholder: '${$placeholder.get()}',
          value: '${$value.get()}',
          className: 'field-input input-field',
          style: {
            width: '100%',
            padding: '0.75em',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1em'
          },
          oninput: function (e) {
            $value.set(e.target.value);
          }
        },
        {
          tagName: 'textarea',
          name: '${$label.get()}',
          placeholder: '${$placeholder.get()}',
          value: '${$value.get()}',
          rows: '${$rows.get()}',
          className: 'field-input textarea-field',
          style: {
            width: '100%',
            padding: '0.75em',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '1em'
          },
          oninput: function (e) {
            $value.set(e.target.value);
          }
        },
        {
          tagName: 'div',
          textContent: '${$currentErrorMessage()}',
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

      // Reactive form data properties (scoped signals)
      $name: '',
      $email: '',
      $message: '',

      // Computed validation using scoped properties (functions for booleans)
      $isNameValid: function() {
        return $name.get().trim().length >= 2;
      },
      
      $isEmailValid: function() {
        const email = $email.get();
        return email.includes('@') && email.includes('.') && email.length > 5;
      },
      
      $isMessageValid: function() {
        return $message.get().trim().length >= 10;
      },
      
      $isFormValid: function() {
        return $isNameValid() && $isEmailValid() && $isMessageValid();
      },

      // Form methods
      submitForm: function () {
        if ($isFormValid()) {
          alert(`Form submitted!\nName: ${$name.get()}\nEmail: ${$email.get()}\nMessage: ${$message.get()}`);
          this.resetForm();
        } else {
          alert('Please fill out all fields correctly before submitting.');
        }
      },

      resetForm: function () {
        $name.set('');
        $email.set('');
        $message.set('');
      },

      style: {
        display: 'block',
        maxWidth: '500px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2em',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',

        // Form validation styling using computed properties
        '&[data-form-valid="true"] .submit-button': {
          backgroundColor: '#28a745',
          cursor: 'pointer'
        },
        '&[data-form-valid="false"] .submit-button': {
          backgroundColor: '#6c757d',
          cursor: 'not-allowed'
        },
        '&[data-form-valid="true"] .form-status': {
          color: '#28a745'
        },
        '&[data-form-valid="false"] .form-status': {
          color: '#dc3545'
        }
      },

      // Set reactive data attributes
      attributes: {
        'data-form-valid': '${$isFormValid()}'
      },

      children: [
        {
          tagName: 'form-field',
          $label: 'Name',
          $type: 'text',
          $placeholder: 'Enter your name (minimum 2 characters)',
          $errorMessage: 'Name must be at least 2 characters',
          validator: (value) => value.trim().length >= 2,
          // Bind the value signal from parent
          $value: '$name'
        },
        {
          tagName: 'form-field',
          $label: 'Email',
          $type: 'email',
          $placeholder: 'Enter your email address',
          $errorMessage: 'Please enter a valid email address',
          validator: (value) => value.includes('@') && value.includes('.') && value.length > 5,
          // Bind the value signal from parent
          $value: '$email'
        },
        {
          tagName: 'form-field',
          $label: 'Message',
          $type: 'textarea',
          $rows: 4,
          $placeholder: 'Enter your message (minimum 10 characters)',
          $errorMessage: 'Message must be at least 10 characters',
          validator: (value) => value.trim().length >= 10,
          // Bind the value signal from parent
          $value: '$message'
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
              disabled: '${!$isFormValid()}',
              style: {
                flex: '1',
                padding: '0.75em',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1em'
              },
              onclick: function () {
                parentNode.submitForm();
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
                parentNode.resetForm();
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
                  textContent: 'Name: ${$name.get()}'
                },
                {
                  tagName: 'div',
                  textContent: 'Email: ${$email.get()}'
                },
                {
                  tagName: 'div',
                  textContent: 'Message: ${$message.get()}'
                },
                {
                  tagName: 'div',
                  textContent: 'Valid: ${$isFormValid() ? "Yes" : "No"}',
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