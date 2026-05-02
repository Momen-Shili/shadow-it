import api, { TOKEN_KEY, REFRESH_KEY, USER_KEY } from './api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_KEY, data.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

export async function register(name, email, password) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function logout() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  try {
    await api.post('/auth/logout', { refreshToken });
  } finally {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function getCurrentUser() {
  const raw = localStorage.getItem(USER_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
