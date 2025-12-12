import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, Code, FolderTree, Upload, Sparkles, Network } from 'lucide-react';
import { useSchema } from '../hooks';
import { useSchemaAI } from '../hooks/useSchemaAI';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { SchemaTree } from '../components/schema/SchemaTree';
import { TableDetails } from '../components/schema/TableDetails';
import { CsvImportModal } from '../components/csv';
import { SchemaAiPanel } from '../components/schema/SchemaAiPanel';
import { ERDiagram } from '../components/schema/ERDiagram';
import { ReactFlowProvider } from 'reactflow';

function SchemaPage() {
  const { connectionId } = useParams();
  const navigate = useNavigate();
  const { schema, loading, error, fetchSchemaTree, refreshSchema } = useSchema(connectionId);
  const { analyzeSchema, loading: aiLoading } = useSchemaAI(connectionId);
  const toast = useToast();
  const [selectedTable, setSelectedTable] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [schemaAnalysis, setSchemaAnalysis] = useState(null);
  const [showERDiagram, setShowERDiagram] = useState(false);

  useEffect(() => {
    fetchSchemaTree().catch((err) => {
      if (err.response?.data?.error) {
        console.error('Schema fetch error:', err.response.data.error);
      }
    });
  }, [fetchSchemaTree]);

  const handleTableClick = (schemaName, tableName) => {
    setSelectedTable({ schema: schemaName, table: tableName });
  };

  const handleViewData = (schemaName, tableName) => {
    navigate(`/data-explorer?connection=${connectionId}&schema=${schemaName}&table=${tableName}`);
  };

  const handleGenerateQuery = (query) => {
    navigate(`/query/${connectionId}`, { state: { initialQuery: query } });
  };

  const handleAnalyzeTable = async (schemaName, tableName, tableData) => {
    try {
      const result = await analyzeSchema(schemaName, false);
      setSchemaAnalysis(result);
      setShowAiPanel(true);
      toast.success(`Analyzing ${tableName}...`);
    } catch (err) {
      toast.error('Failed to analyze table');
    }
  };

  const handleRefreshTable = async (schemaName, tableName) => {
    try {
      await refreshSchema();
      toast.success(`Refreshed ${tableName}`);
    } catch (err) {
      toast.error('Failed to refresh table');
    }
  };

  const handleDropTable = async (schemaName, tableName) => {
    const confirmed = window.confirm(
      `Are you sure you want to drop table "${schemaName}.${tableName}"?\n\nThis action cannot be undone!`
    );
    
    if (confirmed) {
      toast.error('Drop table functionality not yet implemented. Use Query Editor to execute DROP TABLE.');
    }
  };

  const handleAnalyzeSchema = async (forceRefresh = false) => {
    if (!schema?.schemas || Object.keys(schema.schemas).length === 0) {
      toast.error('No schema to analyze');
      return;
    }

    try {
      const schemaName = Object.keys(schema.schemas)[0];
      const result = await analyzeSchema(schemaName, forceRefresh);
      setSchemaAnalysis(result);
      setShowAiPanel(true);
      toast.success('Schema analysis complete');
    } catch (err) {
      console.error('Schema analysis error:', err);
      toast.error('Failed to analyze schema');
    }
  };

  if (loading) return <LoadingState fullScreen message="Loading schema..." />;

  if (error) return (
    <div className="p-8">
      <ErrorMessage message={error.message || "Failed to load schema. Please ensure you are connected to the database."} />
      <div className="flex gap-2 mt-4">
        <Button
          variant="primary"
          icon={<RefreshCw size={16} />}
          onClick={() => fetchSchemaTree()}
        >
          Retry Connection
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate('/')}
        >
          Back to Connections
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Schema Explorer</h2>
        <div className="flex gap-2">
          {selectedTable && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowImport(true)}
            >
              <Upload size={16} className="mr-2" />
              Import CSV
            </Button>
          )}
          <Button
            variant="secondary"
            icon={<Network size={20} />}
            onClick={() => setShowERDiagram(true)}
          >
            ER Diagram
          </Button>
          <Button
            variant="secondary"
            icon={<Sparkles size={20} />}
            onClick={() => handleAnalyzeSchema()}
            disabled={aiLoading}
          >
            {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
          </Button>
          <Button
            variant="secondary"
            icon={<RefreshCw size={20} />}
            onClick={refreshSchema}
          >
            Refresh
          </Button>
          <Button
            icon={<Code size={20} />}
            onClick={() => navigate(`/query/${connectionId}`)}
          >
            Query Editor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {schema && !schema.error ? (
            <SchemaTree 
              schema={schema} 
              onTableClick={handleTableClick}
              onViewData={handleViewData}
              onGenerateQuery={handleGenerateQuery}
              onAnalyzeWithAI={handleAnalyzeTable}
              onRefreshTable={handleRefreshTable}
              onDropTable={handleDropTable}
            />
          ) : (
            <EmptyState
              icon={FolderTree}
              title="No schema data"
              description={schema?.error || "Unable to load database schema. Please connect to the database first."}
              action={
                <div className="flex gap-2">
                  <Button icon={<RefreshCw size={16} />} onClick={() => fetchSchemaTree()}>
                    Retry Connection
                  </Button>
                  <Button variant="secondary" onClick={() => navigate('/')}>
                    Back to Connections
                  </Button>
                </div>
              }
            />
          )}
        </div>

        {schema && !schema.error && (
          <div className="lg:col-span-2">
            {selectedTable ? (
              <TableDetails
                connectionId={connectionId}
                schemaName={selectedTable.schema}
                tableName={selectedTable.table}
              />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
                <p>Select a table to view details</p>
              </div>
            )}
          </div>
        )}
      </div>

      {selectedTable && (
        <CsvImportModal
          isOpen={showImport}
          onClose={() => setShowImport(false)}
          connectionId={connectionId}
          schema={selectedTable.schema}
          table={selectedTable.table}
          onSuccess={() => {
            setShowImport(false);
            refreshSchema();
          }}
        />
      )}

      {showAiPanel && (
        <SchemaAiPanel
          analysis={schemaAnalysis}
          loading={aiLoading}
          onClose={() => setShowAiPanel(false)}
          onRefresh={() => handleAnalyzeSchema(true)}
        />
      )}

      {showERDiagram && (
        <ReactFlowProvider>
          <ERDiagram
            schema={schema}
            onClose={() => setShowERDiagram(false)}
          />
        </ReactFlowProvider>
      )}
    </div>
  );
}

export default SchemaPage;
