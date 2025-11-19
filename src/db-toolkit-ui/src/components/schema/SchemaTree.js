import { useState } from 'react';
import { ChevronRight, ChevronDown, Database, Table, Search } from 'lucide-react';
import { useDebounce } from '../../utils/debounce';

export function SchemaTree({ schema, onTableClick }) {
  const [expandedSchemas, setExpandedSchemas] = useState({});
  const [selectedTable, setSelectedTable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const toggleSchema = (schemaName) => {
    setExpandedSchemas((prev) => ({ ...prev, [schemaName]: !prev[schemaName] }));
  };

  const handleTableClick = (schemaName, tableName) => {
    setSelectedTable(`${schemaName}.${tableName}`);
    onTableClick(schemaName, tableName);
  };

  if (!schema || !schema.schemas) return null;

  const filteredSchemas = Object.entries(schema.schemas).reduce((acc, [schemaName, schemaData]) => {
    const tables = schemaData?.tables || {};
    const filteredTables = Object.keys(tables).filter(tableName => 
      tableName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      schemaName.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    
    if (filteredTables.length > 0) {
      acc[schemaName] = { ...schemaData, tables: filteredTables.reduce((t, name) => ({ ...t, [name]: tables[name] }), {}) };
    }
    return acc;
  }, {});

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Tables</h3>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {Object.entries(filteredSchemas).map(([schemaName, schemaData]) => {
          const tables = schemaData?.tables || {};
          const tableNames = Object.keys(tables);
          const tableCount = schemaData?.table_count || tableNames.length;
          
          return (
            <div key={schemaName}>
              <div
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700/50"
                onClick={() => toggleSchema(schemaName)}
              >
                {expandedSchemas[schemaName] ? 
                  <ChevronDown size={16} className="text-gray-500 dark:text-gray-400" /> : 
                  <ChevronRight size={16} className="text-gray-500 dark:text-gray-400" />
                }
                <Database size={16} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{schemaName}</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-500">{tableCount}</span>
              </div>

              {expandedSchemas[schemaName] && (
                <div className="bg-gray-50 dark:bg-gray-900/30">
                  {tableNames.map((tableName) => {
                    const tableKey = `${schemaName}.${tableName}`;
                    const isSelected = selectedTable === tableKey;
                    return (
                      <div
                        key={tableName}
                        className={`flex items-center gap-2 pl-9 pr-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700/50 ${
                          isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleTableClick(schemaName, tableName)}
                      >
                        <Table size={14} className="text-green-600 dark:text-green-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{tableName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
