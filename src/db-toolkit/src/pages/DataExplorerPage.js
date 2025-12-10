/**
 * Data Explorer page for browsing table data
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, RefreshCw, Database, Download, Filter } from 'lucide-react';
import { useConnections, useSchema } from '../hooks';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { DataGrid } from '../components/data-explorer/DataGrid';
import { TableSelector } from '../components/data-explorer/TableSelector';
import { CellViewModal } from '../components/data-explorer/CellViewModal';
import { ColumnFilter } from '../components/data-explorer/ColumnFilter';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Tooltip } from '../components/common/Tooltip';
import { pageTransition } from '../utils/animations';
import api from '../services/api';

function DataExplorerPage() {
  const navigate = useNavigate();
  const { connections, connectToDatabase } = useConnections();
  const toast = useToast();
  const [connectionId, setConnectionId] = useState(null);
  const [connectionName, setConnectionName] = useState('');
  const [connecting, setConnecting] = useState(null);
  const { schema, loading: schemaLoading, error: schemaError, fetchSchemaTree } = useSchema(connectionId);
  const [selectedTable, setSelectedTable] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(100);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortOrder, setSortOrder] = useState('ASC');
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [cellModal, setCellModal] = useState({ isOpen: false, data: null, column: null });

  const handleConnect = async (id) => {
    setConnecting(id);
    try {
      await connectToDatabase(id, true);
      const conn = connections.find(c => c.id === id);
      setConnectionId(id);
      setConnectionName(conn?.name || '');
      toast.success('Connected successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to connect');
    } finally {
      setConnecting(null);
    }
  };

  useEffect(() => {
    if (connectionId) {
      fetchSchemaTree().catch(err => {
        console.error('Schema fetch failed:', err);
        toast.error(`Failed to load schema: ${err.message}`);
      });
    }
  }, [connectionId]);

  const loadTableData = async (schema, table, offset = 0, sort = null, order = 'ASC', filterData = {}) => {
    setLoading(true);
    try {
      console.log('Frontend loadTableData called with:', { schema, table, offset, sort, order, filterData });
      const response = await api.post(`/connections/${connectionId}/data/browse`, {
        schema_name: schema,
        table_name: table,
        limit: pageSize,
        offset,
        sort_column: sort,
        sort_order: order,
        filters: filterData,
      });

      console.log('Frontend received response:', { success: response.data?.success, dataSuccess: response.data?.data?.success, rowsLength: response.data?.data?.rows?.length, columns: response.data?.data?.columns });
      
      if (response.data.success || response.data.data?.success) {
        const actualData = response.data.data || response.data;
        console.log('Setting data:', { rows: actualData.rows?.length, columns: actualData.columns });
        setData(actualData.rows || []);
        setColumns(actualData.columns || []);
      } else {
        console.log('Response not successful:', response.data);
      }

      const countResponse = await api.get(`/connections/${connectionId}/data/count`, {
        params: { schema_name: schema, table_name: table }
      });
      setTotalCount(countResponse.data.count);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (schema, table) => {
    setSelectedTable({ schema, table });
    setPage(0);
    setSortColumn(null);
    setSortOrder('ASC');
    setFilters({});
    loadTableData(schema, table, 0);
  };

  const handleSort = (column, order) => {
    setSortColumn(column);
    setSortOrder(order);
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, page * pageSize, column, order, filters);
    }
  };

  const handleFilterChange = (column, value) => {
    const newFilters = { ...filters, [column]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    setPage(0);
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, 0, sortColumn, sortOrder, filters);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setPage(0);
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, 0, sortColumn, sortOrder, {});
    }
  };

  const handleCellClick = async (row, column, colIndex) => {
    try {
      const rowId = { [columns[0]]: row[0] };
      const response = await api.post(`/connections/${connectionId}/data/cell`, {
        schema_name: selectedTable.schema,
        table_name: selectedTable.table,
        column_name: column,
        row_identifier: rowId,
      });
      
      if (response.data.success) {
        setCellModal({ isOpen: true, data: response.data.data, column });
      }
    } catch (err) {
      toast.error('Failed to load cell data');
    }
  };

  const handleCellUpdate = async (row, column, newValue) => {
    try {
      const rowId = { [columns[0]]: row[0] };
      const payload = {
        table: selectedTable.table,
        schema_name: selectedTable.schema,
        primary_key: rowId,
        changes: { [column]: newValue },
      };
      const response = await api.put(`/connections/${connectionId}/data/row`, payload);
      
      toast.success('Cell updated successfully');
      // Refresh data to show updated value
      loadTableData(selectedTable.schema, selectedTable.table, page * pageSize, sortColumn, sortOrder, filters);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update cell');
      throw err;
    }
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) return;
    
    const csv = [
      columns.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable.table}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  const exportToJSON = () => {
    if (!data || data.length === 0) return;
    
    const jsonData = data.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable.table}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to JSON');
  };

  const handleNextPage = () => {
    const newPage = page + 1;
    setPage(newPage);
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, newPage * pageSize, sortColumn, sortOrder, filters);
    }
  };

  const handlePrevPage = () => {
    const newPage = Math.max(0, page - 1);
    setPage(newPage);
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, newPage * pageSize, sortColumn, sortOrder, filters);
    }
  };

  const handleRefresh = () => {
    if (selectedTable) {
      loadTableData(selectedTable.schema, selectedTable.table, page * pageSize, sortColumn, sortOrder, filters);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const breadcrumbItems = [];
  if (connectionId) {
    breadcrumbItems.push({ label: 'Connections', href: '/' });
    breadcrumbItems.push({ label: connectionName, href: null });
    if (selectedTable) {
      breadcrumbItems.push({ label: selectedTable.schema });
      breadcrumbItems.push({ label: selectedTable.table });
    }
  }

  if (!connectionId) {
    if (connections.length === 0) {
      return (
        <motion.div className="p-8 flex items-center justify-center h-full" {...pageTransition}>
          <div className="text-center max-w-md">
            <Database className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No Connections</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create a database connection first to explore your data
            </p>
            <Button onClick={() => navigate('/connections')}>
              Create Connection
            </Button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div className="p-8" {...pageTransition}>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Data Explorer</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Select a connection to explore data</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-4 hover:shadow-lg hover:border-green-400 dark:hover:border-green-500 transition-all duration-200"
            >
              <div className="flex items-start gap-3 mb-4">
                <Database className="text-green-600 dark:text-green-400 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{conn.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{conn.db_type}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {conn.db_type === 'sqlite' ? conn.database.split('/').pop() : `${conn.host}:${conn.port}`}
                  </p>
                </div>
              </div>
              <Button
                variant="success"
                size="sm"
                onClick={() => handleConnect(conn.id)}
                disabled={connecting === conn.id}
                className="w-full !text-white"
              >
                {connecting === conn.id ? 'Connecting...' : 'Connect & Explore'}
              </Button>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="h-screen flex flex-col" {...pageTransition}>
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Data Explorer</h2>
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConnectionId(null)}
            >
              Change Connection
            </Button>
          </div>
        </div>
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-center gap-4">
          {selectedTable && (
            <>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalCount)} of {totalCount} rows</span>
                <span className="mx-2">|</span>
                <span>Page {page + 1} of {totalPages}</span>
              </div>
              <div className="flex gap-2">
                <Tooltip text={showFilters ? 'Hide filters' : 'Show filters'}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    icon={<Filter size={16} />}
                  >
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                </Tooltip>
                <Tooltip text="Export to CSV">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportToCSV}
                    icon={<Download size={16} />}
                  >
                    CSV
                  </Button>
                </Tooltip>
                <Tooltip text="Export to JSON">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportToJSON}
                    icon={<Download size={16} />}
                  >
                    JSON
                  </Button>
                </Tooltip>
                <Tooltip text="Previous page">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={page === 0}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                </Tooltip>
                <Tooltip text="Next page">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= totalPages - 1}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </Tooltip>
                <Tooltip text="Refresh data">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<RefreshCw size={16} />}
                    onClick={handleRefresh}
                  >
                    Refresh
                  </Button>
                </Tooltip>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          {schemaLoading ? (
            <div className="p-4">
              <LoadingState message="Loading schema..." />
            </div>
          ) : (
            <TableSelector
              schema={schema}
              selectedTable={selectedTable}
              onSelectTable={handleSelectTable}
            />
          )}
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {showFilters && selectedTable && (
            <ColumnFilter
              columns={columns}
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
          )}
          {showFilters && selectedTable && (
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <Button variant="primary" size="sm" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          )}
          <div className="flex-1 overflow-auto">
            {loading ? (
              <LoadingState message="Loading data..." />
            ) : selectedTable ? (
              data.length > 0 ? (
                <DataGrid
                  data={data}
                  columns={columns}
                  onSort={handleSort}
                  sortColumn={sortColumn}
                  sortOrder={sortOrder}
                  onCellClick={handleCellClick}
                  onCellUpdate={handleCellUpdate}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <p className="text-lg font-medium mb-2">No data found</p>
                    <p className="text-sm">This table is empty or has no accessible data</p>
                  </div>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                Select a table to view data
              </div>
            )}
          </div>
        </div>
      </div>

      <CellViewModal
        isOpen={cellModal.isOpen}
        onClose={() => setCellModal({ isOpen: false, data: null, column: null })}
        data={cellModal.data}
        column={cellModal.column}
      />
    </motion.div>
  );
}

export default DataExplorerPage;
