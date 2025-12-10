import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Server, 
  FileText, 
  BookOpen,
  Plus,
  RefreshCw,
  Terminal
} from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, connections, queries }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const actions = [
    { id: 'new-query', name: 'New Query', icon: Plus, action: () => navigate('/query') },
    { id: 'new-backup', name: 'Create Backup', icon: RefreshCw, action: () => navigate('/backups') },
    { id: 'migrations', name: 'Open Migrations', icon: Terminal, action: () => navigate('/migrations') },
    { id: 'docs', name: 'View Documentation', icon: BookOpen, action: () => navigate('/docs') },
  ];

  const connectionItems = (connections || []).map(conn => ({
    id: `conn-${conn.id}`,
    name: conn.name,
    subtitle: `${conn.type} - ${conn.host}`,
    icon: Server,
    action: () => {
      window.electron.ipcRenderer.send('connect-database', conn);
      navigate('/');
    }
  }));

  const queryItems = (queries || []).map(query => ({
    id: `query-${query.id}`,
    name: query.name || 'Untitled Query',
    subtitle: query.sql?.substring(0, 50) + '...',
    icon: FileText,
    action: () => navigate(`/query?id=${query.id}`)
  }));

  const allItems = [...actions, ...connectionItems, ...queryItems];

  const filtered = search
    ? allItems.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(search.toLowerCase())
      )
    : allItems;

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setSearch('');
      setSelected(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelected(prev => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelected(prev => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' && filtered[selected]) {
        e.preventDefault();
        filtered[selected].action();
        onClose();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selected, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search connections, queries, docs, or actions..."
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
          />
          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No results found
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    index === selected
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.name}
                    </div>
                    {item.subtitle && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
