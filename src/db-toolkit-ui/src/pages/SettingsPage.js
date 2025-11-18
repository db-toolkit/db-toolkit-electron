/**
 * Settings page with tabbed interface
 */
import { useState } from 'react';
import { Settings, Palette, Code, Database, RotateCcw } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { QuerySettings } from '../components/settings/QuerySettings';
import { EditorSettings } from '../components/settings/EditorSettings';
import { ConnectionSettings } from '../components/settings/ConnectionSettings';

const tabs = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'query', label: 'Query Defaults', icon: Code },
  { id: 'editor', label: 'Editor', icon: Settings },
  { id: 'connection', label: 'Connection', icon: Database },
];

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('appearance');
  const { settings, loading, updateSettings, resetSettings } = useSettings();
  const toast = useToast();
  const [localSettings, setLocalSettings] = useState(null);

  if (loading && !settings) {
    return <LoadingState fullScreen message="Loading settings..." />;
  }

  if (!localSettings && settings) {
    setLocalSettings(settings);
  }

  const handleChange = async (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    
    // Apply theme immediately
    if (key === 'theme') {
      try {
        await updateSettings({ [key]: value });
        toast.success('Theme updated');
      } catch (err) {
        toast.error('Failed to update theme');
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all settings to defaults?')) {
      try {
        const defaults = await resetSettings();
        setLocalSettings(defaults);
        toast.success('Settings reset to defaults');
      } catch (err) {
        toast.error('Failed to reset settings');
      }
    }
  };

  if (!localSettings) return null;

  return (
    <div className="h-screen flex flex-col">
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={<RotateCcw size={16} />} onClick={handleReset}>
              Reset
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl">
            {activeTab === 'appearance' && (
              <AppearanceSettings settings={localSettings} onChange={handleChange} />
            )}
            {activeTab === 'query' && (
              <QuerySettings settings={localSettings} onChange={handleChange} />
            )}
            {activeTab === 'editor' && (
              <EditorSettings settings={localSettings} onChange={handleChange} />
            )}
            {activeTab === 'connection' && (
              <ConnectionSettings settings={localSettings} onChange={handleChange} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
