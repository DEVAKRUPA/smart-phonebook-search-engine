const backendUrl = 'http://localhost:8000';

function getImageUrl(imageUrl) {
  if (!imageUrl) {
    return '';
  }

  return imageUrl.startsWith('http') ? imageUrl : `${backendUrl}${imageUrl}`;
}

function formatPhoneNumber(contact) {
  return contact.country_code
    ? `+${contact.country_code} ${contact.phone_number}`
    : contact.phone_number;
}

function getInitials(contact) {
  const label = contact.name || contact.phone_number || '?';
  return label.trim().slice(0, 2).toUpperCase();
}

function ContactList({ contacts, onEdit, onDelete, onToggleFavorite, emptyMessage }) {
  if (!contacts.length) {
    return <p className="empty-message">{emptyMessage || 'No contacts found. Add your first contact.'}</p>;
  }

  return (
    <div className="contact-list">
      {contacts.map((contact) => (
        <article className="contact-card" key={contact.id}>
          {contact.profile_image ? (
            <img className="contact-image" src={getImageUrl(contact.profile_image)} alt={contact.name || 'Contact'} />
          ) : (
            <div className="contact-avatar" aria-hidden="true">{getInitials(contact)}</div>
          )}

          <div className="contact-details">
            <div className="contact-title-row">
              <h3>{contact.name || 'No Name'}</h3>
              <span className={contact.favorite ? 'favorite-star active' : 'favorite-star'} aria-label={contact.favorite ? 'Favorite' : 'Not favorite'}>
                {contact.favorite ? '★' : '☆'}
              </span>
            </div>
            <p>{formatPhoneNumber(contact)}</p>
            {contact.email && <p>{contact.email}</p>}
            {contact.company && <p>{contact.company}</p>}
            {contact.tags && <p>Tags: {contact.tags}</p>}
            {contact.birthday && <p>Birthday: {contact.birthday}</p>}
            <p>{contact.favorite ? 'Favorite' : 'Not favorite'}</p>
          </div>

          <div className="contact-actions">
            <button className="secondary-button" type="button" onClick={() => onEdit(contact)}>
              Edit
            </button>
            <button className="secondary-button" type="button" onClick={() => onToggleFavorite(contact)}>
              {contact.favorite ? 'Unfavorite' : 'Favorite'}
            </button>
            <button className="danger-button" type="button" onClick={() => onDelete(contact.id)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default ContactList;
