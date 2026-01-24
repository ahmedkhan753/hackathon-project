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