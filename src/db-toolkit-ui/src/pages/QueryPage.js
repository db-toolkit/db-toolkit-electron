import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import Split from 'react-split';
import { useQuery, useSchema } from '../hooks';
import { useExplain } from '../hooks/useExplain';
import { useSettingsContext } from '../contexts/SettingsContext';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { QueryEditor } from '../components/query/QueryEditor';
import { QueryResultsPanel } from '../components/query/QueryResultsPanel';
import { ExplainPlanModal } from '../components/query/ExplainPlanModal';
import { CsvExportModal } from '../components/csv';

function QueryPage() {
  const { connectionId } = useParams();
  const [query, setQuery] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const { result, loading, error, executeQuery } = useQuery(connectionId);
  const { schema, fetchSchemaTree } = useSchema(connectionId);

  // Fetch schema for autocomplete
  useEffect(() => {
    if (connectionId) {
      fetchSchemaTree().catch(err => console.error('Failed to load schema:', err));
    }
  }, [connectionId, fetchSchemaTree]);

  const [queryError, setQueryError] = useState(null);
  const [showExplainModal, setShowExplainModal] = useState(false);
  const { explainResult, loading: explainLoading, explainQuery } = useExplain(connectionId);
  const { settings } = useSettingsContext();

  const handleExplain = async () => {
    if (!query.trim()) return;
    setShowExplainModal(true);
    try {
      await explainQuery(query);
    } catch (err) {
      console.error('Explain failed:', err);
    }
  };

  const handleExecute = async () => {
    if (!query.trim()) return;
    setQueryError(null);
    const startTime = Date.now();
    try {
      const limit = settings?.default_query_limit || 1000;
      const timeout = settings?.default_query_timeout || 30;
      await executeQuery(query, limit, 0, timeout);
      setExecutionTime(Date.now() - startTime);
    } catch (err) {
      console.error('Query failed:', err);
      const errorMsg = err.response?.data?.detail || err.message;
      setQueryError(errorMsg);
      setExecutionTime(Date.now() - startTime);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="flex justify-between items-center px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Query Editor</h2>
        <div className="flex gap-2">
          {result && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowExport(true)}
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="px-6 py-2">
          <ErrorMessage message={error} />
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <Split
          direction="vertical"
          sizes={[50, 50]}
          minSize={200}
          gutterSize={8}
          className="flex flex-col h-full"
          style={{ height: '100%' }}
        >
          <div className="overflow-hidden">
            <QueryEditor
              query={query}
              onChange={setQuery}
              onExecute={handleExecute}
              onExplain={handleExplain}
              loading={loading}
              schema={schema}
              error={queryError}
            />
          </div>

          <div className="overflow-hidden">
            <QueryResultsPanel
              connectionId={connectionId}
              result={result}
              executionTime={executionTime}
              onSelectQuery={setQuery}
              onRefresh={handleExecute}
            />
          </div>
        </Split>
      </div>

      <CsvExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        connectionId={connectionId}
        query={query}
      />

      <ExplainPlanModal
        isOpen={showExplainModal}
        onClose={() => setShowExplainModal(false)}
        explainResult={explainResult}
        loading={explainLoading}
      />
    </div>
  );
}

export default QueryPage;
