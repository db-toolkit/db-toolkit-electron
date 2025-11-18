import { Database, Trash2, Play, Circle, Edit } from 'lucide-react';
import { Button } from '../common/Button';

export function ConnectionCard({ connection, onConnect, onDelete, onEdit, isActive }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg transition">
      <div className="flex items-start gap-3 mb-4">
        <Database className="text-blue-600 dark:text-blue-400 mt-1" size={24} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{connection.name}</h3>
            <Circle
              size={8}
              className={isActive ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{connection.db_type}</p>
          {connection.host && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {connection.host}:{connection.port}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="success"
          size="sm"
          icon={<Play size={16} />}
          onClick={() => onConnect(connection.id)}
          className="flex-1 !text-white"
        >
          Connect
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<Edit size={16} />}
          onClick={() => onEdit(connection)}
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={16} />}
          onClick={() => onDelete(connection.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
