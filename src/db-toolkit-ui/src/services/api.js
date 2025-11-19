import axios from 'axios';
import { localStorageService } from '../utils/localStorage';
import { CACHE_TTL, CACHE_KEYS } from '../utils/constants';

const API_BASE_URL = 'http://localhost:8001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const connectionsAPI = {
  getAll: async () => {
    // Check cache first
    const cached = localStorageService.get(CACHE_KEYS.CONNECTIONS);
    if (cached) {
      return { data: cached };
    }
    
    // Fetch from API
    const response = await api.get('/connections');
    
    // Cache the result
    localStorageService.set(CACHE_KEYS.CONNECTIONS, response.data, CACHE_TTL.CONNECTIONS);
    
    return response;
  },
  create: async (data) => {
    const response = await api.post('/connections', data);
    // Clear connections cache
    localStorageService.remove(CACHE_KEYS.CONNECTIONS);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/connections/${id}`, data);
    // Clear connections cache
    localStorageService.remove(CACHE_KEYS.CONNECTIONS);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/connections/${id}`);
    // Clear connections cache and connection-specific cache
    localStorageService.remove(CACHE_KEYS.CONNECTIONS);
    localStorageService.clearConnection(id);
    return response;
  },
  test: (id) => api.post(`/connections/${id}/test`),
  connect: (id) => api.post(`/connections/${id}/connect`),
  disconnect: async (id) => {
    const response = await api.post(`/connections/${id}/disconnect`);
    // Clear connection-specific cache
    localStorageService.clearConnection(id);
    return response;
  },
};

export const schemaAPI = {
  getTree: async (connectionId, useCache = true) => {
    // Check cache first
    if (useCache) {
      const cached = localStorageService.getForConnection(connectionId, CACHE_KEYS.SCHEMA);
      if (cached) {
        return { data: cached };
      }
    }
    
    // Fetch from API
    const response = await api.get(`/connections/${connectionId}/schema`);
    
    // Cache the result
    localStorageService.setForConnection(
      connectionId,
      CACHE_KEYS.SCHEMA,
      response.data,
      CACHE_TTL.SCHEMA
    );
    
    return response;
  },
  
  getTableInfo: async (connectionId, schema, table) => {
    const cacheKey = `${CACHE_KEYS.TABLE_INFO}_${schema}_${table}`;
    
    // Check cache first
    const cached = localStorageService.getForConnection(connectionId, cacheKey);
    if (cached) {
      return { data: cached };
    }
    
    // Fetch from API
    const response = await api.get(`/connections/${connectionId}/schema/${schema}/tables/${table}`);
    
    // Cache the result
    localStorageService.setForConnection(
      connectionId,
      cacheKey,
      response.data,
      CACHE_TTL.TABLE_INFO
    );
    
    return response;
  },
  
  refresh: async (connectionId) => {
    // Clear cache for this connection
    localStorageService.clearConnection(connectionId);
    return api.post(`/connections/${connectionId}/schema/refresh`);
  },
};

export const queryAPI = {
  execute: (connectionId, data) => api.post(`/connections/${connectionId}/query`, data),
  explain: (connectionId, data) => api.post(`/connections/${connectionId}/query/explain`, data),
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

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  reset: () => api.post('/settings/reset'),
};

export const migratorAPI = {
  execute: (command) => api.post('/execute', { command }),
  getVersion: () => api.get('/version'),
};

export default api;
