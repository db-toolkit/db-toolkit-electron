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
    
    const data = await ipc.invoke('schema:get-tree', connectionId);
    
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
    
    const data = await ipc.invoke('schema:get-table-info', connectionId, schema, table);
    
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
  getHistory: (connectionId) => ipc.invoke('query:get-history', connectionId),
  clearHistory: (connectionId) => ipc.invoke('query:clear-history', connectionId),
};

export const dataAPI = {
  updateRow: (connectionId, data) => ipc.invoke('data:update-row', connectionId, data),
  insertRow: (connectionId, data) => ipc.invoke('data:insert-row', connectionId, data),
  deleteRow: (connectionId, data) => ipc.invoke('data:delete-row', connectionId, data),
};

export const csvAPI = {
  export: (data) => ipc.invoke('export:csv', data),
  validate: (data) => ipc.invoke('export:validate-csv', data),
  import: (data) => ipc.invoke('export:import-csv', data),
};

export const sessionAPI = {
  getState: () => ipc.invoke('session:get-state'),
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
  getVersion: () => ipc.invoke('migrator:get-version'),
};

export const issuesAPI = {
  create: (data) => ipc.invoke('issues:create', data),
  getAll: () => ipc.invoke('issues:get-all'),
  getById: (id) => ipc.invoke('issues:get-by-id', id),
  updateStatus: (id, status) => ipc.invoke('issues:update-status', id, status),
  delete: (id) => ipc.invoke('issues:delete', id)
};

export const schemaAiAPI = {
  analyzeSchema: async (connectionId, schemaName) => {
    const schemaData = await ipc.invoke('schema:get-tree', connectionId);
    
    if (schemaData.schemas && schemaData.schemas[schemaName]) {
      const tables = schemaData.schemas[schemaName].tables;
      if (tables && Object.keys(tables).length > 0) {
        const firstTableName = Object.keys(tables)[0];
        const firstTable = tables[firstTableName];
        
        return ipc.invoke('ai:analyze-schema', {
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

export default { invoke: ipc.invoke };
