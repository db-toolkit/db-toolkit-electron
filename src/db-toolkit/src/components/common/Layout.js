import { useState, useEffect } from 'react';
import Split from 'react-split';
import { useTheme } from '../../contexts/ThemeContext';
import { Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';
import { NotificationCenter } from './NotificationCenter';
import { SettingsModal } from '../settings/SettingsModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { ReportIssueModal } from './ReportIssueModal';
import { Tooltip } from './Tooltip';
import TerminalPanel from '../terminal/TerminalPanel';

function Layout({ children }) {
  const { theme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
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

  // Handle menu actions
  useEffect(() => {
    const handleToggleSidebar = () => setShowSidebar(prev => !prev);
    const handleToggleTerminal = () => setShowTerminal(prev => !prev);
    const handleCommandPalette = () => setShowCommandPalette(true);
    const handleKeyboardShortcuts = () => setShowKeyboardShortcuts(true);
    const handleReportIssue = () => setShowReportIssue(true);
    const handleFind = () => setShowCommandPalette(true);
    const handlePreferences = () => setShowSettings(true);

    window.addEventListener('menu:toggle-sidebar', handleToggleSidebar);
    window.addEventListener('menu:toggle-terminal', handleToggleTerminal);
    window.addEventListener('menu:command-palette', handleCommandPalette);
    window.addEventListener('menu:keyboard-shortcuts', handleKeyboardShortcuts);
    window.addEventListener('menu:report-issue', handleReportIssue);
    window.addEventListener('menu:find', handleFind);
    window.addEventListener('menu:preferences', handlePreferences);

    return () => {
      window.removeEventListener('menu:toggle-sidebar', handleToggleSidebar);
      window.removeEventListener('menu:toggle-terminal', handleToggleTerminal);
      window.removeEventListener('menu:command-palette', handleCommandPalette);
      window.removeEventListener('menu:keyboard-shortcuts', handleKeyboardShortcuts);
      window.removeEventListener('menu:report-issue', handleReportIssue);
      window.removeEventListener('menu:find', handleFind);
      window.removeEventListener('menu:preferences', handlePreferences);
    };
  }, []);

  useEffect(() => {
    const savedConnections = JSON.parse(localStorage.getItem('db-connections') || '[]');
    const savedQueries = JSON.parse(localStorage.getItem('query-tabs') || '[]');
    setConnections(savedConnections);
    setQueries(savedQueries);
    
    // Update recent connections in menu
    if (window.electron?.updateRecentConnections) {
      const recent = savedConnections
        .map(conn => ({
          id: conn.id,
          name: conn.name,
          lastUsed: localStorage.getItem(`connection_time_${conn.id}`)
        }))
        .filter(conn => conn.lastUsed)
        .sort((a, b) => parseInt(b.lastUsed) - parseInt(a.lastUsed))
        .slice(0, 5);
      window.electron.updateRecentConnections(recent);
    }
  }, []);

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {showSidebar ? (
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
        <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800">
          {children}
        </main>
        <StatusBar onTerminalClick={() => setShowTerminal(!showTerminal)} />
          </div>
        </Split>
      ) : (
        <div className="flex h-full">
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
          <main className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800">
            {children}
          </main>
          <StatusBar onTerminalClick={() => setShowTerminal(!showTerminal)} />
          </div>
        </div>
      )}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <KeyboardShortcutsModal isOpen={showKeyboardShortcuts} onClose={() => setShowKeyboardShortcuts(false)} />
      <ReportIssueModal isOpen={showReportIssue} onClose={() => setShowReportIssue(false)} />
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
