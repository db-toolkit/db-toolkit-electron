import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, Code, FolderTree, Upload } from 'lucide-react';
import { useSchema } from '../hooks';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { SchemaTree } from '../components/schema/SchemaTree';
import { TableDetails } from '../components/schema/TableDetails';
import { CsvImportModal } from '../components/csv';

function SchemaPage() {
  const { connectionId } = useParams();
  const navigate = useNavigate();
  const { schema, loading, error, fetchSchemaTree, refreshSchema } = useSchema(connectionId);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetchSchemaTree();
  }, [fetchSchemaTree]);

  const handleTableClick = (schemaName, tableName) => {
    setSelectedTable({ schema: schemaName, table: tableName });
  };

  if (loading) return <LoadingState fullScreen message="Loading schema..." />;
  
  if (error) return (
    <div className="p-8">
      <ErrorMessage message={error} />
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Schema Explorer</h2>
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
          {schema ? (
            <SchemaTree schema={schema} onTableClick={handleTableClick} />
          ) : (
            <EmptyState
              icon={FolderTree}
              title="No schema data"
              description="Unable to load database schema"
            />
          )}
        </div>

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
    </div>
  );
}

export default SchemaPage;
