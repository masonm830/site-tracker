import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const getToken = () => sessionStorage.getItem('token');
export const getRefreshToken = () => sessionStorage.getItem('refresh_token');

export const getUser = () => {
  const user = sessionStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAdmin = () => {
  const user = getUser();
  return user?.role === 'admin';
};

export const logout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('user');
  window.location.href = '/login';
};

// Queue of requests waiting on a token refresh in progress
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(newToken) {
  pendingQueue.forEach(({ resolve }) => resolve(newToken));
  pendingQueue = [];
}

function rejectQueue(err) {
  pendingQueue.forEach(({ reject }) => reject(err));
  pendingQueue = [];
}

export const setupAxiosInterceptors = () => {
  axios.interceptors.response.use(
    response => response,
    async error => {
      const original = error.config;

      // Only attempt refresh on 401, but not for the refresh or login endpoints themselves,
      // and not for requests that have already been retried.
      const isAuthEndpoint =
        original.url?.includes('/api/auth/refresh') ||
        original.url?.includes('/api/auth/login');

      if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
        return Promise.reject(error);
      }

      // If a refresh is already in progress, queue this request until it resolves.
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(newToken => {
          original.headers['Authorization'] = `Bearer ${newToken}`;
          return axios(original);
        }).catch(err => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        logout();
        return Promise.reject(error);
      }

      try {
        const res = await fetch(`${API}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) throw new Error('refresh_failed');

        const data = await res.json();
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('refresh_token', data.refresh_token);

        // Retry all queued requests with the new token
        resolveQueue(data.token);

        original.headers['Authorization'] = `Bearer ${data.token}`;
        return axios(original);
      } catch (refreshError) {
        rejectQueue(refreshError);
        logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
};
