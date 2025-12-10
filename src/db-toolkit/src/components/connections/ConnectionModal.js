import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

export function ConnectionModal({ isOpen, onClose, onSave, connection }) {
  const { settings } = useSettingsContext();
  const toast = useToast();
  const [testing, setTesting] = useState(false);
  const [useUrl, setUseUrl] = useState(false);
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    db_type: settings?.default_db_type || 'postgresql',
    host: 'localhost',
    port: 5432,
    database: '',
    username: '',
    password: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (connection) {
        setFormData({
          name: connection.name || '',
          db_type: connection.db_type || 'postgresql',
          host: connection.host || 'localhost',
          port: connection.port || 5432,
          database: connection.database || '',
          username: connection.username || '',
          password: connection.password || '',
        });
        setHasChanges(false);
      } else {
        // Try to restore draft for new connections
        const draft = localStorage.getItem('connection-draft');
        if (draft) {
          try {
            setFormData(JSON.parse(draft));
            setHasChanges(true);
          } catch {
            setFormData({
              name: '',
              db_type: settings?.default_db_type || 'postgresql',
              host: 'localhost',
              port: 5432,
              database: '',
              username: '',
              password: '',
            });
            setHasChanges(false);
          }
        } else {
          setFormData({
            name: '',
            db_type: settings?.default_db_type || 'postgresql',
            host: 'localhost',
            port: 5432,
            database: '',
            username: '',
            password: '',
          });
          setHasChanges(false);
        }
      }
    }
  }, [connection, isOpen, settings]);

  const handleChange = (field, value) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setHasChanges(true);
    
    // Auto-save draft for new connections only
    if (!connection) {
      localStorage.setItem('connection-draft', JSON.stringify(updated));
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      // For existing connections, update first
      if (connection) {
        await api.put(`/connections/${connection.id}`, formData);
      }
      
      // Test connection without creating duplicate
      const response = await api.post('/connections/test', formData);
      
      if (response.data.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error(response.data.message || 'Connection test failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const parseConnectionUrl = (url) => {
    try {
      if (!url.trim()) {
        toast.error('Database URL is required');
        return null;
      }

      // Handle SQLite special case
      if (url.startsWith('sqlite:///')) {
        const filePath = url.replace('sqlite:///', '');
        return {
          db_type: 'sqlite',
          database: filePath,
          host: '',
          port: 0,
          username: '',
          password: '',
        };
      }

      const urlObj = new URL(url);
      let protocol = urlObj.protocol.replace(':', '');
      
      // Handle async protocols
      const asyncProtocols = {
        'postgresql+asyncpg': 'postgresql',
        'postgres+asyncpg': 'postgresql',
        'mysql+aiomysql': 'mysql',
        'mongodb+srv': 'mongodb',
      };
      
      let dbType = asyncProtocols[protocol] || protocol;
      if (dbType === 'postgres') dbType = 'postgresql';
      
      // Validate supported database type
      if (!['postgresql', 'mysql', 'mongodb', 'sqlite'].includes(dbType)) {
        toast.error(`Unsupported database type: ${protocol}`);
        return null;
      }

      const defaultPorts = {
        postgresql: 5432,
        mysql: 3306,
        mongodb: 27017,
      };

      const database = urlObj.pathname.replace('/', '');
      if (!database) {
        toast.error('Database name is required in URL');
        return null;
      }
      
      const parsed = {
        db_type: dbType,
        host: urlObj.hostname || 'localhost',
        port: parseInt(urlObj.port) || defaultPorts[dbType] || 0,
        database,
        username: urlObj.username || '',
        password: urlObj.password || '',
      };
      
      // Auto-populate fields for immediate editing
      setFormData(prev => ({ ...prev, ...parsed }));
      toast.success('URL parsed successfully');
      
      return parsed;
    } catch (err) {
      toast.error('Invalid database URL format. Expected: protocol://user:pass@host:port/database');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(connection ? { ...formData, id: connection.id } : formData);
    
    // Clear draft after successful save
    localStorage.removeItem('connection-draft');
    setHasChanges(false);
    onClose();
  };
  
  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Discard them?')) {
        if (!connection) {
          localStorage.removeItem('connection-draft');
        }
        setHasChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={connection ? 'Edit Connection' : 'New Connection'}>
      <form onSubmit={handleSubmit}>
        <Input
          label="Connection Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useUrl}
              onChange={(e) => {
                const checked = e.target.checked;
                setUseUrl(checked);
                if (!checked) {
                  setDatabaseUrl('');
                }
              }}
              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Use Database URL
            </span>
          </label>
        </div>

        {useUrl ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Database URL
            </label>
            <textarea
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              onBlur={(e) => {
                if (e.target.value.trim()) {
                  parseConnectionUrl(e.target.value);
                }
              }}
              placeholder="postgresql://user:password@localhost:5432/database"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
              rows="3"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Examples: postgresql://user:pass@host:5432/db, postgresql+asyncpg://..., mysql+aiomysql://..., mongodb+srv://..., sqlite:///path/to/db.sqlite
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Database Type
              </label>
          <select
            value={formData.db_type}
            onChange={(e) => {
              const newType = e.target.value;
              const defaultPorts = {
                postgresql: 5432,
                mysql: 3306,
                mongodb: 27017,
                sqlite: 0
              };
              
              // Update both fields at once to trigger single re-render
              const updated = {
                ...formData,
                db_type: newType,
                port: defaultPorts[newType],
                // Clear fields not needed for SQLite
                ...(newType === 'sqlite' && {
                  host: '',
                  username: '',
                  password: ''
                })
              };
              setFormData(updated);
              setHasChanges(true);
              
              if (!connection) {
                localStorage.setItem('connection-draft', JSON.stringify(updated));
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="postgresql">PostgreSQL</option>
            <option value="mysql">MySQL</option>
            <option value="sqlite">SQLite</option>
            <option value="mongodb">MongoDB</option>
          </select>
            </div>

            {formData.db_type !== 'sqlite' && (
              <>
                <Input
                  label="Host"
                  value={formData.host}
                  onChange={(e) => handleChange('host', e.target.value)}
                  required
                />
                <Input
                  label="Port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => handleChange('port', parseInt(e.target.value))}
                  required
                />
              </>
            )}

            {formData.db_type === 'sqlite' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Database File
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.database}
                    onChange={(e) => handleChange('database', e.target.value)}
                    placeholder="/path/to/database.sqlite"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={async () => {
                      try {
                        const filePath = await window.electron.ipcRenderer.invoke('dialog:showOpenDialog', {
                          properties: ['openFile'],
                          filters: [
                            { name: 'SQLite Database', extensions: ['sqlite', 'sqlite3', 'db'] },
                            { name: 'All Files', extensions: ['*'] }
                          ]
                        });
                        if (filePath) {
                          handleChange('database', filePath);
                        }
                      } catch (err) {
                        toast.error('Failed to open file dialog');
                      }
                    }}
                  >
                    Browse
                  </Button>
                </div>
              </div>
            ) : (
              <Input
                label="Database"
                value={formData.database}
                onChange={(e) => handleChange('database', e.target.value)}
              />
            )}

            {formData.db_type !== 'sqlite' && (
              <>
                <Input
                  label="Username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  required
                />
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <div className="flex gap-2 justify-between mt-6">
          <Button 
            variant="secondary" 
            onClick={handleTest} 
            type="button"
            disabled={testing || !formData.name || !formData.database}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button type="submit">{connection ? 'Save Changes' : 'Create Connection'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
