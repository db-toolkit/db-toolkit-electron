import { useState } from 'react';
import { Upload } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { csvAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export function CsvImportModal({ isOpen, onClose, connectionId, schema, table, onSuccess }) {
  const [file, setFile] = useState(null);
  const [delimiter, setDelimiter] = useState(',');
  const [hasHeaders, setHasHeaders] = useState(true);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
    } else {
      showToast('Please select a valid CSV file', 'error');
    }
  };

  const handleImport = async () => {
    if (!file) {
      showToast('Please select a file', 'error');
      return;
    }

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csvContent = e.target.result;
        
        const response = await csvAPI.import({
          connection_id: connectionId,
          schema_name: schema,
          table_name: table,
          csv_content: csvContent,
          delimiter,
          has_headers: hasHeaders,
        });

        showToast(`Imported ${response.data.rows_imported} rows`, 'success');
        onSuccess?.();
        onClose();
      };
      reader.readAsText(file);
    } catch (error) {
      showToast(error.response?.data?.detail || 'Import failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import from CSV">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            CSV File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700"
          />
          {file && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Selected: {file.name}
            </p>
          )}
        </div>

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
            checked={hasHeaders}
            onChange={(e) => setHasHeaders(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">First row contains headers</span>
        </label>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleImport} loading={loading} disabled={!file}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>
    </Modal>
  );
}
