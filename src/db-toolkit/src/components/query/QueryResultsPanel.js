import { useState } from 'react';
import { Table, MessageSquare, History, Clock, Bot } from 'lucide-react';
import { EditableTable } from '../data/EditableTable';
import { QueryHistory } from './QueryHistory';

export function QueryResultsPanel({ connectionId, result, executionTime, onSelectQuery, onRefresh, currentQuery, onFixError }) {
  const [activeTab, setActiveTab] = useState('results');
  const [displayLimit, setDisplayLimit] = useState(() => {
    return parseInt(localStorage.getItem('query-display-limit') || '100');
  });

  // Extract table name from query
  const extractTableInfo = (query) => {
    if (!query) return { table: 'table_name', schema: 'public' };
    // Match: FROM schema.table or FROM table or FROM "schema"."table"
    const match = query.match(/FROM\s+(?:([\w"]+)\.)?([\w"]+)/i);
    if (match) {
      const schema = match[1] ? match[1].replace(/"/g, '') : 'public';
      const table = match[2].replace(/"/g, '');
      return { schema, table };
    }
    return { table: 'table_name', schema: 'public' };
  };

  const { schema, table } = extractTableInfo(currentQuery);

  const handleLimitChange = (newLimit) => {
    setDisplayLimit(newLimit);
    localStorage.setItem('query-display-limit', newLimit.toString());
  };

  const displayedRows = result?.rows?.slice(0, displayLimit) || [];
  const totalRows = result?.rows?.length || 0;

  const tabs = [
    { id: 'results', label: 'Results', icon: Table },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === tab.id
                  ? 'border-green-500 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        {activeTab === 'results' && totalRows > 0 && (
          <div className="flex items-center gap-2 px-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Show:</span>
            <select
              value={displayLimit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
              <option value={100}>100 rows</option>
              <option value={500}>500 rows</option>
              <option value={1000}>1000 rows</option>
              <option value={totalRows}>All ({totalRows})</option>
            </select>
            {totalRows > displayLimit && (
              <span className="text-xs">Showing {displayLimit} of {totalRows}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'results' && (
          <div className="h-full overflow-y-auto overscroll-contain">
            {result ? (
              result.success === false || result.error ? (
                <div className="flex items-center justify-center h-full p-4">
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-2xl">
                    <h4 className="text-red-800 dark:text-red-400 font-semibold mb-2">Query Error</h4>
                    <p className="text-red-700 dark:text-red-300 text-sm whitespace-pre-wrap mb-4">{result.error}</p>
                    <button
                      onClick={() => onFixError && onFixError(result.error)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors text-sm font-medium"
                    >
                      <Bot size={16} />
                      Fix with AI
                    </button>
                  </div>
                </div>
              ) : (
                <EditableTable
                  connectionId={connectionId}
                  result={{ ...result, rows: displayedRows }}
                  onRefresh={onRefresh}
                  tableName={table}
                  schemaName={schema}
                />
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <Table size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Run a query to see results</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="p-4 h-full overflow-y-auto overscroll-contain">
            {result ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Clock size={16} />
                  <span>Execution time: {result.execution_time || executionTime || 0}ms</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Rows returned: {result.total_rows || result.rows?.length || 0}
                </div>
                {result.success === false || result.error ? (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Query failed: {result.error}
                  </div>
                ) : (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    Query executed successfully
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No messages
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="h-full overflow-y-auto overscroll-contain">
            <QueryHistory
              connectionId={connectionId}
              onSelectQuery={onSelectQuery}
            />
          </div>
        )}
      </div>
    </div>
  );
}
