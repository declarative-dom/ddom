export default {
  formData: { name: '', email: '', message: '' },
  updateField: function(field, value) {
    this.formData[field] = value;
    console.log('Form data updated:', this.formData);
  },
  submitForm: function() {
    alert(`Form submitted!\nName: ${this.formData.name}\nEmail: ${this.formData.email}\nMessage: ${this.formData.message}`);
  },
  document: {
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
          tagName: 'form',
          style: {
            maxWidth: '500px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '2em',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          },
          children: [
            {
              tagName: 'div',
              style: { marginBottom: '1.5em' },
              children: [
                {
                  tagName: 'label',
                  textContent: 'Name:',
                  style: {
                    display: 'block',
                    marginBottom: '0.5em',
                    fontWeight: 'bold'
                  }
                },
                {
                  tagName: 'input',
                  type: 'text',
                  placeholder: 'Enter your name',
                  style: {
                    width: '100%',
                    padding: '0.75em',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1em'
                  },
                  oninput: function(e) { window.updateField('name', e.target.value); }
                }
              ]
            },
            {
              tagName: 'div',
              style: { marginBottom: '1.5em' },
              children: [
                {
                  tagName: 'label',
                  textContent: 'Email:',
                  style: {
                    display: 'block',
                    marginBottom: '0.5em',
                    fontWeight: 'bold'
                  }
                },
                {
                  tagName: 'input',
                  type: 'email',
                  placeholder: 'Enter your email',
                  style: {
                    width: '100%',
                    padding: '0.75em',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1em'
                  },
                  oninput: function(e) { window.updateField('email', e.target.value); }
                }
              ]
            },
            {
              tagName: 'div',
              style: { marginBottom: '1.5em' },
              children: [
                {
                  tagName: 'label',
                  textContent: 'Message:',
                  style: {
                    display: 'block',
                    marginBottom: '0.5em',
                    fontWeight: 'bold'
                  }
                },
                {
                  tagName: 'textarea',
                  placeholder: 'Enter your message',
                  rows: '4',
                  style: {
                    width: '100%',
                    padding: '0.75em',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1em',
                    resize: 'vertical'
                  },
                  oninput: function(e) { window.updateField('message', e.target.value); }
                }
              ]
            },
            {
              tagName: 'button',
              type: 'button',
              textContent: 'Submit Form',
              style: {
                width: '100%',
                padding: '0.75em',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1em',
                cursor: 'pointer'
              },
              onclick: function() { window.submitForm(); }
            }
          ]
        }
      ]
    }
  }
}