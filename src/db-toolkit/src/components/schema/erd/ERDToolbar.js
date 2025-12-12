/**
 * ERD Diagram toolbar component
 */
import { Download, Minimize2, ArrowDown, ArrowRight, ArrowUp, ArrowLeft, Search, RotateCcw, Tag } from 'lucide-react';
import { Button } from '../../common/Button';

export function ERDToolbar({
    layoutDirection,
    onLayoutChange,
    searchQuery,
    onSearchChange,
    showLabels,
    onToggleLabels,
    onToggleExpand,
    onToggleCollapse,
    onReset,
    onExport,
    onClose,
    exporting
}) {
    return (
        <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Schema Diagram
                </h2>

                {/* Layout Direction Buttons */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded p-1">
                    <button
                        onClick={() => onLayoutChange('SMART')}
                        className={`px-3 py-1.5 text-xs rounded transition ${layoutDirection === 'SMART'
                            ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        title="Smart 2D Layout"
                    >
                        Smart
                    </button>
                    <button
                        onClick={() => onLayoutChange('TB')}
                        className={`p-1.5 rounded transition ${layoutDirection === 'TB'
                            ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        title="Top to Bottom"
                    >
                        <ArrowDown size={16} />
                    </button>
                    <button
                        onClick={() => onLayoutChange('LR')}
                        className={`p-1.5 rounded transition ${layoutDirection === 'LR'
                            ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        title="Left to Right"
                    >
                        <ArrowRight size={16} />
                    </button>
                    <button
                        onClick={() => onLayoutChange('BT')}
                        className={`p-1.5 rounded transition ${layoutDirection === 'BT'
                            ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        title="Bottom to Top"
                    >
                        <ArrowUp size={16} />
                    </button>
                    <button
                        onClick={() => onLayoutChange('RL')}
                        className={`p-1.5 rounded transition ${layoutDirection === 'RL'
                            ? 'bg-white dark:bg-gray-700 shadow text-green-600 dark:text-green-400'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                            }`}
                        title="Right to Left"
                    >
                        <ArrowLeft size={16} />
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search tables..."
                        className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-64"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded p-1 mr-2">
                    <button
                        onClick={onToggleExpand}
                        className="px-2 py-1 text-xs rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                    >
                        Expand All
                    </button>
                    <button
                        onClick={onToggleCollapse}
                        className="px-2 py-1 text-xs rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                    >
                        Collapse All
                    </button>
                </div>

                <Button
                    variant={showLabels ? "primary" : "secondary"}
                    size="sm"
                    icon={<Tag size={16} />}
                    onClick={onToggleLabels}
                    title="Toggle relationship labels"
                >
                    Labels
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<RotateCcw size={16} />}
                    onClick={onReset}
                >
                    Reset
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<Download size={16} />}
                    onClick={onExport}
                    disabled={exporting}
                    loading={exporting}
                >
                    {exporting ? 'Exporting...' : 'Export PNG'}
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    icon={<Minimize2 size={16} />}
                    onClick={onClose}
                >
                    Close
                </Button>
            </div>
        </div>
    );
}
