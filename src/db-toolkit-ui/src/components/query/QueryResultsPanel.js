import { useState } from 'react';
import { Table, MessageSquare, History, Clock } from 'lucide-react';
import { EditableTable } from '../data/EditableTable';
import { QueryHistory } from './QueryHistory';

export function QueryResultsPanel({ connectionId, result, executionTime, onSelectQuery, onRefresh }) {
  const [activeTab, setActiveTab] = useState('results');

  const tabs = [
    { id: 'results', label: 'Results', icon: Table },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === 'results' && (
          <div className="h-full">
            {result ? (
              <EditableTable
                connectionId={connectionId}
                result={result}
                onRefresh={onRefresh}
              />
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
          <div className="p-4">
            {result ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Clock size={16} />
                  <span>Execution time: {executionTime || 0}ms</span>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Rows returned: {result.rows?.length || 0}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Query executed successfully
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No messages
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="h-full">
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
