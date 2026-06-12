import api from './api';

export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const crimeService = {
  addCrime: (data) => api.post('/crime/add', data),
  getAllCrimes: () => api.get('/crime'),
  getFilteredCrimes: (params) => api.get('/crime/filter', { params }),
  getHotspots: (params) => api.get('/crime/hotspots', { params }),
  getAnalytics: (params) => api.get('/crime/analytics', { params }),
};
