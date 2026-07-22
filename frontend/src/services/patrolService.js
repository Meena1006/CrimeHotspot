import api from './api';

export const patrolService = {
  getLocations: () => api.get('/patrol/locations'),
  generateRoute: (data) => api.post('/patrol/generate', data),
  generateAlternatives: (data) => api.post('/patrol/alternatives', data),
  lockPatrol: (data) => api.post('/patrol/lock', data),
  markGuarded: (id, stopOrder) => api.patch(`/patrol/${id}/guard`, { stopOrder }),
  getHistory: (params) => api.get('/patrol/history', { params }),
  getPatrol: (id) => api.get(`/patrol/${id}`),
};
