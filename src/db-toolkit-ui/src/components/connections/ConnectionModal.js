import { useState, useEffect } from 'react';
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
    }
  }, [connection, isOpen]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const savedConnection = connection
        ? await api.put(`/connections/${connection.id}`, formData)
        : await api.post('/connections', formData);
      
      const response = await api.post(`/connections/${savedConnection.data.id}/test`);
      
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
      
      return {
        db_type: dbType,
        host: urlObj.hostname || 'localhost',
        port: parseInt(urlObj.port) || defaultPorts[dbType] || 0,
        database,
        username: urlObj.username || '',
        password: urlObj.password || '',
      };
    } catch (err) {
      toast.error('Invalid database URL format. Expected: protocol://user:pass@host:port/database');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let dataToSave = formData;
    if (useUrl) {
      const parsed = parseConnectionUrl(databaseUrl);
      if (!parsed) return;
      dataToSave = { ...formData, ...parsed };
    }
    
    await onSave(connection ? { ...dataToSave, id: connection.id } : dataToSave);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={connection ? 'Edit Connection' : 'New Connection'}>
      <form onSubmit={handleSubmit}>
        <Input
          label="Connection Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useUrl}
              onChange={(e) => setUseUrl(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
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
              handleChange('db_type', newType);
              handleChange('port', defaultPorts[newType]);
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
            />
            <Input
              label="Port"
              type="number"
              value={formData.port}
              onChange={(e) => handleChange('port', parseInt(e.target.value))}
            />
              </>
            )}

            <Input
          label="Database"
          value={formData.database}
          onChange={(e) => handleChange('database', e.target.value)}
          required
        />

            {formData.db_type !== 'sqlite' && (
              <>
                <Input
                  label="Username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                />
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                />
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
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit">{connection ? 'Save Changes' : 'Create Connection'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
