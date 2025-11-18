/**
 * Modal to display query explain plan with AI analysis
 */
import { useState } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../common/Button';

export function ExplainPlanModal({ isOpen, onClose, explainResult, loading }) {
  const [showRawPlan, setShowRawPlan] = useState(false);

  if (!isOpen) return null;

  const analysis = explainResult?.analysis;
  const hasAnalysis = analysis && !explainResult?.error;

  const getScoreColor = (score) => {
    switch (score) {
      case 'good': return 'text-green-600 dark:text-green-400';
      case 'moderate': return 'text-yellow-600 dark:text-yellow-400';
      case 'poor': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getScoreIcon = (score) => {
    switch (score) {
      case 'good': return <CheckCircle size={20} />;
      case 'moderate': return <AlertTriangle size={20} />;
      case 'poor': return <AlertCircle size={20} />;
      default: return <TrendingUp size={20} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Query Execution Plan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {!loading && explainResult?.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">Analysis Error</h3>
                  <p className="text-red-700 dark:text-red-300 text-sm">{explainResult.error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && hasAnalysis && (
            <div className="space-y-6">
              {/* Performance Score */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className={getScoreColor(analysis.performance_score)}>
                    {getScoreIcon(analysis.performance_score)}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Performance: <span className={getScoreColor(analysis.performance_score)}>
                      {analysis.performance_score?.toUpperCase()}
                    </span>
                  </h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm">{analysis.summary}</p>
                {analysis.estimated_cost && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                    Estimated Cost: {analysis.estimated_cost}
                  </p>
                )}
              </div>

              {/* Key Operations */}
              {analysis.key_operations?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Key Operations</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.key_operations.map((op, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                      >
                        {op}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottlenecks */}
              {analysis.bottlenecks?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={18} />
                    Performance Bottlenecks
                  </h3>
                  <ul className="space-y-2">
                    {analysis.bottlenecks.map((bottleneck, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm"
                      >
                        <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                        <span>{bottleneck}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                    <TrendingUp className="text-green-600 dark:text-green-400" size={18} />
                    Optimization Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-gray-700 dark:text-gray-300 text-sm"
                      >
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw Explain Plan - Collapsible */}
              <div>
                <button
                  onClick={() => setShowRawPlan(!showRawPlan)}
                  className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100 mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {showRawPlan ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  Raw Execution Plan (Advanced)
                </button>
                {showRawPlan && (
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(explainResult.explain_plan, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
