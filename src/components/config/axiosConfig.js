// src/components/config/axiosConfig.js
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
  timeout: 15000,
});

apiClient.interceptors.request.use(
  async (config) => {
    let token = sessionStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now();
        const isExpired = decoded.exp * 1000 < currentTime;
        const expiresSoon = decoded.exp * 1000 - currentTime < 5 * 60 * 1000;

        if (isExpired || expiresSoon) {
          const refreshRes = await axios.post(
            `${process.env.REACT_APP_API_URL}/api/users/refresh-token`,
            {},
            { withCredentials: true }
          );
          const newToken = refreshRes.data.accessToken;
          if (newToken) {
            sessionStorage.setItem('token', newToken);
            token = newToken;
          }
        }
      } catch (err) {
        console.error('🔴 Token scaduto o non valido, logout:', err);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        window.location.href = '/login';
        return Promise.reject(err);
      }

      // IMPORTANTE: solo qui dopo tutto
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('Errore di autenticazione (401), logout forzato.');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
