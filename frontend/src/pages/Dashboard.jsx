import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createContact,
  deleteContact,
  exportContacts,
  getContacts,
  importContacts,
  toggleFavorite,
  updateContact,
} from '../api/contacts.js';
import ContactForm from '../components/ContactForm.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const backendUrl = 'http://localhost:8000';

function getContactErrorMessage(error) {
  const data = error.response?.data;
  const text = JSON.stringify(data || error.message || '').toLowerCase();

  console.error('Contact save error:', data || error);

  if (text.includes('unique') || text.includes('duplicate') || text.includes('already exists')) {
    return 'A contact with this phone number already exists.';
  }

  if (data?.phone_number) {
    return Array.isArray(data.phone_number) ? data.phone_number.join(' ') : data.phone_number;
  }

  if (data?.country_code) {
    return Array.isArray(data.country_code) ? data.country_code.join(' ') : data.country_code;
  }

  if (data?.non_field_errors) {
    const message = Array.isArray(data.non_field_errors)
      ? data.non_field_errors.join(' ')
      : data.non_field_errors;

    if (message.toLowerCase().includes('unique') || message.toLowerCase().includes('already exists')) {
      return 'A contact with this phone number already exists.';
    }

    return message;
  }

  if (data?.detail) {
    return data.detail;
  }

  return 'Unable to save contact. Please check the form and try again.';
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function compareText(firstValue, secondValue) {
  return normalizeText(firstValue).localeCompare(normalizeText(secondValue));
}

function compareDate(firstValue, secondValue) {
  const firstTime = firstValue ? new Date(firstValue).getTime() : 0;
  const secondTime = secondValue ? new Date(secondValue).getTime() : 0;
  return firstTime - secondTime;
}

function sortContacts(contactList, sortOption) {
  return [...contactList].sort((first, second) => {
    switch (sortOption) {
      case 'oldest':
        return compareDate(first.created_at || first.updated_at, second.created_at || second.updated_at);
      case 'name-az':
        return compareText(first.name, second.name);
      case 'name-za':
        return compareText(second.name, first.name);
      case 'company-az':
        return compareText(first.company, second.company);
      case 'phone-az':
        return compareText(first.phone_number, second.phone_number);
      case 'favorites':
        return Number(Boolean(second.favorite)) - Number(Boolean(first.favorite));
      case 'newest':
      default:
        return compareDate(second.created_at || second.updated_at, first.created_at || first.updated_at);
    }
  });
}

function getStoredPhoneDigits(contact) {
  return `${contact?.country_code || ''}${contact?.phone_number || ''}`.replace(/\D/g, '').slice(-10);
}

function normalizeContact(contact) {
  return {
    ...contact,
    id: contact.id || contact._id,
    phone_number: contact.phone_number || contact.phone || '',
    country_code: contact.country_code || '',
    favorite: Boolean(contact.favorite),
  };
}

function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return '';
  }

  return imageUrl.startsWith('http') ? imageUrl : `${backendUrl}${imageUrl}`;
}

function formatPhoneNumber(contact) {
  return contact?.country_code
    ? `+${contact.country_code} ${contact.phone_number}`
    : contact?.phone_number || '';
}

function getInitials(contact) {
  const label = contact?.name || contact?.phone_number || '?';
  return label.trim().slice(0, 2).toUpperCase();
}

function getSuggestionFields(contact) {
  return [
    contact?.name,
    formatPhoneNumber(contact),
    contact?.phone_number,
    contact?.email,
    contact?.company,
    contact?.tags,
  ];
}

function getSuggestionText(contact, query) {
  const normalizedQuery = normalizeText(query);
  const matchedField = getSuggestionFields(contact).find((field) => (
    normalizeText(field).includes(normalizedQuery)
  ));

  return matchedField || contact?.name || formatPhoneNumber(contact) || 'No Name';
}

function Dashboard({ theme, setTheme }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [editingContact, setEditingContact] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [error, setError] = useState('');
  const [contactError, setContactError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [importSummary, setImportSummary] = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isContactPanelOpen, setIsContactPanelOpen] = useState(true);

  const getContactArray = (data) => (Array.isArray(data) ? data : data.results || []);

  const loadContacts = async (searchText = debouncedSearch) => {
    if (!user) {
      setContacts([]);
      setContactsLoading(false);
      return;
    }

    setContactsLoading(true);
    setContactError('');

    try {
      const data = await getContacts({ search: searchText, ordering: '-updated_at' });
      const contactArray = getContactArray(data).map(normalizeContact);
      console.log('Contacts fetched:', contactArray.length);
      setContacts(contactArray);
    } catch (fetchError) {
      console.error('Dashboard contact load failed:', {
        status: fetchError.response?.status,
        response: fetchError.response?.data,
      });
      setContactError('Unable to load contacts. Please try again.');
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadContacts(debouncedSearch);
  }, [debouncedSearch, user?.id]);

  useEffect(() => {
    if (selectedContactId && !contacts.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(null);
    }
  }, [contacts, selectedContactId]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLogout = async () => {
    setError('');
    setSubmitting(true);

    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (logoutError) {
      setError(logoutError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveContact = async (formData) => {
    setContactError('');
    setSubmitting(true);
    const nextPhoneNumber = String(formData.get('phone_number') || '').replace(/\D/g, '').slice(-10);
    const duplicateContact = contacts.find((contact) => {
      const isSameContact = editingContact?.id && contact.id === editingContact.id;
      return !isSameContact && nextPhoneNumber && getStoredPhoneDigits(contact) === nextPhoneNumber;
    });

    if (duplicateContact) {
      setSelectedContactId(duplicateContact.id);
      showToast('Phone number already exists', 'error');
      setSubmitting(false);
      return;
    }

    try {
      if (editingContact?.id) {
        await updateContact(editingContact.id, formData);
        setEditingContact(null);
      } else {
        await createContact(formData);
        setEditingContact(null);
      }

      await loadContacts();
      const message = editingContact?.id ? 'Contact updated successfully' : 'Contact added successfully';
      showToast(message);
    } catch (contactError) {
      console.error('Contact save error:', contactError.response?.data || contactError);
      showToast('Something went wrong. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (id) => {
    const confirmed = window.confirm('Delete this contact?');

    if (!confirmed) {
      return;
    }

    setContactError('');

    try {
      await deleteContact(id);
      if (selectedContactId === id) {
        setSelectedContactId(null);
      }
      await loadContacts();
      showToast('Contact deleted successfully');
    } catch {
      showToast('Something went wrong. Please try again.', 'error');
    }
  };

  const handleToggleFavorite = async (contact) => {
    setContactError('');

    try {
      await toggleFavorite(contact);
      await loadContacts();
    } catch {
      setContactError('Unable to update favorite status.');
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const nextSearch = search.trim();
    setShowSuggestions(false);
    setDebouncedSearch(nextSearch);
    loadContacts(nextSearch);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setShowSuggestions(Boolean(event.target.value.trim()));
  };

  const handleSuggestionClick = (contact) => {
    const nextSearch = getSuggestionText(contact, search).trim();

    setSearch(nextSearch);
    setDebouncedSearch(nextSearch);
    setShowSuggestions(false);
    setSelectedContactId(contact.id);
    if (window.innerWidth <= 900) {
      setIsContactPanelOpen(false);
    }
    loadContacts(nextSearch);
  };

  const handleSelectContact = (contactId) => {
    setSelectedContactId(contactId);

    if (window.innerWidth <= 900) {
      setIsContactPanelOpen(false);
    }
  };

  const handleAddSearchedNumber = () => {
    const digits = search.replace(/\D/g, '').slice(0, 10);

    setEditingContact({
      country_code: '',
      phone_number: digits,
      name: '',
      email: '',
      company: '',
      address: '',
      tags: '',
      favorite: false,
      notes: '',
      birthday: '',
      profile_image: null,
    });
  };

  const handleExportContacts = async () => {
    setContactError('');

    try {
      const blob = await exportContacts();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'contacts.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setContactError('Unable to export contacts.');
    }
  };

  const handleImportContacts = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setContactError('');
    setImportSummary(null);

    try {
      const result = await importContacts(file);
      setImportSummary(result);
      await loadContacts();
    } catch (importError) {
      setContactError(importError.response?.data?.detail || 'Unable to import contacts.');
    } finally {
      event.target.value = '';
    }
  };

  const ThemeToggle = () => (
    <label className="theme-toggle">
      <span>Theme</span>
      <select value={theme} onChange={(event) => setTheme(event.target.value)}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );

  const emptyMessage = debouncedSearch
    ? 'No contacts match your search.'
    : 'No contacts found. Add your first contact.';
  const sortedContacts = sortContacts(contacts, sortOption);
  const selectedContact = sortedContacts.find((contact) => contact.id === selectedContactId) || null;
  const searchedDigits = search.replace(/\D/g, '');
  const searchQuery = search.trim();
  const contactSuggestions = searchQuery
    ? sortedContacts.filter((contact) => (
      getSuggestionFields(contact).some((field) => normalizeText(field).includes(normalizeText(searchQuery)))
    )).slice(0, 5)
    : [];
  const shouldShowSuggestions = showSuggestions && searchQuery && contactSuggestions.length > 0;
  const canAddFromSearch = Boolean(debouncedSearch && !contactsLoading && sortedContacts.length === 0);
  const favoriteCount = contacts.filter((contact) => contact.favorite).length;
  const cleanPhone = String(
    selectedContact ? `${selectedContact.country_code || ''}${selectedContact.phone_number || ''}` : ''
  ).replace(/\D/g, '');
  const selectedEmail = selectedContact?.email?.trim() || '';

  return (
    <main className="dashboard-page simple-dashboard-page">
      {toast && (
        <div className={toast.type === 'error' ? 'toast-notification error' : 'toast-notification'} role="status">
          <span className="toast-icon" aria-hidden="true">{toast.type === 'error' ? '!' : '✓'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      <section className="dashboard-card simple-dashboard-card">
        <header className="dashboard-header simple-dashboard-header">
          <div>
            <p className="eyebrow">Welcome, {user?.username}</p>
            <h1>Smart Phonebook</h1>
            <p className="muted">Search, add, and manage your contacts.</p>
          </div>

          <div className="header-actions">
            <ThemeToggle />
            <button className="secondary-button" type="button" onClick={handleLogout} disabled={submitting}>
              {submitting ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </header>

        {error && <p className="error-message">{error}</p>}
        {contactError && <p className="error-message">{contactError}</p>}

        <div className="dashboard-summary-row" aria-label="Phonebook summary">
          <div className="summary-card">
            <span>Total contacts</span>
            <strong>{contacts.length}</strong>
          </div>
          <div className="summary-card">
            <span>Favorites</span>
            <strong>{favoriteCount}</strong>
          </div>
          <div className="summary-card">
            <span>Showing</span>
            <strong>{sortedContacts.length}</strong>
          </div>
        </div>

        <form className="simple-search-form" onSubmit={handleSearchSubmit}>
          <div className="search-suggestion-wrap">
            <input
              id="contact-search"
              type="search"
              value={search}
              onChange={handleSearchChange}
              onFocus={() => setShowSuggestions(Boolean(search.trim()))}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
              placeholder="Search name, phone, email, company, address, or tags"
              autoComplete="off"
            />
            {shouldShowSuggestions && (
              <div className="simple-suggestions-list" role="listbox" aria-label="Contact search suggestions">
                {contactSuggestions.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    role="option"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSuggestionClick(contact)}
                  >
                    <strong>{contact.name || 'No Name'}</strong>
                    <span>{getSuggestionText(contact, search)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className="primary-button" type="submit">Search</button>
        </form>

        <div className="simple-sort-actions-row">
          <label className="simple-sort-field" htmlFor="contact-sort">
            <span>Sort contacts</span>
            <select
              id="contact-sort"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name-az">Name A-Z</option>
              <option value="name-za">Name Z-A</option>
              <option value="company-az">Company A-Z</option>
              <option value="phone-az">Phone number A-Z</option>
              <option value="favorites">Favorites first</option>
            </select>
          </label>

          <div className="dashboard-tools simple-tools">
            <label className="file-button">
              Import CSV
              <input type="file" accept=".csv,text/csv" onChange={handleImportContacts} />
            </label>
            <button className="secondary-button" type="button" onClick={handleExportContacts}>
              Export CSV
            </button>
          </div>
        </div>

        {importSummary && (
          <p className="info-message">
            Imported {importSummary.imported_count || 0}. Skipped duplicates {importSummary.skipped_duplicates || 0}. Invalid rows {importSummary.invalid_rows || 0}.
          </p>
        )}

        <section className="contacts-section">
          <div className="section-heading-row">
            <h2>My Contacts</h2>
            <span className="muted">{contacts.length} contact{contacts.length === 1 ? '' : 's'}</span>
          </div>

          <div className="contacts-panel-toggle-row">
            <button
              className="contacts-menu-button"
              type="button"
              onClick={() => setIsContactPanelOpen((current) => !current)}
              aria-controls="contacts-panel"
              aria-expanded={isContactPanelOpen}
            >
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <strong>{isContactPanelOpen ? 'Hide contacts' : 'Show contacts'}</strong>
            </button>
          </div>

          {contactsLoading ? (
            <p className="muted">Loading contacts...</p>
          ) : canAddFromSearch ? (
            <div className="no-contact-found">
              <p>No contact matched</p>
              <button className="primary-button" type="button" onClick={handleAddSearchedNumber}>
                Add Contact
              </button>
              {searchedDigits && searchedDigits.length < 10 && (
                <small>Phone numbers must be 10 digits when saving.</small>
              )}
              {editingContact && !editingContact.id && (
                <ContactForm
                  contact={editingContact}
                  onSubmit={handleSaveContact}
                  onCancel={() => setEditingContact(null)}
                  submitting={submitting}
                />
              )}
            </div>
          ) : (
            <>
              {!sortedContacts.length ? (
                <div className="empty-contact-form">
                  <p className="empty-message">{emptyMessage}</p>
                  <ContactForm
                    contact={editingContact}
                    onSubmit={handleSaveContact}
                    onCancel={() => setEditingContact(null)}
                    submitting={submitting}
                  />
                </div>
              ) : (
                <div className="phonebook-layout">
                  <div
                    id="contacts-panel"
                    className={isContactPanelOpen ? 'phonebook-list contacts-panel open' : 'phonebook-list contacts-panel'}
                    aria-label="Contact list"
                  >
                    {sortedContacts.map((contact) => (
                      <button
                        className={selectedContact?.id === contact.id ? 'phonebook-list-item active' : 'phonebook-list-item'}
                        type="button"
                        key={contact.id}
                        onClick={() => handleSelectContact(contact.id)}
                      >
                        {contact.profile_image ? (
                          <img className="phonebook-list-image" src={getImageUrl(contact.profile_image)} alt={contact.name || 'Contact'} />
                        ) : (
                          <span className="phonebook-list-avatar">{getInitials(contact)}</span>
                        )}
                        <span>
                          <strong>{contact.name || 'No Name'}</strong>
                          <small>{formatPhoneNumber(contact)}</small>
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="phonebook-detail-column">
                    {selectedContact ? (
                      <article className="phone-contact-detail">
                        <div className="phone-contact-hero">
                          {selectedContact.profile_image ? (
                            <img className="phone-contact-image" src={getImageUrl(selectedContact.profile_image)} alt={selectedContact.name || 'Contact'} />
                          ) : (
                            <div className="phone-contact-avatar">{getInitials(selectedContact)}</div>
                          )}
                          <h3>{selectedContact.name || 'No Name'}</h3>
                          <p>{formatPhoneNumber(selectedContact)}</p>
                          <span className={selectedContact.favorite ? 'favorite-pill active' : 'favorite-pill'}>
                            {selectedContact.favorite ? 'Favorite' : 'Not favorite'}
                          </span>
                        </div>

                        <div className="phone-quick-actions" aria-label="Contact quick actions">
                          {cleanPhone ? (
                            <a className="quick-action" href={`tel:${cleanPhone}`}>Call</a>
                          ) : (
                            <span className="quick-action disabled">Call</span>
                          )}
                          {cleanPhone ? (
                            <a className="quick-action" href={`sms:${cleanPhone}`}>Message</a>
                          ) : (
                            <span className="quick-action disabled">Message</span>
                          )}
                          {selectedEmail ? (
                            <a className="quick-action" href={`mailto:${selectedEmail}`}>Email</a>
                          ) : (
                            <span className="quick-action disabled">Email</span>
                          )}
                        </div>

                        <div className="phone-detail-rows">
                          <div className="phone-detail-row">
                            <span>Phone</span>
                            <strong>{formatPhoneNumber(selectedContact)}</strong>
                          </div>
                          {selectedContact.email && (
                            <div className="phone-detail-row">
                              <span>Email</span>
                              <strong>{selectedContact.email}</strong>
                            </div>
                          )}
                          {selectedContact.company && (
                            <div className="phone-detail-row">
                              <span>Company</span>
                              <strong>{selectedContact.company}</strong>
                            </div>
                          )}
                          {selectedContact.address && (
                            <div className="phone-detail-row">
                              <span>Address</span>
                              <strong>{selectedContact.address}</strong>
                            </div>
                          )}
                          {selectedContact.tags && (
                            <div className="phone-detail-row">
                              <span>Tags</span>
                              <strong>{selectedContact.tags}</strong>
                            </div>
                          )}
                          {selectedContact.birthday && (
                            <div className="phone-detail-row">
                              <span>Birthday</span>
                              <strong>{selectedContact.birthday}</strong>
                            </div>
                          )}
                          {selectedContact.notes && (
                            <div className="phone-detail-row">
                              <span>Notes</span>
                              <strong>{selectedContact.notes}</strong>
                            </div>
                          )}
                        </div>

                        <div className="phone-detail-actions">
                          <button className="secondary-button" type="button" onClick={() => setEditingContact(selectedContact)}>
                            Edit
                          </button>
                          <button className="secondary-button" type="button" onClick={() => handleToggleFavorite(selectedContact)}>
                            {selectedContact.favorite ? 'Unfavorite' : 'Favorite'}
                          </button>
                          <button className="danger-button" type="button" onClick={() => handleDeleteContact(selectedContact.id)}>
                            Delete
                          </button>
                        </div>
                      </article>
                    ) : (
                      <article className="phone-contact-detail phone-contact-empty">
                        <p>Select a contact to view details.</p>
                      </article>
                    )}

                    <ContactForm
                      contact={editingContact}
                      onSubmit={handleSaveContact}
                      onCancel={() => setEditingContact(null)}
                      submitting={submitting}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </section>
    </main>
  );
}

export default Dashboard;
