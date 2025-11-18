/**
 * Data Explorer page for browsing table data
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useSchema } from '../hooks';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { DataGrid } from '../components/data-explorer/DataGrid';
import { TableSelector } from '../components/data-explorer/TableSelector';
import api from '../services/api';

function DataExplorerPage() {
  const { connectionId } = useParams();
  const { schema, fetchSchemaTree } = useSchema(connectionId);
  const [selectedTable, setSelectedTable] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(100);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('ASC');
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (connectionId) {
      fetchSchemaTree();
    }
  }, [connectionId, fetchSchemaTree]);

  const loadTableData = async (schema, table, offset = 0, sort = null, order = 'ASC') => {
    setLoading(true);
    try {
      const response = await api.post(`/api/v1/connections/${connectionId}/data/browse`, {
        schema_name: schema,
        table_name: table,
        limit: pageSize,
        offset,
        sort_column: sort,
        sort_order: order,
      });

      if (response.data.success) {
        setData(response.data.rows);
        setColumns(response.data.columns);
      }

      // Get total count
      const countResponse = await api.get(`/api/v1/connections/${connectionId}/data/count`, {
        params: { schema_name: schema, table_name: table }
      });
      setTotalCount(countResponse.data.count);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (schema, table) => {
    setSelectedTable({ schema, table });
    setPage(0);
    setSortColumn(null);
    setSortOrder('ASC');
    loadTableData(schema, table, 0);
  };

  const handleSort = (column, order) => {
    setSortColumn(column);
    setSortOrder(order);
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, page * pageSize, column, order);
    }
  };

  const handleNextPage = () => {
    const newPage = page + 1;
    setPage(newPage);
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, newPage * pageSize, sortColumn, sortOrder);
    }
  };

  const handlePrevPage = () => {
    const newPage = Math.max(0, page - 1);
    setPage(newPage);
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, newPage * pageSize, sortColumn, sortOrder);
    }
  };

  const handleRefresh = () => {
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, page * pageSize, sortColumn, sortOrder);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Data Explorer</h2>
        <div className="flex items-center gap-4">
          {selectedTable && (
            <>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {totalCount} rows | Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={page === 0}
                >
                  <ChevronLeft size={16} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight size={16} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<RefreshCw size={16} />}
                  onClick={handleRefresh}
                >
                  Refresh
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <TableSelector
            schema={schema}
            selectedTable={selectedTable}
            onSelectTable={handleSelectTable}
          />
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <LoadingState message="Loading data..." />
          ) : selectedTable ? (
            <DataGrid
              data={data}
              columns={columns}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortOrder={sortOrder}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              Select a table to view data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataExplorerPage;
