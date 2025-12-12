/**
 * Custom hook for managing ERD layout state
 */
import { useState, useEffect, useMemo } from 'react';
import { useReactFlow } from 'reactflow';
import { getLayoutedElements } from '../../../utils/erDiagramUtils';

export function useERDLayout(initialNodes, initialEdges) {
    const [layoutDirection, setLayoutDirection] = useState(() => {
        return localStorage.getItem('er-diagram-layout') || 'LR';
    });
    const [zoomLevel, setZoomLevel] = useState(100);
    const { fitView, getViewport } = useReactFlow();

    // Apply auto-layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
        () => getLayoutedElements(initialNodes, initialEdges, layoutDirection),
        [initialNodes, initialEdges, layoutDirection]
    );

    // Save layout direction to localStorage
    useEffect(() => {
        localStorage.setItem('er-diagram-layout', layoutDirection);
    }, [layoutDirection]);

    // Track zoom level
    useEffect(() => {
        const updateZoom = () => {
            const viewport = getViewport();
            setZoomLevel(Math.round(viewport.zoom * 100));
        };

        updateZoom();
        const interval = setInterval(updateZoom, 500);
        return () => clearInterval(interval);
    }, [getViewport]);

    return {
        layoutDirection,
        setLayoutDirection,
        layoutedNodes,
        layoutedEdges,
        zoomLevel,
        fitView
    };
}
