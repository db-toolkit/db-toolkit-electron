/**
 * ERD Legend panel component
 */
import { Panel } from 'reactflow';

export function ERDLegend({ zoomLevel }) {
    return (
        <Panel position="top-left" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm space-y-1">
                <div className="font-semibold text-gray-900 dark:text-gray-100">Legend</div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                    <span>Primary Key</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-3 h-3 bg-green-600 rounded"></div>
                    <span>Foreign Key</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-8 h-0.5 bg-green-600"></div>
                    <span>Relationship</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <div className="w-8 h-0.5 bg-gray-400 border-dashed border-t-2"></div>
                    <span>Inferred</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-1 mt-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Zoom: {zoomLevel}%
                    </div>
                </div>
            </div>
        </Panel>
    );
}
