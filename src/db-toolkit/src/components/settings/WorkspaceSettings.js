/**
 * Workspace settings component
 */
import { AlertTriangle } from 'lucide-react';

export function WorkspaceSettings({ settings, onChange }) {
  const maxWorkspaces = settings.workspaces?.maxWorkspaces || 10;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Workspace Settings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configure workspace behavior and limits
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Enable Workspaces
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Allow multiple workspace tabs (requires app restart)
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.workspaces?.enabled ?? true}
            onChange={(e) => onChange('workspaces', { ...settings.workspaces, enabled: e.target.checked })}
            className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-900 dark:text-gray-100 block mb-2">
              Maximum Workspaces: {maxWorkspaces}
            </label>
            <div className="relative">
              <input
                type="range"
                min="1"
                max="20"
                value={maxWorkspaces}
                onChange={(e) => onChange('workspaces', { ...settings.workspaces, maxWorkspaces: Number(e.target.value) })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    ${maxWorkspaces <= 10 ? '#16a34a' : maxWorkspaces <= 15 ? '#eab308' : '#ef4444'} 0%, 
                    ${maxWorkspaces <= 10 ? '#16a34a' : maxWorkspaces <= 15 ? '#eab308' : '#ef4444'} ${(maxWorkspaces / 20) * 100}%, 
                    #d1d5db ${(maxWorkspaces / 20) * 100}%, 
                    #d1d5db 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          {maxWorkspaces > 10 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                Having more than 10 workspaces open simultaneously may impact RAM usage and application performance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
