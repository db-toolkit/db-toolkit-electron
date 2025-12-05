import { useState, useEffect } from 'react';
import Split from 'react-split';
import { useTheme } from '../../contexts/ThemeContext';
import { Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';
import { NotificationCenter } from './NotificationCenter';
import { SettingsModal } from '../settings/SettingsModal';
import { Tooltip } from './Tooltip';
import TerminalPanel from '../terminal/TerminalPanel';

function Layout({ children }) {
  const { theme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [connections, setConnections] = useState([]);
  const [queries, setQueries] = useState([]);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    return saved ? parseInt(saved) : 20;
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const savedConnections = JSON.parse(localStorage.getItem('db-connections') || '[]');
    const savedQueries = JSON.parse(localStorage.getItem('query-tabs') || '[]');
    setConnections(savedConnections);
    setQueries(savedQueries);
  }, []);

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900">
      <Split
        sizes={[sidebarWidth, 100 - sidebarWidth]}
        minSize={[200, 600]}
        maxSize={[400, Infinity]}
        gutterSize={4}
        onDragEnd={(sizes) => localStorage.setItem('sidebar-width', sizes[0])}
        className="flex h-full"
      >
        <div>
          <Sidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-end items-center gap-2">
          <NotificationCenter />
          <Tooltip text="Application settings">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <Settings size={20} />
              <span className="hidden sm:inline text-sm font-medium">Settings</span>
            </button>
          </Tooltip>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 pt-16 md:pt-0">
          {children}
        </main>
        <StatusBar onTerminalClick={() => setShowTerminal(!showTerminal)} />
        </div>
      </Split>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <TerminalPanel isOpen={showTerminal} onClose={() => setShowTerminal(false)} darkMode={theme === 'dark'} />
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)}
        connections={connections}
        queries={queries}
      />
    </div>
  );
}

export default Layout;
