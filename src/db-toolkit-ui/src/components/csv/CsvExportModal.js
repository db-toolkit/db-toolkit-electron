import { useState } from 'react';
import { Download } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { csvAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export function CsvExportModal({ isOpen, onClose, connectionId, query }) {
  const [filename, setFilename] = useState('export.csv');
  const [delimiter, setDelimiter] = useState(',');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleExport = async () => {
    if (!filename.trim()) {
      toast.error('Please enter a filename');
      return;
    }

    if (!query.trim()) {
      toast.error('No query to export');
      return;
    }

    setLoading(true);
    try {
      const response = await csvAPI.export({
        connection_id: connectionId,
        query,
        table: '',
      });

      const blob = new Blob([response.data.csv_content], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Exported ${response.data.row_count} rows`);
      onClose();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Export failed';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export to CSV">
      <div className="space-y-4">
        <Input
          label="Filename"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="export.csv"
        />

        <Input
          label="Delimiter"
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value)}
          placeholder=","
          maxLength={1}
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={includeHeaders}
            onChange={(e) => setIncludeHeaders(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Include headers</span>
        </label>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} loading={loading}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </Modal>
  );
}
