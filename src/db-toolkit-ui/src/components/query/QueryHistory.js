import { useEffect } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { useQuery } from '../../hooks';
import { Button } from '../common/Button';

export function QueryHistory({ connectionId, onSelectQuery }) {
  const { history, fetchHistory, clearHistory } = useQuery(connectionId);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClear = async () => {
    if (window.confirm('Clear all query history?')) {
      await clearHistory();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Query History</h3>
        </div>
        {history.length > 0 && (
          <Button variant="outline" size="sm" icon={<Trash2 size={16} />} onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No query history</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((item, idx) => (
            <div
              key={idx}
              onClick={() => onSelectQuery(item.query)}
              className="p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate">{item.query}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{new Date(item.timestamp).toLocaleString()}</span>
                {item.success ? (
                  <span className="text-green-600 dark:text-green-400">{item.row_count} rows</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">Failed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
