import api from './axios.js';

function getCookie(name) {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

function getCsrfConfig() {
  const csrfToken = getCookie('csrftoken');

  return csrfToken ? { headers: { 'X-CSRFToken': csrfToken } } : {};
}

export async function getContacts({ search, ordering } = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.append('search', search);
  }

  if (ordering) {
    params.append('ordering', ordering);
  }

  const queryString = params.toString();
  const endpoint = `/contacts/${queryString ? `?${queryString}` : ''}`;
  const fullUrl = `${api.defaults.baseURL}${endpoint}`;

  console.log('Contact API base URL:', api.defaults.baseURL);
  console.log('Contact fetch URL:', fullUrl);

  try {
    const response = await api.get(endpoint);
    const data = response.data;
    const contacts = Array.isArray(data) ? data : data?.results || [];

    console.log('Contact fetch status:', response.status);
    console.log('Contact response data type:', Array.isArray(data) ? 'array' : typeof data);
    console.log('Contact count:', contacts.length);

    return data;
  } catch (error) {
    console.error('Contact fetch failed:', {
      url: fullUrl,
      status: error.response?.status,
      response: error.response?.data,
    });
    throw error;
  }
}

export async function createContact(formData) {
  const response = await api.post('/contacts/', formData, getCsrfConfig());
  return response.data;
}

export async function updateContact(id, formData) {
  const response = await api.patch(`/contacts/${id}/`, formData, getCsrfConfig());
  return response.data;
}

export async function deleteContact(id) {
  await api.delete(`/contacts/${id}/`, getCsrfConfig());
}

export async function exportContacts() {
  const response = await api.get('/contacts/export/', {
    responseType: 'blob',
  });
  return response.data;
}

export async function importContacts(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/contacts/import/', formData, getCsrfConfig());
  return response.data;
}

export async function toggleFavorite(contact) {
  const response = await api.patch(`/contacts/${contact.id}/`, {
    favorite: !contact.favorite,
  }, getCsrfConfig());
  return response.data;
}
