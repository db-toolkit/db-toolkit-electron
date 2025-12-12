/**
 * Custom Titlebar Component (Wave Terminal style)
 */
import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { WorkspaceTabBar } from '../workspace/WorkspaceTabBar';
import { Tooltip } from '../common/Tooltip';

export function CustomTitleBar({ onToggleSidebar }) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const [workspacesEnabled, setWorkspacesEnabled] = useState(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await window.electron.ipcRenderer.invoke('settings:get');
                const enabled = settings?.workspaces?.enabled ?? true;
                setWorkspacesEnabled(enabled);
            } catch (error) {
                console.error('Failed to load workspace settings:', error);
                setWorkspacesEnabled(true);
            }
        };
        loadSettings();

        const handleSettingsUpdate = () => {
            loadSettings();
        };
        window.addEventListener('settings-updated', handleSettingsUpdate);
        return () => window.removeEventListener('settings-updated', handleSettingsUpdate);
    }, []);

    return (
        <div className="flex items-center h-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 select-none">
            {/* Drag region */}
            <div className="flex-1 flex items-center" style={{ WebkitAppRegion: 'drag' }}>
                {/* Sidebar toggle (left side) */}
                <div className={`flex items-center px-4 ${isMac ? 'ml-16' : ''}`} style={{ WebkitAppRegion: 'no-drag' }}>
                    <Tooltip text="Toggle sidebar" position="right">
                        <button
                            onClick={onToggleSidebar}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        >
                            <Menu size={16} className="text-gray-700 dark:text-gray-300" />
                        </button>
                    </Tooltip>
                </div>

                {/* Workspace tabs or app title */}
                {workspacesEnabled === null ? (
                    <div className="flex-1" />
                ) : workspacesEnabled ? (
                    <div className="flex-1">
                        <WorkspaceTabBar />
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center px-4">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">DB Toolkit</span>
                    </div>
                )}
            </div>
        </div>
    );
}
