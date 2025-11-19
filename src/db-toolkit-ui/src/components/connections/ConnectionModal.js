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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(connection ? { ...formData, id: connection.id } : formData);
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Database Type
          </label>
          <select
            value={formData.db_type}
            onChange={(e) => handleChange('db_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
