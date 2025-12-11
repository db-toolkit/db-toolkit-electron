/**
 * Custom table node for ER diagram
 */
import { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Key, Link, ChevronDown, ChevronRight, Columns } from 'lucide-react';

function TableNode({ data }) {
  if (!data) return null;

  const { label, columns = [], schema, forceCollapse } = data;
  // Default to collapsed if more than 10 columns
  const [isCollapsed, setIsCollapsed] = useState(columns.length > 10);

  // Sync with global forceCollapse prop if it changes
  useEffect(() => {
    if (forceCollapse !== undefined) {
      setIsCollapsed(forceCollapse);
    }
  }, [forceCollapse]);

  const primaryKeys = columns.filter(col =>
    col && (col.primary_key || col.name === 'id')
  );

  const foreignKeys = columns.filter(col =>
    col && col.name && (col.foreign_key || (typeof col.name === 'string' && col.name.endsWith('_id')))
  );

  const visibleColumns = isCollapsed
    ? columns.filter(col =>
      primaryKeys.some(pk => pk.name === col.name) ||
      foreignKeys.some(fk => fk.name === col.name)
    )
    : columns;

  const hasHiddenColumns = columns.length > visibleColumns.length;

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-[250px] transition-all duration-200">
      {/* Table Header */}
      <div
        className="bg-green-600 dark:bg-green-700 text-white px-3 py-2 rounded-t-lg flex items-center justify-between cursor-pointer hover:bg-green-700 dark:hover:bg-green-800 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex flex-col overflow-hidden">
          <div className="font-bold text-lg truncate" title={label}>{label}</div>
          <div className="text-xs opacity-80 truncate" title={schema}>{schema}</div>
        </div>
        <div className="flex items-center ml-2">
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Columns */}
      <div className={`p-2 overflow-y-auto transition-all duration-200 ${isCollapsed ? 'max-h-[150px]' : 'max-h-[400px]'}`}>
        {columns.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic p-2">No columns</div>
        ) : (
          <div className="space-y-1">
            {visibleColumns.map((column, index) => {
              const isPK = primaryKeys.some(pk => pk.name === column.name);
              const isFK = foreignKeys.some(fk => fk.name === column.name);

              return (
                <div
                  key={`${column.name}-${index}`}
                  className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 group"
                >
                  <div className="w-4 flex justify-center">
                    {isPK && <Key size={12} className="text-yellow-600 dark:text-yellow-400" />}
                    {isFK && <Link size={12} className="text-green-600 dark:text-green-400" />}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate flex-1" title={column.name}>
                    {column.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-2 font-mono">
                    {column.type || column.data_type}
                  </span>
                </div>
              );
            })}

            {hasHiddenColumns && (
              <div
                className="text-xs text-center text-gray-500 dark:text-gray-400 py-1 italic hover:text-green-600 dark:hover:text-green-400 cursor-pointer border-t border-gray-100 dark:border-gray-700 mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCollapsed(false);
                }}
              >
                + {columns.length - visibleColumns.length} more columns
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-green-500 border-2 border-white dark:border-gray-800" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-green-500 border-2 border-white dark:border-gray-800" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-green-500 border-2 border-white dark:border-gray-800" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-green-500 border-2 border-white dark:border-gray-800" />
    </div>
  );
}

export default memo(TableNode);
