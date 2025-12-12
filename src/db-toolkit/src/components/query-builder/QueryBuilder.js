/**
 * Main visual query builder component
 */
import { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow';
import Split from 'react-split';
import 'reactflow/dist/style.css';
import { X } from 'lucide-react';
import { Button } from '../common/Button';
import QueryTableNode from './QueryTableNode';
import { TableSelector } from './TableSelector';
import { ColumnSelector } from './ColumnSelector';
import { FilterBuilder } from './FilterBuilder';
import { SQLPreview } from './SQLPreview';
import { ErrorDisplay } from './ErrorDisplay';
import { GroupByBuilder } from './GroupByBuilder';
import { OrderByBuilder } from './OrderByBuilder';
import { LimitBuilder } from './LimitBuilder';
import { EdgeConfigPanel } from './EdgeConfigPanel';
import { generateSQL, validateQuery, getJoinTypes } from '../../utils/queryBuilder';

const nodeTypes = {
  queryTable: QueryTableNode
};

export function QueryBuilder({ schema, onClose, onExecuteQuery }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [filters, setFilters] = useState([]);
  const [groupBy, setGroupBy] = useState([]);
  const [orderBy, setOrderBy] = useState([]);
  const [limit, setLimit] = useState(null);
  const [offset, setOffset] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [selectedEdge, setSelectedEdge] = useState(null);

  // Track added tables
  const addedTables = useMemo(() =>
    nodes.map(node => node.data.tableName),
    [nodes]
  );

  // Generate query state
  const queryState = useMemo(() => {
    const tables = nodes.map(node => ({ name: node.data.tableName }));
    const joins = edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      return {
        type: edge.data?.joinType || 'INNER JOIN',
        sourceTable: sourceNode?.data.tableName,
        targetTable: targetNode?.data.tableName,
        sourceColumn: edge.data?.sourceColumn || 'id',
        targetColumn: edge.data?.targetColumn || 'id'
      };
    });

    return {
      tables,
      joins,
      columns: selectedColumns,
      filters,
      groupBy,
      orderBy,
      limit,
      offset
    };
  }, [nodes, edges, selectedColumns, filters, groupBy, orderBy, limit, offset]);

  // Generate SQL with parameters
  const sqlResult = useMemo(() => generateSQL(queryState), [queryState]);
  const sql = sqlResult.sql;
  const params = sqlResult.params;

  // Toggle column selection
  const handleColumnToggle = useCallback((tableName, column) => {
    const columnName = column.name || column.column_name;
    if (!columnName) return;

    const colId = `${tableName}.${columnName}`;
    setSelectedColumns(prev => {
      const exists = prev.find(c => `${c.table}.${c.name}` === colId);
      if (exists) {
        return prev.filter(c => `${c.table}.${c.name}` !== colId);
      } else {
        return [...prev, {
          table: tableName,
          name: columnName,
          type: column.data_type || column.type,
          aggregate: null,
          alias: null
        }];
      }
    });
  }, []);

  // Remove table from canvas
  const handleRemoveTable = useCallback((tableName) => {
    setNodes(nds => nds.filter(n => n.data.tableName !== tableName));
    setEdges(eds => eds.filter(e => {
      const sourceNode = nodes.find(n => n.id === e.source);
      const targetNode = nodes.find(n => n.id === e.target);
      return sourceNode?.data.tableName !== tableName && targetNode?.data.tableName !== tableName;
    }));
    setSelectedColumns(cols => cols.filter(c => c.table !== tableName));
  }, [setNodes, setEdges, nodes]);

  // Add table to canvas with smart positioning
  const handleAddTable = useCallback((table) => {
    // Smart grid-based positioning to avoid overlaps
    const gridSize = 350; // Horizontal spacing
    const rowHeight = 250; // Vertical spacing
    const startX = 100;
    const startY = 100;
    const maxColumns = 3; // Max tables per row

    const existingPositions = nodes.map(n => n.position);
    let x = startX;
    let y = startY;

    // Find next available grid position
    let positionFound = false;
    for (let row = 0; row < 10 && !positionFound; row++) {
      for (let col = 0; col < maxColumns && !positionFound; col++) {
        x = startX + (col * gridSize);
        y = startY + (row * rowHeight);

        // Check if position is occupied (within 200px)
        const isOccupied = existingPositions.some(p =>
          Math.abs(p.x - x) < 200 && Math.abs(p.y - y) < 150
        );

        if (!isOccupied) {
          positionFound = true;
        }
      }
    }

    const newNode = {
      id: table.name,
      type: 'queryTable',
      position: { x, y },
      data: {
        tableName: table.name,
        columns: table.columns,
        onColumnToggle: handleColumnToggle,
        onRemove: handleRemoveTable
      }
    };
    setNodes(nds => [...nds, newNode]);
  }, [nodes, setNodes, handleColumnToggle, handleRemoveTable]);

  // Update nodes when columns change
  useEffect(() => {
    setNodes(nds => nds.map(node => ({
      ...node,
      data: {
        ...node.data,
        selectedColumns: selectedColumns.map(c => `${c.table}.${c.name}`),
        onRemove: handleRemoveTable
      }
    })));
  }, [selectedColumns, setNodes, handleRemoveTable]);

  // Handle edge connection
  const onConnect = useCallback((params) => {
    const newEdge = {
      ...params,
      type: 'smoothstep',
      animated: true,
      data: {
        joinType: 'INNER JOIN',
        sourceColumn: 'id',
        targetColumn: 'id'
      }
    };
    setEdges(eds => addEdge(newEdge, eds));
  }, [setEdges]);

  // Handle edge click for configuration
  const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    setSelectedEdge(edge);
  }, []);

  // Handle edge update
  const handleEdgeUpdate = useCallback((updates) => {
    if (!selectedEdge) return;

    setEdges(eds => eds.map(e =>
      e.id === selectedEdge.id
        ? { ...e, data: { ...e.data, ...updates } }
        : e
    ));
  }, [selectedEdge, setEdges]);

  // Update column
  const handleUpdateColumn = useCallback((idx, updates) => {
    setSelectedColumns(prev => prev.map((col, i) =>
      i === idx ? { ...col, ...updates } : col
    ));
  }, []);

  // Remove column
  const handleRemoveColumn = useCallback((idx) => {
    setSelectedColumns(prev => prev.filter((_, i) => i !== idx));
  }, []);

  // Reorder columns
  const handleReorderColumn = useCallback((fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= selectedColumns.length) return;
    setSelectedColumns(prev => {
      const newCols = [...prev];
      const [moved] = newCols.splice(fromIdx, 1);
      newCols.splice(toIdx, 0, moved);
      return newCols;
    });
  }, [selectedColumns]);

  // Filter operations
  const handleAddFilter = useCallback((filter) => {
    setFilters(prev => [...prev, filter]);
  }, []);

  const handleUpdateFilter = useCallback((id, updates) => {
    setFilters(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const handleRemoveFilter = useCallback((id) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  }, []);

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
      setValidationErrors([error.message || 'Failed to execute query']);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Visual Query Builder
        </h2>
        <Button variant="secondary" size="sm" icon={<X size={16} />} onClick={onClose}>
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
        <div className="flex-1 flex flex-col">
          <Split
            direction="vertical"
            sizes={[70, 30]}
            minSize={[300, 150]}
            gutterSize={8}
            className="flex flex-col h-full"
          >
            <div className="overflow-hidden">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onEdgeClick={onEdgeClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.2}
                maxZoom={1.5}
              >
                <Background />
                <Controls />
                <MiniMap />
              </ReactFlow>
            </div>

            {/* SQL Preview with Error Display */}
            <div className="overflow-hidden">
              <ErrorDisplay
                errors={validationErrors}
                onDismiss={() => setValidationErrors([])}
              />
              <SQLPreview
                sql={sql}
                onExecute={handleExecute}
                isExecuting={isExecuting}
              />
            </div>
          </Split>
        </div>

        {/* Right Sidebar - Column & Filter Config */}
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto p-4 space-y-6">
          <ColumnSelector
            columns={selectedColumns}
            onUpdateColumn={handleUpdateColumn}
            onRemoveColumn={handleRemoveColumn}
            onReorder={handleReorderColumn}
          />

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <FilterBuilder
              filters={filters}
              tables={nodes.map(n => ({ name: n.data.tableName, columns: n.data.columns }))}
              onAddFilter={handleAddFilter}
              onUpdateFilter={handleUpdateFilter}
              onRemoveFilter={handleRemoveFilter}
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <GroupByBuilder
              columns={selectedColumns}
              groupBy={groupBy}
              onUpdate={setGroupBy}
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <OrderByBuilder
              columns={selectedColumns}
              orderBy={orderBy}
              onUpdate={setOrderBy}
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <LimitBuilder
              limit={limit}
              offset={offset}
              onUpdate={({ limit: newLimit, offset: newOffset }) => {
                setLimit(newLimit);
                setOffset(newOffset);
              }}
            />
          </div>
        </div>
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