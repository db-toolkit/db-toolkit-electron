/**
 * Query plan visualization modal
 */
import { Modal } from '../common/Modal';

export function QueryPlanModal({ isOpen, onClose, plan, query }) {
  if (!isOpen) return null;

  const renderPlan = (planData) => {
    if (!planData) return <p className="text-gray-500 dark:text-gray-400">No plan data available</p>;
    
    return (
      <pre className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
        {JSON.stringify(planData, null, 2)}
      </pre>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Query Execution Plan">
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Query:</h4>
          <pre className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-3 rounded text-xs font-mono overflow-auto">
            {query}
          </pre>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Execution Plan:</h4>
          {renderPlan(plan)}
        </div>
      </div>
    </Modal>
  );
}
