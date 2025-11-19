import { Download, Trash2, RotateCcw, Database, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';

export function BackupCard({ backup, onRestore, onDownload, onDelete }) {
  const formatSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(2)} KB` : `${mb.toFixed(2)} MB`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const getStatusIcon = () => {
    switch (backup.status) {
      case 'completed':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'failed':
        return <XCircle className="text-red-500" size={20} />;
      case 'in_progress':
        return <Clock className="text-blue-500 animate-spin" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-start gap-3 mb-3">
        <Database className="text-blue-600 dark:text-blue-400 mt-1" size={24} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{backup.name}</h3>
            {getStatusIcon()}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{backup.backup_type.replace('_', ' ')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {formatDate(backup.created_at)} • {formatSize(backup.file_size)}
          </p>
          {backup.compressed && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
              Compressed
            </span>
          )}
        </div>
      </div>

      {backup.status === 'in_progress' && (
        <div className="mb-3">
          <ProgressBar progress={backup.progress || 50} label="Backing up..." size="sm" />
        </div>
      )}

      {backup.error_message && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
          {backup.error_message}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          variant="success"
          size="sm"
          icon={<RotateCcw size={16} />}
          onClick={() => onRestore(backup.id)}
          disabled={backup.status !== 'completed'}
        >
          Restore
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={16} />}
          onClick={() => onDownload(backup.id, backup.file_path.split('/').pop())}
          disabled={backup.status !== 'completed'}
        >
          Download
        </Button>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(backup.id)}
          className="!px-2"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  );
}
