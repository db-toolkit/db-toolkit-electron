import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scaleIn } from '../utils/motion';
import {
  gettingStartedData,
  connectionsData,
  queryEditorData,
  schemaExplorerData,
  dataExplorerData,
  backupRestoreData,
  settingsData,
} from '../data';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
}

const allSections = [
  { id: 'getting-started', data: gettingStartedData },
  { id: 'connections', data: connectionsData },
  { id: 'query-editor', data: queryEditorData },
  { id: 'schema-explorer', data: schemaExplorerData },
  { id: 'data-explorer', data: dataExplorerData },
  { id: 'backup-restore', data: backupRestoreData },
  { id: 'settings', data: settingsData },
];

export default function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    const searchLower = search.toLowerCase();
    const matches: any[] = [];

    allSections.forEach((section) => {
      if (section.data.title.toLowerCase().includes(searchLower)) {
        matches.push({ id: section.id, title: section.data.title, type: 'section' });
      }
      section.data.sections.forEach((subsection: any) => {
        if (subsection.heading.toLowerCase().includes(searchLower) || 
            subsection.content.toLowerCase().includes(searchLower)) {
          matches.push({ 
            id: section.id, 
            title: `${section.data.title} > ${subsection.heading}`,
            type: 'subsection'
          });
        }
      });
    });

    setResults(matches.slice(0, 8));
  }, [search]);

  const handleSelect = (id: string) => {
    onNavigate(id);
    onClose();
    setSearch('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-32" onClick={onClose}>
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4"
          onClick={(e) => e.stopPropagation()}
          {...scaleIn}
        >
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <Search size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search documentation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 outline-none text-lg bg-transparent text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={20} />
            </button>
          </div>
          
          {results.length > 0 && (
            <div className="max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(result.id)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-800 dark:text-gray-100">{result.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{result.type}</div>
                </button>
              ))}
            </div>
          )}
          
          {search && results.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No results found for "{search}"
            </div>
          )}
          
          {!search && (
            <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm">
              Type to search documentation...
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
