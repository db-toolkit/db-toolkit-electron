/**
 * Custom table node for ER diagram
 */
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Key, Link } from 'lucide-react';

function TableNode({ data }) {
  console.log('TableNode rendering with data:', data);
  
  if (!data) {
    return <div className="bg-red-500 text-white p-4">No data</div>;
  }
  
  const { label, columns = [], schema } = data;

  const primaryKeys = columns.filter(col => 
    col.primary_key || col.name === 'id'
  );
  
  const foreignKeys = columns.filter(col => 
    col.foreign_key || col.name.endsWith('_id')
  );

  return (
    <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg min-w-[250px]">
      {/* Table Header */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-t-lg">
        <div className="font-bold text-lg">{label}</div>
        <div className="text-xs opacity-80">{schema}</div>
      </div>

      {/* Columns */}
      <div className="p-3 max-h-[300px] overflow-y-auto">
        {columns.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 italic">No columns</div>
        ) : (
          <div className="space-y-1">
            {columns.map((column, index) => {
              const isPK = primaryKeys.some(pk => pk.name === column.name);
              const isFK = foreignKeys.some(fk => fk.name === column.name);

              return (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {isPK && <Key size={14} className="text-yellow-600 dark:text-yellow-400" />}
                  {isFK && <Link size={14} className="text-blue-600 dark:text-blue-400" />}
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {column.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400 text-xs ml-auto">
                    {column.type || column.data_type}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connection Handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500" />
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-blue-500" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-blue-500" />
    </div>
  );
}

export default memo(TableNode);
