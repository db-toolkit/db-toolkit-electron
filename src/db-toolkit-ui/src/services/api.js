import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const connectionsAPI = {
  getAll: () => api.get('/connections'),
  create: (data) => api.post('/connections', data),
  update: (id, data) => api.put(`/connections/${id}`, data),
  delete: (id) => api.delete(`/connections/${id}`),
  test: (id) => api.post(`/connections/${id}/test`),
  connect: (id) => api.post(`/connections/${id}/connect`),
  disconnect: (id) => api.post(`/connections/${id}/disconnect`),
};

export const schemaAPI = {
  getTree: (connectionId) => api.get(`/connections/${connectionId}/schema`),
  getTableInfo: (connectionId, schema, table) =>
    api.get(`/connections/${connectionId}/schema/${schema}/tables/${table}`),
  refresh: (connectionId) => api.post(`/connections/${connectionId}/schema/refresh`),
};

export const queryAPI = {
  execute: (connectionId, data) => api.post(`/connections/${connectionId}/query`, data),
  getHistory: (connectionId) => api.get(`/connections/${connectionId}/query/history`),
  clearHistory: (connectionId) => api.delete(`/connections/${connectionId}/query/history`),
};

export const dataAPI = {
  updateRow: (connectionId, data) => api.put(`/connections/${connectionId}/data/row`, data),
  insertRow: (connectionId, data) => api.post(`/connections/${connectionId}/data/row`, data),
  deleteRow: (connectionId, data) => api.delete(`/connections/${connectionId}/data/row`, { data }),
};

export const csvAPI = {
  export: (data) => api.post('/csv/export', data),
  validate: (data) => api.post('/csv/validate', data),
  import: (data) => api.post('/csv/import', data),
};

export const sessionAPI = {
  getState: () => api.get('/session/state'),
  save: (lastActive) => api.post('/session/save', { last_active: lastActive }),
  restore: () => api.post('/session/restore'),
  clear: () => api.delete('/session/clear'),
};

export default api;
