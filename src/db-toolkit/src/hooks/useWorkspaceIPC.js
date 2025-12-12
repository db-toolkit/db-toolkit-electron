/**
 * Workspace IPC hook
 */
import { useCallback } from 'react';

const ipc = {
    invoke: (channel, ...args) => window.electron.ipcRenderer.invoke(channel, ...args)
};

export function useWorkspaceIPC() {
    const loadWorkspaces = useCallback(async () => {
        return await ipc.invoke('workspace:load');
    }, []);

    const createWorkspace = useCallback(async (connectionId, connectionName, connectionType) => {
        return await ipc.invoke('workspace:create', connectionId, connectionName, connectionType);
    }, []);

    const updateWorkspace = useCallback(async (workspaceId, updates) => {
        return await ipc.invoke('workspace:update', workspaceId, updates);
    }, []);

    const updateWorkspaceState = useCallback(async (workspaceId, stateUpdates) => {
        return await ipc.invoke('workspace:updateState', workspaceId, stateUpdates);
    }, []);

    const deleteWorkspace = useCallback(async (workspaceId) => {
        return await ipc.invoke('workspace:delete', workspaceId);
    }, []);

    return {
        loadWorkspaces,
        createWorkspace,
        updateWorkspace,
        updateWorkspaceState,
        deleteWorkspace
    };
}
