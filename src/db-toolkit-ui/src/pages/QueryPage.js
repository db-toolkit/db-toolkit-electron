import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { History, Download } from 'lucide-react';
import { useQuery } from '../hooks';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { QueryEditor } from '../components/query/QueryEditor';
import { QueryHistory } from '../components/query/QueryHistory';
import { EditableTable } from '../components/data/EditableTable';
import { CsvExportModal } from '../components/csv';

function QueryPage() {
  const { connectionId } = useParams();
  const [query, setQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { result, loading, error, executeQuery } = useQuery(connectionId);

  const handleExecute = async () => {
    if (!query.trim()) return;
    try {
      await executeQuery(query);
    } catch (err) {
      console.error('Query failed:', err);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Query Editor</h2>
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
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <History size={20} />
            {showHistory ? 'Hide' : 'Show'} History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={showHistory ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <QueryEditor
            query={query}
            onChange={setQuery}
            onExecute={handleExecute}
            loading={loading}
          />

          {error && <ErrorMessage message={error} />}

          <EditableTable
            connectionId={connectionId}
            result={result}
            onRefresh={handleExecute}
          />
        </div>

        {showHistory && (
          <div className="lg:col-span-1">
            <QueryHistory
              connectionId={connectionId}
              onSelectQuery={setQuery}
            />
          </div>
        )}
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
