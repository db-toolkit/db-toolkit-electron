/**
 * Settings modal with tabbed interface
 */
import { useState } from 'react';
import { X, Palette, Code, Settings as SettingsIcon, Database, RotateCcw } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../common/Button';
import { AppearanceSettings } from './AppearanceSettings';
import { QuerySettings } from './QuerySettings';
import { EditorSettings } from './EditorSettings';
import { ConnectionSettings } from './ConnectionSettings';

const tabs = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'query', label: 'Query', icon: Code },
  { id: 'editor', label: 'Editor', icon: SettingsIcon },
  { id: 'connection', label: 'Connection', icon: Database },
];

export function SettingsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('appearance');
  const { settings, updateSettings, resetSettings } = useSettings();
  const toast = useToast();
  const [localSettings, setLocalSettings] = useState(null);

  if (!isOpen) return null;

  if (!localSettings && settings) {
    setLocalSettings(settings);
  }

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      toast.success('Settings saved');
      onClose();
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all settings to defaults?')) {
      try {
        const defaults = await resetSettings();
        setLocalSettings(defaults);
        toast.success('Settings reset');
      } catch (err) {
        toast.error('Failed to reset settings');
      }
    }
  };

  if (!localSettings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
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

        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" size="sm" icon={<RotateCcw size={16} />} onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
