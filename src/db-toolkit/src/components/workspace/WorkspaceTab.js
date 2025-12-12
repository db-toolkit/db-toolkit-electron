/**
 * Individual Workspace Tab Component
 */
import { X } from 'lucide-react';
import { Database } from 'lucide-react';

export function WorkspaceTab({ workspace, isActive, onClick, onClose }) {
    const handleClose = (e) => {
        e.stopPropagation();
        onClose(workspace.id);
    };

    return (
        <div
            onClick={() => onClick(workspace.id)}
            className={`
        group flex items-center gap-2 px-3 py-2 cursor-pointer transition-all
        border-b-2 min-w-[120px] max-w-[200px]
        ${isActive
                    ? 'border-green-500 bg-white dark:bg-gray-800'
                    : 'border-transparent bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
      `}
        >
            {/* Connection Type Icon */}
            <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: workspace.color }}
            />

            {/* Database Icon */}
            <Database size={14} className={`flex-shrink-0 ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`} />

            {/* Workspace Name */}
            <span className={`
        text-sm font-medium truncate flex-1
        ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}
      `}>
                {workspace.connectionName}
            </span>

            {/* Close Button */}
            <button
                onClick={handleClose}
                className={`
          flex-shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition
          ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}
            >
                <X size={14} className="text-gray-500 dark:text-gray-400" />
            </button>
        </div>
    );
}
