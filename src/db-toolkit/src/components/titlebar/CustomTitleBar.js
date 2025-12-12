/**
 * Custom Titlebar Component (Wave Terminal style)
 */
import { Menu } from 'lucide-react';
import { WorkspaceTabBar } from '../workspace/WorkspaceTabBar';

export function CustomTitleBar({ onToggleSidebar }) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return (
        <div className="flex items-center h-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 select-none">
            {/* Drag region */}
            <div className="flex-1 flex items-center" style={{ WebkitAppRegion: 'drag' }}>
                {/* Sidebar toggle (left side) */}
                <div className={`flex items-center px-4 ${isMac ? 'ml-16' : ''}`} style={{ WebkitAppRegion: 'no-drag' }}>
                    <button
                        onClick={onToggleSidebar}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        title="Toggle sidebar"
                    >
                        <Menu size={16} className="text-gray-700 dark:text-gray-300" />
                    </button>
                </div>

                {/* Workspace tabs (center) */}
                <div className="flex-1" style={{ WebkitAppRegion: 'no-drag' }}>
                    <WorkspaceTabBar />
                </div>
            </div>
        </div>
    );
}
