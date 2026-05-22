import { useEffect, useState } from 'react';

const emptyForm = {
  name: '',
  country_code: '',
  phone_number: '',
  email: '',
  company: '',
  address: '',
  tags: '',
  favorite: false,
  notes: '',
  birthday: '',
  profile_image: null,
};

function ContactForm({ contact, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const isEditing = Boolean(contact);

  useEffect(() => {
    if (!contact) {
      setForm(emptyForm);
      return;
    }

    setForm({
      name: contact.name || '',
      country_code: contact.country_code || '',
      phone_number: contact.phone_number || '',
      email: contact.email || '',
      company: contact.company || '',
      address: contact.address || '',
      tags: contact.tags || '',
      favorite: Boolean(contact.favorite),
      notes: contact.notes || '',
      birthday: contact.birthday || '',
      profile_image: null,
    });
  }, [contact]);

  const handleChange = (event) => {
    const { name, type, checked, files, value } = event.target;
    const nextValue = name === 'phone_number'
      ? value.replace(/\D/g, '').slice(0, 10)
      : value;

    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] || null : nextValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (form.phone_number.length !== 10) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name || '');
    formData.append('country_code', form.country_code || '');
    formData.append('phone_number', form.phone_number);
    formData.append('email', form.email || '');
    formData.append('company', form.company || '');
    formData.append('address', form.address || '');
    formData.append('tags', form.tags || '');
    formData.append('favorite', form.favorite ? 'true' : 'false');
    formData.append('notes', form.notes || '');
    formData.append('birthday', form.birthday || '');

    if (form.profile_image instanceof File) {
      formData.append('profile_image', form.profile_image);
    }

    await onSubmit(formData);

    if (!isEditing) {
      setForm(emptyForm);
    }
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <h2>{isEditing ? 'Edit Contact' : 'Add Contact'}</h2>

      {formError && <p className="error-message">{formError}</p>}

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" value={form.name} onChange={handleChange} />
        </div>

        <div className="form-field phone-field">
          <label htmlFor="phone_number">Phone Number</label>
          <div className="phone-input-row">
            <select
              aria-label="Country code"
              name="country_code"
              value={form.country_code}
              onChange={handleChange}
            >
              <option value="">No code</option>
              <option value="91">+91 India</option>
              <option value="1">+1 USA/Canada</option>
              <option value="44">+44 UK</option>
              <option value="61">+61 Australia</option>
              <option value="971">+971 UAE</option>
            </select>
            <input
              id="phone_number"
              name="phone_number"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="9876543210"
              maxLength="10"
              required
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" type="text" value={form.company} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label htmlFor="tags">Tags</label>
          <input id="tags" name="tags" type="text" value={form.tags} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label htmlFor="birthday">Birthday</label>
          <input id="birthday" name="birthday" type="date" value={form.birthday} onChange={handleChange} />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="address">Address</label>
        <textarea id="address" name="address" value={form.address} onChange={handleChange} />
      </div>

      <div className="form-field">
        <label htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} />
      </div>

      <div className="form-field">
        <label htmlFor="profile_image">Profile image</label>
        <input id="profile_image" name="profile_image" type="file" accept="image/*" onChange={handleChange} />
      </div>

      <label className="checkbox-field">
        <input name="favorite" type="checkbox" checked={form.favorite} onChange={handleChange} />
        Favorite
      </label>

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : isEditing ? 'Update Contact' : 'Add Contact'}
        </button>

        {isEditing && (
          <button className="secondary-button" type="button" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default ContactForm;
