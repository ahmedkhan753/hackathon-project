import { API_BASE_URL, postData } from './api';

/**
 * Auth API – matches backend routes exactly:
 * - POST /login  (OAuth2 form: username, password)
 * - POST /register (JSON: username, name, email, password)
 * - GET /me     (Authorization: Bearer <token>)
 */

export const login = async (username, password) => {
  const body = new URLSearchParams({ username, password });
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    let msg = 'Login failed';
    try {
      const data = await response.json();
      msg = data.detail ?? msg;
      if (Array.isArray(msg)) msg = msg.map((x) => x.msg || JSON.stringify(x)).join('; ');
    } catch {}
    throw new Error(msg);
  }

  return response.json();
};

export const register = async (username, name, email, password) => {
  return postData('/register', { username, name, email, password });
};

export const getCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = 'Failed to fetch user';
    try {
      const data = await response.json();
      msg = data.detail ?? msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
};
