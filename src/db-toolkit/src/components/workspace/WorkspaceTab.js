/**
 * Individual Workspace Tab Component
 */
import { X, Database, Edit2, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const ipc = {
    invoke: (channel, ...args) => window.electron.ipcRenderer.invoke(channel, ...args)
};

export function WorkspaceTab({ workspace, isActive, onClick, onClose, onUpdate }) {
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [isRenaming, setIsRenaming] = useState(false);
    const [newName, setNewName] = useState(workspace.connectionName);
    const menuRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowContextMenu(false);
            }
        };
        if (showContextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showContextMenu]);

    const handleClose = (e) => {
        e.stopPropagation();
        onClose(workspace.id);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPosition({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    const handleRename = async () => {
        setShowContextMenu(false);
        setIsRenaming(true);
    };

    const handleRenameSubmit = async () => {
        if (newName.trim() && newName !== workspace.connectionName) {
            await onUpdate(workspace.id, { connectionName: newName.trim() });
        }
        setIsRenaming(false);
    };

    const handleRenameKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleRenameSubmit();
        } else if (e.key === 'Escape') {
            setNewName(workspace.connectionName);
            setIsRenaming(false);
        }
    };

    const handleDelete = async () => {
        setShowContextMenu(false);
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
            {isRenaming ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleRenameKeyDown}
                    className="text-sm font-medium flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-green-500 rounded px-1 outline-none"
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <span
                    onContextMenu={handleContextMenu}
                    className={`
        text-sm font-medium truncate flex-1
        ${isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}
      `}>
                    {workspace.connectionName}
                </span>
            )}

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

            {/* Context Menu */}
            {showContextMenu && (
                <div
                    ref={menuRef}
                    className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 min-w-[150px]"
                    style={{ left: menuPosition.x, top: menuPosition.y }}
                >
                    <button
                        onClick={handleRename}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Edit2 size={14} />
                        Rename
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}
