/**
 * Custom hook for managing ERD diagram state and interactions
 */
import { useState, useCallback, useMemo } from 'react';
import { useReactFlow } from 'reactflow';

export function useERDInteractions(nodes, setNodes, edges, setEdges) {
    const [searchQuery, setSearchQuery] = useState('');
    const { fitView } = useReactFlow();

    // Toggle all nodes expand/collapse
    const toggleAllNodes = useCallback((collapsed) => {
        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                data: { ...node.data, forceCollapse: collapsed }
            }))
        );

        setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 300);
    }, [setNodes, fitView]);

    // Highlight connected nodes on click
    const onNodeClick = useCallback((event, node) => {
        const connectedEdges = edges.filter(
            edge => edge.source === node.id || edge.target === node.id
        );
        const connectedNodeIds = new Set(
            connectedEdges.flatMap(edge => [edge.source, edge.target])
        );
        connectedNodeIds.add(node.id);

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

    return {
        searchQuery,
        setSearchQuery,
        toggleAllNodes,
        onNodeClick,
        onPaneClick,
        resetLayout
    };
}
