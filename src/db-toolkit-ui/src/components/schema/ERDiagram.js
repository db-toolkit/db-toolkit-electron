/**
 * Interactive ER Diagram component
 */
import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Download, Minimize2, ArrowDown, ArrowRight, ArrowUp, ArrowLeft, Search, RotateCcw } from 'lucide-react';
import TableNode from './TableNode';
import { 
  schemaToNodes, 
  detectRelationships, 
  relationshipsToEdges, 
  getLayoutedElements,
  filterNodesBySearch
} from '../../utils/erDiagramUtils';
import { Button } from '../common/Button';

const nodeTypes = {
  tableNode: TableNode,
};

const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: false,
  style: { strokeWidth: 2 },
};

export function ERDiagram({ schema, onClose }) {
  const [layoutDirection, setLayoutDirection] = useState('LR');
  const [searchQuery, setSearchQuery] = useState('');
  const { fitView, getViewport } = useReactFlow();

  // Generate nodes and edges from schema
  const initialNodes = useMemo(() => schemaToNodes(schema), [schema]);
  const relationships = useMemo(() => detectRelationships(schema), [schema]);
  const initialEdges = useMemo(() => relationshipsToEdges(relationships), [relationships]);

  // Apply auto-layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges, layoutDirection),
    [initialNodes, initialEdges, layoutDirection]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes when layout direction changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutDirection, setNodes, setEdges]);

  // Fit view after layout update
  useEffect(() => {
    const timer = setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100);
    return () => clearTimeout(timer);
  }, [layoutDirection, fitView]);

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

  // Highlight connected nodes on click
  const onNodeClick = useCallback((event, node) => {
    const connectedEdges = edges.filter(
      edge => edge.source === node.id || edge.target === node.id
    );
    const connectedNodeIds = new Set(
      connectedEdges.flatMap(edge => [edge.source, edge.target])
    );

    setNodes(nodes =>
      nodes.map(n => ({
        ...n,
        style: {
          ...n.style,
          opacity: connectedNodeIds.has(n.id) ? 1 : 0.3,
        },
      }))
    );

    setEdges(edges =>
      edges.map(e => ({
        ...e,
        style: {
          ...e.style,
          opacity: connectedEdges.some(ce => ce.id === e.id) ? 1 : 0.2,
        },
      }))
    );
  }, [edges, setNodes, setEdges]);

  // Reset highlight on pane click
  const onPaneClick = useCallback(() => {
    setSearchQuery('');
    setNodes(nodes =>
      nodes.map(n => ({
        ...n,
        style: { ...n.style, opacity: 1 },
      }))
    );
    setEdges(edges =>
      edges.map(e => ({
        ...e,
        style: { ...e.style, opacity: 1 },
      }))
    );
  }, [setNodes, setEdges]);

  // Reset layout
  const resetLayout = useCallback(() => {
    setSearchQuery('');
    onPaneClick();
    fitView({ padding: 0.2, duration: 300 });
  }, [onPaneClick, fitView]);

  // Export diagram as PNG (current viewport only)
  const exportToPng = useCallback(() => {
    const viewport = getViewport();
    const flowElement = document.querySelector('.react-flow__renderer');
    
    if (!flowElement) {
      alert('Unable to export. Please try browser screenshot instead.');
      return;
    }

    // Get visible area dimensions
    const width = window.innerWidth;
    const height = window.innerHeight - 56; // Subtract header height

    // Create image from current view
    import('html-to-image').then(({ toPng }) => {
      const isDark = document.documentElement.classList.contains('dark');
      toPng(flowElement, {
        backgroundColor: isDark ? '#111827' : '#ffffff',
        width,
        height,
        pixelRatio: 2,
        cacheBust: true,
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `er-diagram-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Export failed:', err);
          alert('Export failed. Use browser screenshot: Ctrl+Shift+S (Windows) or Cmd+Shift+4 (Mac)');
        });
    });
  }, [getViewport]);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Schema Diagram
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLayoutDirection('TB')}
              className={`p-2 rounded transition ${layoutDirection === 'TB' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              title="Top to Bottom"
            >
              <ArrowDown size={16} />
            </button>
            <button
              onClick={() => setLayoutDirection('LR')}
              className={`p-2 rounded transition ${layoutDirection === 'LR' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              title="Left to Right"
            >
              <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setLayoutDirection('BT')}
              className={`p-2 rounded transition ${layoutDirection === 'BT' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              title="Bottom to Top"
            >
              <ArrowUp size={16} />
            </button>
            <button
              onClick={() => setLayoutDirection('RL')}
              className={`p-2 rounded transition ${layoutDirection === 'RL' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'}`}
              title="Right to Left"
            >
              <ArrowLeft size={16} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tables..."
              className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-64"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw size={16} />}
            onClick={resetLayout}
          >
            Reset
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={16} />}
            onClick={exportToPng}
          >
            Export PNG
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Minimize2 size={16} />}
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>

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
          <Panel position="top-left" className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm space-y-1">
              <div className="font-semibold text-gray-900 dark:text-gray-100">Legend</div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="w-3 h-3 bg-yellow-600 rounded"></div>
                <span>Primary Key</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="w-3 h-3 bg-blue-600 rounded"></div>
                <span>Foreign Key</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-0.5 bg-blue-600"></div>
                <span>Relationship</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <div className="w-8 h-0.5 bg-gray-400 border-dashed border-t-2"></div>
                <span>Inferred</span>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
