import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useToast } from '../../contexts/ToastContext';

export function ScheduleModal({ isOpen, onClose, onSave, connections }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    connection_id: '',
    name: '',
    backup_type: 'full',
    schedule: 'daily',
    retention_count: 5,
    compressed: true,
    enabled: true,
    backup_path: '',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
    setFormData({
      connection_id: '',
      name: '',
      backup_type: 'full',
      schedule: 'daily',
      retention_count: 5,
      compressed: true,
      enabled: true,
      backup_path: '',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Backup">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Connection
          </label>
          <select
            value={formData.connection_id}
            onChange={(e) => handleChange('connection_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          >
            <option value="">Select connection</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name} ({conn.db_type})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Schedule Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Daily Backup"
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Backup Type
          </label>
          <select
            value={formData.backup_type}
            onChange={(e) => handleChange('backup_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="full">Full Backup</option>
            <option value="schema_only">Schema Only</option>
            <option value="data_only">Data Only</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Schedule
          </label>
          <select
            value={formData.schedule}
            onChange={(e) => handleChange('schedule', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <Input
          label="Retention Count"
          type="number"
          value={formData.retention_count}
          onChange={(e) => handleChange('retention_count', parseInt(e.target.value))}
          min="1"
          max="30"
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Backup Location
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.backup_path}
              onChange={(e) => handleChange('backup_path', e.target.value)}
              placeholder="Select folder for backups"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
              readOnly
            />
            <Button
              type="button"
              variant="secondary"
              icon={<FolderOpen size={16} />}
              onClick={async () => {
                try {
                  const folderPath = await window.electron.ipcRenderer.invoke('select-folder');
                  if (folderPath) {
                    handleChange('backup_path', folderPath);
                  }
                } catch (err) {
                  toast.error('Failed to select folder');
                }
              }}
            >
              Browse
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.compressed}
              onChange={(e) => handleChange('compressed', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Compress backups</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Enable schedule</span>
          </label>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit">Create Schedule</Button>
        </div>
      </form>
    </Modal>
  );
}
