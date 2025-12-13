/**
 * Main visual query builder component
 */
import { useState, useCallback, useMemo, useEffect } from "react";
import { useNodesState, useEdgesState, addEdge } from "reactflow";
import "reactflow/dist/style.css";
import { X } from "lucide-react";
import { Button } from "../common/Button";
import QueryTableNode from "./QueryTableNode";
import { TableSelector } from "./TableSelector";
import { QueryCanvas } from "./QueryCanvas";
import { QueryConfigSidebar } from "./QueryConfigSidebar";
import { EdgeConfigPanel } from "./EdgeConfigPanel";
import { useQueryBuilderState } from "./useQueryBuilderState";
import { useTableOperations } from "./useTableOperations";
import { useColumnFilterOperations } from "./useColumnFilterOperations";
import { generateSQL, validateQuery } from "../../utils/queryBuilder";

const nodeTypes = {
  queryTable: QueryTableNode,
};

export function QueryBuilder({ schema, onClose, onExecuteQuery }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [selectedEdge, setSelectedEdge] = useState(null);

  // Use custom hooks
  const {
    groupBy,
    setGroupBy,
    orderBy,
    setOrderBy,
    limit,
    setLimit,
    offset,
    setOffset,
    queryState,
  } = useQueryBuilderState(nodes, edges, selectedColumns, filters);

  const {
    handleColumnToggle,
    handleRemoveTable,
    handleAddTable: addTableToCanvas,
  } = useTableOperations(nodes, setNodes, setEdges, setSelectedColumns);

  const {
    handleUpdateColumn,
    handleRemoveColumn,
    handleReorderColumn,
    handleAddFilter,
    handleUpdateFilter,
    handleRemoveFilter,
  } = useColumnFilterOperations(setSelectedColumns, setFilters);

  // Track added tables
  const addedTables = useMemo(
    () => nodes.map((node) => node.data.tableName),
    [nodes],
  );

  // Generate SQL with parameters
  const sqlResult = useMemo(() => generateSQL(queryState), [queryState]);
  const sql = sqlResult.sql;
  const params = sqlResult.params;

  // Wrapper for handleAddTable to pass required callbacks
  const handleAddTable = useCallback(
    (table) => {
      addTableToCanvas(table, handleColumnToggle, handleRemoveTable);
    },
    [addTableToCanvas, handleColumnToggle, handleRemoveTable],
  );

  // Update nodes when columns change
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selectedColumns: selectedColumns.map((c) => `${c.table}.${c.name}`),
          onRemove: handleRemoveTable,
        },
      })),
    );
  }, [selectedColumns, setNodes, handleRemoveTable]);

  // Handle edge connection
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        type: "smoothstep",
        animated: true,
        data: {
          joinType: "INNER JOIN",
          sourceColumn: "id",
          targetColumn: "id",
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges],
  );

  // Handle edge click for configuration
  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
  }, []);

  // Handle edge update
  const handleEdgeUpdate = useCallback(
    (updates) => {
      if (!selectedEdge) return;

      setEdges((eds) =>
        eds.map((e) =>
          e.id === selectedEdge.id
            ? { ...e, data: { ...e.data, ...updates } }
            : e,
        ),
      );
    },
    [selectedEdge, setEdges],
  );

  // Execute query
  const handleExecute = async () => {
    const validation = validateQuery(queryState);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Clear any previous errors
    setValidationErrors([]);
    setIsExecuting(true);

    try {
      // Pass SQL with parameters to execution handler
      await onExecuteQuery(sql, params);
    } catch (error) {
      setValidationErrors([error.message || "Failed to execute query"]);
    } finally {
      setIsExecuting(false);
    }
  };

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col"
      style={{ WebkitAppRegion: "no-drag" }}
    >
      {/* Header */}
      <div
        className={`h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 ${isMac ? "pl-20" : ""}`}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Visual Query Builder
        </h2>
        <Button
          variant="secondary"
          size="sm"
          icon={<X size={16} />}
          onClick={onClose}
        >
          Close
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Table Selector */}
        <TableSelector
          schema={schema}
          onAddTable={handleAddTable}
          addedTables={addedTables}
        />

        {/* Canvas */}
        <QueryCanvas
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          validationErrors={validationErrors}
          sql={sql}
          isExecuting={isExecuting}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onDismissErrors={() => setValidationErrors([])}
          onExecute={handleExecute}
        />

        {/* Right Sidebar */}
        <QueryConfigSidebar
          selectedColumns={selectedColumns}
          filters={filters}
          groupBy={groupBy}
          orderBy={orderBy}
          limit={limit}
          offset={offset}
          nodes={nodes}
          onUpdateColumn={handleUpdateColumn}
          onRemoveColumn={handleRemoveColumn}
          onReorderColumn={handleReorderColumn}
          onAddFilter={handleAddFilter}
          onUpdateFilter={handleUpdateFilter}
          onRemoveFilter={handleRemoveFilter}
          onUpdateGroupBy={setGroupBy}
          onUpdateOrderBy={setOrderBy}
          onUpdateLimit={({ limit: newLimit, offset: newOffset }) => {
            setLimit(newLimit);
            setOffset(newOffset);
          }}
        />
      </div>

      {/* Edge Configuration Modal */}
      {selectedEdge && (
        <EdgeConfigPanel
          edge={selectedEdge}
          tables={nodes}
          onUpdate={handleEdgeUpdate}
          onClose={() => setSelectedEdge(null)}
        />
      )}
    </div>
  );
}
