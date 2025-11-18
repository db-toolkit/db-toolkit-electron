import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import Split from 'react-split';
import { useQuery } from '../hooks';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { QueryEditor } from '../components/query/QueryEditor';
import { QueryResultsPanel } from '../components/query/QueryResultsPanel';
import { CsvExportModal } from '../components/csv';
import 'react-split/dist/react-split.css';

function QueryPage() {
  const { connectionId } = useParams();
  const [query, setQuery] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const { result, loading, error, executeQuery } = useQuery(connectionId);

  const handleExecute = async () => {
    if (!query.trim()) return;
    const startTime = Date.now();
    try {
      await executeQuery(query);
      setExecutionTime(Date.now() - startTime);
    } catch (err) {
      console.error('Query failed:', err);
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
              loading={loading}
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
    </div>
  );
}

export default QueryPage;
