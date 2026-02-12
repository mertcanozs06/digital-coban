const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function req(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    let msg = 'Hata';
    try { msg = (await res.json()).message || msg; } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export const api = {
  post: (path, body, token) => req('POST', path, body, token),
  get:  (path, token)       => req('GET',  path, null, token),
};
