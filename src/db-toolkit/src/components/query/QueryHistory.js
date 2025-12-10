import { useEffect, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { useQuery } from '../../hooks';
import { Button } from '../common/Button';
import { queryAPI } from '../../services/api';

export function QueryHistory({ connectionId, onSelectQuery }) {
  const { history, fetchHistory, clearHistory } = useQuery(connectionId);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleClear = async () => {
    if (window.confirm('Clear all query history?')) {
      await clearHistory();
    }
  };

  const handleDeleteQuery = async (index, e) => {
    e.stopPropagation();
    try {
      await queryAPI.deleteQuery(connectionId, index);
      await fetchHistory();
    } catch (error) {
      console.error('Failed to delete query:', error);
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
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group"
            >
              <p className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate pr-8">{item.query}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{new Date(item.timestamp * 1000).toLocaleString()}</span>
                {item.success ? (
                  <span className="text-green-600 dark:text-green-400">{item.row_count} rows</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">Failed</span>
                )}
              </div>
              {hoveredIndex === idx && (
                <button
                  onClick={(e) => handleDeleteQuery(idx, e)}
                  className="absolute top-2 right-2 p-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete query"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}