import { useState } from 'react';
import { Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import { SettingsModal } from '../settings/SettingsModal';

function Layout({ children }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-end">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <Settings size={20} />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          {children}
        </main>
      </div>
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

export default Layout;
