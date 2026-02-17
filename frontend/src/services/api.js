const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function req(method, path, body = null) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
  };

  // Token varsa Authorization header'ı ekle
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, config);

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const errData = await res.json();
      msg = errData.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export const api = {
  get: (path) => req('GET', path),
  post: (path, body = null) => req('POST', path, body),
};
