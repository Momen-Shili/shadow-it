import axios from 'axios';

export const TOKEN_KEY = 'shadow_token';
export const REFRESH_KEY = 'shadow_refresh_token';
export const USER_KEY = 'shadow_user';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401: try silent refresh, then give up and redirect to login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem(REFRESH_KEY);

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            'http://localhost:5000/api/auth/refresh',
            { refreshToken }
          );
          localStorage.setItem(TOKEN_KEY, data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          // refresh failed — fall through to clear storage
        }
      }

      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/auth/sign-in';
    }

    return Promise.reject(error);
  }
);

export default api;
