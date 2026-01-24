// API service functions – base URL must be reachable from browser (e.g. localhost:8000)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export { API_BASE_URL };

async function getErrorDetail(response) {
  try {
    const data = await response.json();
    const d = data.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join('; ');
    return d ? String(d) : response.statusText || 'Request failed';
  } catch {
    return response.statusText || 'Request failed';
  }
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const fetchData = async (endpoint) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    const msg = await getErrorDetail(response);
    throw new Error(msg);
  }
  return response.json();
};

export const postData = async (endpoint, data) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const msg = await getErrorDetail(response);
    throw new Error(msg);
  }
  return response.json();
};

// ========================================
// SERVICES API
// ========================================

export const servicesAPI = {
  // Create a new service (provider only)
  create: async (serviceData) => {
    const response = await fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(serviceData),
    });
    if (!response.ok) {
      const msg = await getErrorDetail(response);
      throw new Error(msg);
    }
    return response.json();
  },

  // List all services with optional filters
  list: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.provider_id) queryParams.append('provider_id', params.provider_id);
    if (params.skip !== undefined) queryParams.append('skip', params.skip);
    if (params.limit !== undefined) queryParams.append('limit', params.limit);

    const url = `${API_BASE_URL}/services${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      const msg = await getErrorDetail(response);
      throw new Error(msg);
    }
    return response.json();
  },

  // Get a single service by ID
  getById: async (serviceId) => {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`);
    if (!response.ok) {
      const msg = await getErrorDetail(response);
      throw new Error(msg);
    }
    return response.json();
  },

  // Update a service (provider only, own service)
  update: async (serviceId, updateData) => {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    if (!response.ok) {
      const msg = await getErrorDetail(response);
      throw new Error(msg);
    }
    return response.json();
  },

  // Delete a service (provider only, own service)
  delete: async (serviceId) => {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const msg = await getErrorDetail(response);
      throw new Error(msg);
    }
    return true;
  },
};

// ========================================
// BOOKINGS API
// ========================================

export const bookingsAPI = {
  // Create a new booking (seeker)
  create: async (bookingData) => {
    const response = await fetch(`${API_BASE_URL}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
      const msg = await getErrorDetail(response);
      throw new Error(msg);
    }
    return response.json();
  },

  // List bookings (as seeker and/or provider)
  list: async (params = { as_seeker: true, as_provider: true }) => {
    const queryParams = new URLSearchParams();
    if (params.as_seeker !== undefined) queryParams.append('as_seeker', params.as_seeker);
    if (params.as_provider !== undefined) queryParams.append('as_provider', params.as_provider);

    const url = `${API_BASE_URL}/bookings?${queryParams.toString()}`;
    const response = await fetch(url, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const msg = await getErrorDetail(response);
      throw new Error(msg);
    }
    return response.json();
  },

  // Get a single booking by ID
  getById: async (bookingId) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const msg = await getErrorDetail(response);
      throw new Error(msg);
    }
    return response.json();
  },

  // Update booking status
  updateStatus: async (bookingId, status) => {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const msg = await getErrorDetail(response);
      throw new Error(msg);
    }
    return response.json();
  },
};