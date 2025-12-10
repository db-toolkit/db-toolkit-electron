import { localStorageService } from '../utils/localStorage';
import { CACHE_TTL, CACHE_KEYS } from '../utils/constants';
import { cacheService } from './indexedDB';

// IPC API wrapper
const ipc = {
  invoke: (channel, ...args) => window.electron.ipcRenderer.invoke(channel, ...args)
};

export const connectionsAPI = {
  getAll: async () => {
    const cached = localStorageService.get(CACHE_KEYS.CONNECTIONS);
    if (cached) {
      return { data: cached };
    }
    
    const data = await ipc.invoke('connections:getAll');
    localStorageService.set(CACHE_KEYS.CONNECTIONS, data, CACHE_TTL.CONNECTIONS);
    return { data };
  },
  create: async (data) => {
    const result = await ipc.invoke('connections:create', data);
    localStorageService.remove(CACHE_KEYS.CONNECTIONS);
    return { data: result };
  },
  update: async (id, data) => {
    const result = await ipc.invoke('connections:update', id, data);
    localStorageService.remove(CACHE_KEYS.CONNECTIONS);
    return { data: result };
  },
  delete: async (id) => {
    const result = await ipc.invoke('connections:delete', id);
    localStorageService.remove(CACHE_KEYS.CONNECTIONS);
    localStorageService.clearConnection(id);
    return { data: result };
  },
  test: (data) => ipc.invoke('connections:test', data),
  connect: (id) => ipc.invoke('connections:connect', id),
  disconnect: async (id) => {
    const result = await ipc.invoke('connections:disconnect', id);
    localStorageService.clearConnection(id);
    return { data: result };
  },
};

export const schemaAPI = {
  getTree: async (connectionId, useCache = true) => {
    if (useCache) {
      try {
        const cached = await cacheService.getSchema(connectionId);
        if (cached) {
          return { data: cached };
        }

        const localCached = localStorageService.getForConnection(connectionId, CACHE_KEYS.SCHEMA);
        if (localCached) {
          await cacheService.setSchema(connectionId, localCached);
          return { data: localCached };
        }
      } catch (err) {
        console.error('Cache read error:', err);
      }
    }
    
    const data = await ipc.invoke('schema:getTree', connectionId);
    
    try {
      await cacheService.setSchema(connectionId, data);
    } catch (err) {
      console.error('Cache write error:', err);
      localStorageService.setForConnection(
        connectionId,
        CACHE_KEYS.SCHEMA,
        data,
        CACHE_TTL.SCHEMA
      );
    }
    
    return { data };
  },
  
  getTableInfo: async (connectionId, schema, table) => {
    const cacheKey = `${CACHE_KEYS.TABLE_INFO}_${schema}_${table}`;
    
    try {
      const cached = await cacheService.getTableInfo(connectionId, schema, table);
      if (cached) {
        return { data: cached };
      }

      const localCached = localStorageService.getForConnection(connectionId, cacheKey);
      if (localCached) {
        await cacheService.setTableInfo(connectionId, schema, table, localCached);
        return { data: localCached };
      }
    } catch (err) {
      console.error('Cache read error:', err);
    }
    
    const data = await ipc.invoke('schema:getTableInfo', connectionId, schema, table);
    
    try {
      await cacheService.setTableInfo(connectionId, schema, table, data);
    } catch (err) {
      console.error('Cache write error:', err);
      localStorageService.setForConnection(
        connectionId,
        cacheKey,
        data,
        CACHE_TTL.TABLE_INFO
      );
    }
    
    return { data };
  },
  
  refresh: async (connectionId) => {
    try {
      await cacheService.clearConnection(connectionId);
    } catch (err) {
      console.error('IndexedDB clear error:', err);
    }
    localStorageService.clearConnection(connectionId);
    return ipc.invoke('schema:refresh', connectionId);
  },
};

export const queryAPI = {
  execute: (connectionId, data) => ipc.invoke('query:execute', connectionId, data),
  explain: (connectionId, data) => ipc.invoke('query:explain', connectionId, data),
  getHistory: (connectionId) => ipc.invoke('query:getHistory', connectionId),
  clearHistory: (connectionId) => ipc.invoke('query:clearHistory', connectionId),
  deleteQuery: (connectionId, index) => ipc.invoke('query:deleteQuery', connectionId, index),
};

export const dataAPI = {
  updateRow: (connectionId, data) => ipc.invoke('data:updateRow', connectionId, data),
  insertRow: (connectionId, data) => ipc.invoke('data:insertRow', connectionId, data),
  deleteRow: (connectionId, data) => ipc.invoke('data:deleteRow', connectionId, data),
  browse: (connectionId, data) => ipc.invoke('dataExplorer:browse', connectionId, data),
  count: (connectionId, schemaName, tableName) => ipc.invoke('dataExplorer:count', connectionId, schemaName, tableName),
  cell: (connectionId, data) => ipc.invoke('dataExplorer:cell', connectionId, data),
};

export const csvAPI = {
  export: (data) => ipc.invoke('export:csv', data),
  validate: (data) => ipc.invoke('import:validateCSV', data),
  import: (data) => ipc.invoke('import:csv', data),
};

export const sessionAPI = {
  getState: () => ipc.invoke('session:getState'),
  save: (lastActive) => ipc.invoke('session:save', lastActive),
  restore: () => ipc.invoke('session:restore'),
  clear: () => ipc.invoke('session:clear'),
};

export const settingsAPI = {
  get: () => ipc.invoke('settings:get'),
  update: (data) => ipc.invoke('settings:update', data),
  reset: () => ipc.invoke('settings:reset'),
};

export const migratorAPI = {
  execute: (command) => ipc.invoke('migrator:execute', command),
  getVersion: () => ipc.invoke('migrator:version'),
};

export const issuesAPI = {
  create: (data) => ipc.invoke('issues:create', data),
  getAll: () => ipc.invoke('issues:list'),
  getById: (id) => ipc.invoke('issues:get', id),
  updateStatus: (id, status) => ipc.invoke('issues:update', id, status),
  delete: (id) => ipc.invoke('issues:delete', id)
};

export const schemaAiAPI = {
  analyzeSchema: async (connectionId, schemaName) => {
    const schemaData = await ipc.invoke('schema:getTree', connectionId);
    
    if (schemaData.schemas && schemaData.schemas[schemaName]) {
      const tables = schemaData.schemas[schemaName].tables;
      if (tables && Object.keys(tables).length > 0) {
        const firstTableName = Object.keys(tables)[0];
        const firstTable = tables[firstTableName];
        
        return ipc.invoke('ai:analyze-table', {
          connection_id: connectionId, 
          table_name: firstTableName,
          columns: firstTable.columns || []
        });
      }
    }
    throw new Error('No tables found in schema');
  },
  analyzeTable: (connectionId, tableName, columns) => 
    ipc.invoke('ai:analyze-table', {
      connection_id: connectionId, 
      table_name: tableName,
      columns: columns || []
    }),
};

// Legacy API object for backward compatibility
const api = {
  invoke: ipc.invoke,
  post: async (url, data) => {
    if (url.includes('/data/browse')) {
      const connectionId = url.split('/')[2];
      const result = await ipc.invoke('dataExplorer:browse', connectionId, data);
      return { data: result };
    }
    throw new Error(`Unsupported API call: ${url}`);
  },
  get: async (url, options) => {
    if (url.includes('/data/count')) {
      const connectionId = url.split('/')[2];
      const { schema_name, table_name } = options.params;
      const result = await ipc.invoke('dataExplorer:count', connectionId, schema_name, table_name);
      return { data: result };
    }
    throw new Error(`Unsupported API call: ${url}`);
  },
  put: async (url, data) => {
    if (url.includes('/data/row')) {
      const connectionId = url.split('/')[2];
      const result = await ipc.invoke('data:updateRow', connectionId, data);
      return { data: result };
    }
    throw new Error(`Unsupported API call: ${url}`);
  }
};

export default api;
