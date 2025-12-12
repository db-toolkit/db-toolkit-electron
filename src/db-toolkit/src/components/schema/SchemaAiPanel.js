/**
 * AI Analysis panel for entire schema
 */
import { X, Sparkles, RefreshCw, Database, TrendingUp, Link2, Lightbulb } from 'lucide-react';

export function SchemaAiPanel({ analysis, loading, onClose, onRefresh }) {
  if (loading) {
    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Schema Analysis</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Analyzing schema...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (analysis && (analysis.success === false || analysis.error)) {
    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Schema Analysis</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Analysis Failed</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {analysis.error || 'Unable to analyze schema'}
            </p>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-50 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Schema Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="Refresh analysis"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {analysis.summary && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <Database className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-1">Overview</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">{analysis.summary}</p>
              </div>
            </div>
          </div>
        )}

        {analysis.design_patterns && analysis.design_patterns.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Design Patterns</h4>
            </div>
            <ul className="space-y-2">
              {analysis.design_patterns.map((pattern, idx) => (
                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-green-200 dark:border-green-800">
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.relationships && analysis.relationships.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Relationships</h4>
            </div>
            <ul className="space-y-2">
              {analysis.relationships.map((rel, idx) => (
                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-green-200 dark:border-green-800">
                  {rel}
                </li>
              ))}
            </ul>
          </div>
        )}

        {analysis.optimization_suggestions && analysis.optimization_suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Optimization Suggestions</h4>
            </div>
            <ul className="space-y-2">
              {analysis.optimization_suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 pl-4 border-l-2 border-yellow-200 dark:border-yellow-800">
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
