/**
 * Workspace Context Provider
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkspaceIPC } from '../../hooks/useWorkspaceIPC';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [maxWorkspaces, setMaxWorkspaces] = useState(10);
    const location = useLocation();
    const navigate = useNavigate();
    const ipc = useWorkspaceIPC();

    // Load settings to get maxWorkspaces
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const result = await window.electron.ipcRenderer.invoke('settings:get');
                if (result.success) {
                    setMaxWorkspaces(result.settings.workspaces?.maxWorkspaces || 10);
                }
            } catch (error) {
                console.error('Failed to load workspace settings:', error);
            }
        };
        loadSettings();
    }, []);

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
            const result = await ipc.loadWorkspaces();

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
            // Check workspace limit
            if (workspaces.length >= maxWorkspaces) {
                const message = maxWorkspaces > 10
                    ? `You have reached the maximum limit of ${maxWorkspaces} workspaces.\n\nPlease close some workspaces before creating new ones, or increase the limit in Settings.`
                    : `You have reached the recommended limit of ${maxWorkspaces} workspaces.\n\nHaving more than 10 workspaces open simultaneously may impact RAM usage and application performance.\n\nDo you want to continue and create another workspace?`;
                
                if (maxWorkspaces > 10) {
                    window.alert(message);
                    return null;
                }
                
                const confirmed = window.confirm(message);
                if (!confirmed) return null;
            }

            const result = await ipc.createWorkspace(connectionId, connectionName, connectionType);

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
    }, [workspaces.length, maxWorkspaces, ipc]);

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

            // If closing active workspace, switch to another first
            if (activeWorkspaceId === workspaceId) {
                const remaining = workspaces.filter(w => w.id !== workspaceId);
                if (remaining.length > 0) {
                    const targetWorkspace = remaining[0];
                    // Navigate to target workspace's route first
                    if (targetWorkspace.state?.activeRoute) {
                        navigate(targetWorkspace.state.activeRoute);
                    }
                    setActiveWorkspaceId(targetWorkspace.id);
                }
            }

            const result = await ipc.deleteWorkspace(workspaceId);

            if (result.success) {
                setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
            }

            return result.success;
        } catch (error) {
            console.error('Failed to close workspace:', error);
            return false;
        }
    }, [activeWorkspaceId, workspaces, navigate]);

    const switchWorkspace = useCallback((workspaceId) => {
        const workspace = workspaces.find(w => w.id === workspaceId);
        setActiveWorkspaceId(workspaceId);
        
        // Restore workspace's last active route
        if (workspace?.state?.activeRoute && workspace.state.activeRoute !== location.pathname) {
            navigate(workspace.state.activeRoute);
        }
    }, [workspaces, location.pathname, navigate]);

    const saveTimerRef = useRef({});

    const updateWorkspaceState = useCallback(async (workspaceId, stateUpdates) => {
        try {
            const result = await ipc.updateWorkspaceState(workspaceId, stateUpdates);

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

    // Save active route when location changes (immediate, not debounced)
    useEffect(() => {
        if (activeWorkspaceId && location.pathname) {
            // Update in-memory immediately
            setWorkspaces(prev => prev.map(w => 
                w.id === activeWorkspaceId 
                    ? { ...w, state: { ...w.state, activeRoute: location.pathname } }
                    : w
            ));
            
            // Save to backend (debounced)
            if (saveTimerRef.current[`${activeWorkspaceId}-route`]) {
                clearTimeout(saveTimerRef.current[`${activeWorkspaceId}-route`]);
            }
            saveTimerRef.current[`${activeWorkspaceId}-route`] = setTimeout(() => {
                updateWorkspaceState(activeWorkspaceId, { activeRoute: location.pathname });
            }, 1000);
        }
    }, [location.pathname, activeWorkspaceId, updateWorkspaceState]);

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            Object.values(saveTimerRef.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

    const updateWorkspace = useCallback(async (workspaceId, updates) => {
        try {
            const result = await ipc.updateWorkspace(workspaceId, updates);
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
