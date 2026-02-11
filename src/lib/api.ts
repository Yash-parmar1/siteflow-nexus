import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.29.124:8080/api',
});

api.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    // Don't attach auth header to authentication endpoints
    if (url.startsWith("/auth")) {
      return config;
    }

    const token = localStorage.getItem("token");
    if (token) {
      if (!config.headers) {
        config.headers = {} as any;
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
