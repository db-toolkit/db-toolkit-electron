/**
 * Workspace Context Provider
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WorkspaceContext = createContext(null);

const ipc = {
    invoke: (channel, ...args) => window.electron.ipcRenderer.invoke(channel, ...args)
};

export function WorkspaceProvider({ children }) {
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load workspaces on mount
    useEffect(() => {
        loadWorkspaces();
    }, []);

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
    }, []);

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

    const getActiveWorkspace = useCallback(() => {
        return workspaces.find(w => w.id === activeWorkspaceId);
    }, [workspaces, activeWorkspaceId]);

    const value = {
        workspaces,
        activeWorkspaceId,
        activeWorkspace: getActiveWorkspace(),
        loading,
        createWorkspace,
        closeWorkspace,
        switchWorkspace,
        updateWorkspaceState,
        loadWorkspaces
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
