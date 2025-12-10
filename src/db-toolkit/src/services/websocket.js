// IPC event channels
export const WS_ENDPOINTS = {
  ANALYTICS: 'analytics:update',
  BACKUPS: 'backup:update',
  TERMINAL: 'terminal:update',
  MIGRATOR: 'migrator:update',
};

// IPC WebSocket replacement
export class IPCWebSocket {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.onopen = null;
    this.onmessage = null;
    this.onerror = null;
    this.onclose = null;
    this.connectionId = null;
    
    // Set up IPC listener
    if (window.electron?.ipcRenderer?.on) {
      window.electron.ipcRenderer.on(this.endpoint, (event, data) => {
        if (this.onmessage) {
          // Extract the actual data from the IPC message
          const messageData = data.data || data;
          this.onmessage({ data: JSON.stringify(messageData) });
        }
      });
    }
    
    // Simulate connection open
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 100);
  }
  
  send(data) {
    if (this.endpoint === 'analytics:update') {
      const parsed = JSON.parse(data);
      this.connectionId = parsed.connection_id;
      window.electron?.ipcRenderer?.invoke('analytics:stream:start', parsed.connection_id);
    }
  }
  
  close(code = 1000, reason = '') {
    if (this.endpoint === 'analytics:stream' && this.connectionId) {
      window.electron?.ipcRenderer?.invoke('analytics:stream:stop', this.connectionId);
    }
    
    if (window.electron?.ipcRenderer?.removeAllListeners) {
      window.electron.ipcRenderer.removeAllListeners(this.endpoint);
    }
    
    if (this.onclose) {
      this.onclose({ code, reason });
    }
  }
}

// Replace global WebSocket with IPC version
if (typeof window !== 'undefined') {
  window.WebSocket = class {
    constructor(url) {
      if (url.includes('analytics')) {
        return new IPCWebSocket('analytics:update');
      } else if (url.includes('backups')) {
        return new IPCWebSocket('backup:stream');
      } else if (url.includes('migrator')) {
        return new IPCWebSocket('migrator:stream');
      } else {
        return new IPCWebSocket('terminal:stream');
      }
    }
  };
}
