/**
 * Workspace Context Provider
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const WorkspaceContext = createContext(null);

const ipc = {
    invoke: (channel, ...args) => window.electron.ipcRenderer.invoke(channel, ...args)
};

export function WorkspaceProvider({ children }) {
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    // Load workspaces on mount and create default if none exist
    useEffect(() => {
        loadWorkspaces();
    }, []);

    // Auto-create default workspace if none exist
    useEffect(() => {
        if (!loading && workspaces.length === 0) {
            createWorkspace(null, 'Default Workspace', null);
        }
    }, [loading, workspaces.length]);

    const loadWorkspaces = useCallback(async () => {
        try {
            setLoading(true);
            const result = await ipc.invoke('workspace:load');

            if (result.success && result.workspaces) {
                setWorkspaces(result.workspaces);

                // Set active workspace to most recently accessed
                if (result.workspaces.length > 0) {
                    const sorted = [...result.workspaces].sort((a, b) =>
                        new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
                    );
                    setActiveWorkspaceId(sorted[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to load workspaces:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const createWorkspace = useCallback(async (connectionId, connectionName, connectionType) => {
        try {
            const result = await ipc.invoke('workspace:create', connectionId, connectionName, connectionType);

            if (result.success) {
                setWorkspaces(prev => [...prev, result.workspace]);
                setActiveWorkspaceId(result.workspace.id);
                return result.workspace;
            }

            throw new Error(result.error || 'Failed to create workspace');
        } catch (error) {
            console.error('Failed to create workspace:', error);
            throw error;
        }
    }, []);

    const closeWorkspace = useCallback(async (workspaceId) => {
        try {
            const workspace = workspaces.find(w => w.id === workspaceId);
            
            // Check for unsaved changes
            if (workspace?.hasUnsavedChanges) {
                const confirmed = window.confirm(
                    'This workspace has unsaved changes. Are you sure you want to close it?'
                );
                if (!confirmed) return false;
            }

            const result = await ipc.invoke('workspace:delete', workspaceId);

            if (result.success) {
                setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));

                // If closing active workspace, switch to another
                if (activeWorkspaceId === workspaceId) {
                    const remaining = workspaces.filter(w => w.id !== workspaceId);
                    setActiveWorkspaceId(remaining.length > 0 ? remaining[0].id : null);
                }
            }

            return result.success;
        } catch (error) {
            console.error('Failed to close workspace:', error);
            return false;
        }
    }, [activeWorkspaceId, workspaces]);

    const switchWorkspace = useCallback((workspaceId) => {
        setActiveWorkspaceId(workspaceId);
        
        // Restore workspace's last active route
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (workspace?.state?.activeRoute) {
            navigate(workspace.state.activeRoute);
        }
    }, [workspaces, navigate]);

    const saveTimerRef = useRef({});

    const updateWorkspaceState = useCallback(async (workspaceId, stateUpdates) => {
        try {
            const result = await ipc.invoke('workspace:updateState', workspaceId, stateUpdates);

            if (result.success) {
                setWorkspaces(prev => prev.map(w =>
                    w.id === workspaceId ? result.workspace : w
                ));
            }

            return result.success;
        } catch (error) {
            console.error('Failed to update workspace state:', error);
            return false;
        }
    }, []);

    const getWorkspaceState = useCallback((key) => {
        const workspace = workspaces.find(w => w.id === activeWorkspaceId);
        return workspace?.state?.[key];
    }, [workspaces, activeWorkspaceId]);

    const setWorkspaceState = useCallback((key, value) => {
        if (!activeWorkspaceId) return;

        // Update in-memory immediately
        setWorkspaces(prev => prev.map(w => 
            w.id === activeWorkspaceId 
                ? { ...w, state: { ...w.state, [key]: value } }
                : w
        ));

        // Debounced save to backend
        if (saveTimerRef.current[activeWorkspaceId]) {
            clearTimeout(saveTimerRef.current[activeWorkspaceId]);
        }
        saveTimerRef.current[activeWorkspaceId] = setTimeout(() => {
            updateWorkspaceState(activeWorkspaceId, { [key]: value });
        }, 1000);
    }, [activeWorkspaceId, updateWorkspaceState]);

    const setHasUnsavedChanges = useCallback((workspaceId, hasChanges) => {
        setWorkspaces(prev => prev.map(w => 
            w.id === workspaceId ? { ...w, hasUnsavedChanges: hasChanges } : w
        ));
    }, []);

    const getActiveWorkspace = useCallback(() => {
        return workspaces.find(w => w.id === activeWorkspaceId);
    }, [workspaces, activeWorkspaceId]);

    // Save active route when location changes (debounced)
    useEffect(() => {
        if (activeWorkspaceId && location.pathname) {
            setWorkspaceState('activeRoute', location.pathname);
        }
    }, [location.pathname, activeWorkspaceId, setWorkspaceState]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(saveTimerRef.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

    const updateWorkspace = useCallback(async (workspaceId, updates) => {
        try {
            const result = await ipc.invoke('workspace:update', workspaceId, updates);
            if (result.success) {
                setWorkspaces(prev => prev.map(w =>
                    w.id === workspaceId ? result.workspace : w
                ));
            }
            return result.success;
        } catch (error) {
            console.error('Failed to update workspace:', error);
            return false;
        }
    }, []);

    const value = {
        workspaces,
        activeWorkspaceId,
        activeWorkspace: getActiveWorkspace(),
        loading,
        createWorkspace,
        closeWorkspace,
        switchWorkspace,
        updateWorkspaceState,
        updateWorkspace,
        loadWorkspaces,
        getWorkspaceState,
        setWorkspaceState,
        setHasUnsavedChanges
    };

    return (
        <WorkspaceContext.Provider value={value}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error('useWorkspace must be used within WorkspaceProvider');
    }
    return context;
}
