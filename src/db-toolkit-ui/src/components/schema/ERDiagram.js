/**
 * Interactive ER Diagram component
 */
import { useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Download, Maximize2, Minimize2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import TableNode from './TableNode';
import { 
  schemaToNodes, 
  detectRelationships, 
  relationshipsToEdges, 
  getLayoutedElements 
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
  console.log('ERDiagram schema:', schema);
  
  // Generate nodes and edges from schema
  const initialNodes = useMemo(() => {
    const nodes = schemaToNodes(schema);
    console.log('Generated nodes:', nodes);
    return nodes;
  }, [schema]);
  const relationships = useMemo(() => detectRelationships(schema), [schema]);
  const initialEdges = useMemo(() => relationshipsToEdges(relationships), [relationships]);

  // Apply auto-layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);
  
  console.log('Final nodes for ReactFlow:', nodes);
  console.log('Node types:', nodeTypes);

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

  // Export diagram as PNG
  const exportToPng = useCallback(() => {
    const element = document.querySelector('.react-flow');
    if (element) {
      toPng(element, {
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          link.download = `er-diagram-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error('Failed to export diagram:', err);
        });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Schema Diagram
        </h2>
        <div className="flex items-center gap-2">
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
          nodes={nodes}
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
