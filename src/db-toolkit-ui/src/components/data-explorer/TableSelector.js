/**
 * Table selector component
 */
import { Database, Table } from 'lucide-react';

export function TableSelector({ schema, selectedTable, onSelectTable }) {
  if (!schema?.schemas) {
    return (
      <div className="p-4 text-gray-500 dark:text-gray-400 text-sm">
        No schema loaded
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {Object.entries(schema.schemas).map(([schemaName, schemaData]) => (
        <div key={schemaName} className="mb-4">
          <div className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
            <Database size={16} />
            {schemaName}
          </div>
          {schemaData.tables && Object.keys(schemaData.tables).map((tableName) => (
            <button
              key={tableName}
              onClick={() => onSelectTable(schemaName, tableName)}
              className={`w-full flex items-center gap-2 px-6 py-2 text-sm transition ${
                selectedTable?.schema === schemaName && selectedTable?.table === tableName
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Table size={14} />
              {tableName}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
