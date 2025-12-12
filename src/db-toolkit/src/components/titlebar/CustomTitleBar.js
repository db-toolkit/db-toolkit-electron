/**
 * Custom Titlebar Component (Wave Terminal style)
 */
import { Database } from 'lucide-react';
import { WorkspaceTabBar } from '../workspace/WorkspaceTabBar';

export function CustomTitleBar() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return (
        <div className="flex items-center h-10 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 select-none">
            {/* Drag region */}
            <div className="flex-1 flex items-center" style={{ WebkitAppRegion: 'drag' }}>
                {/* App icon and title (left side) */}
                <div className={`flex items-center gap-2 px-4 ${isMac ? 'ml-16' : ''}`}>
                    <Database size={16} className="text-green-600 dark:text-green-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">DB Toolkit</span>
                </div>

                {/* Workspace tabs (center) */}
                <div className="flex-1" style={{ WebkitAppRegion: 'no-drag' }}>
                    <WorkspaceTabBar />
                </div>
            </div>
        </div>
    );
}
