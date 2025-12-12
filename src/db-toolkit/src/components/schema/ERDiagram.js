/**
 * Interactive ER Diagram component
 */
import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useToast } from '../../contexts/ToastContext';
import TableNode from './TableNode';
import { ERDToolbar } from './erd/ERDToolbar';
import { ERDLegend } from './erd/ERDLegend';
import { useERDLayout } from './erd/useERDLayout';
import { useERDInteractions } from './erd/useERDInteractions';
import {
  schemaToNodes,
  detectRelationships,
  relationshipsToEdges,
  filterNodesBySearch
} from '../../utils/erDiagramUtils';

const nodeTypes = {
  tableNode: TableNode,
};

const defaultEdgeOptions = {
  animated: false,
  style: { strokeWidth: 2 },
};

export function ERDiagram({ schema, onClose }) {
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  // Generate nodes and edges from schema
  const initialNodes = useMemo(() => schemaToNodes(schema), [schema]);
  const relationships = useMemo(() => detectRelationships(schema), [schema]);
  const initialEdges = useMemo(() => relationshipsToEdges(relationships), [relationships]);

  // Use custom hooks
  const {
    layoutDirection,
    setLayoutDirection,
    layoutedNodes,
    layoutedEdges,
    zoomLevel
  } = useERDLayout(initialNodes, initialEdges);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const {
    searchQuery,
    setSearchQuery,
    toggleAllNodes,
    onNodeClick,
    onPaneClick,
    resetLayout
  } = useERDInteractions(nodes, setNodes, edges, setEdges);

  // Update nodes/edges when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Filter nodes by search
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const filtered = filterNodesBySearch(nodes, searchQuery);
    const filteredIds = new Set(filtered.map(n => n.id));
    return nodes.map(n => ({
      ...n,
      style: {
        ...n.style,
        opacity: filteredIds.has(n.id) ? 1 : 0.2,
      },
    }));
  }, [nodes, searchQuery]);

  // Export diagram as PNG (optimized)
  const exportToPng = useCallback(async () => {
    const flowElement = document.querySelector('.react-flow__viewport');

    if (!flowElement) {
      toast.error('Unable to export diagram. Please try using your browser\'s screenshot feature.');
      return;
    }

    setExporting(true);
    try {
      const { toBlob } = await import('html-to-image');
      const isDark = document.documentElement.classList.contains('dark');

      const blob = await toBlob(flowElement, {
        backgroundColor: isDark ? '#111827' : '#ffffff',
        pixelRatio: 1,
        cacheBust: false,
        skipFonts: true,
      });

      if (!blob) throw new Error('Failed to create image');

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `er-diagram-${Date.now()}.png`;
      link.href = url;
      link.click();

      URL.revokeObjectURL(url);
      toast.success('Diagram exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Export failed. Try using browser screenshot: Ctrl+Shift+S (Windows) or Cmd+Shift+4 (Mac)');
    } finally {
      setExporting(false);
    }
  }, [toast]);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <ERDToolbar
        layoutDirection={layoutDirection}
        onLayoutChange={setLayoutDirection}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleExpand={() => toggleAllNodes(false)}
        onToggleCollapse={() => toggleAllNodes(true)}
        onReset={resetLayout}
        onExport={exportToPng}
        onClose={onClose}
        exporting={exporting}
      />

      {/* Diagram */}
      <div className="h-[calc(100vh-3.5rem)]">
        <ReactFlow
          nodes={filteredNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          <Background color="#94a3b8" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => '#3b82f6'}
            maskColor="rgba(0, 0, 0, 0.1)"
            className="!bg-gray-100 dark:!bg-gray-800"
          />
          <ERDLegend zoomLevel={zoomLevel} />
        </ReactFlow>
      </div>
    </div >
  );
}
