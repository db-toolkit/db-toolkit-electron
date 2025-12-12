/**
 * Workspace Tab Bar Component
 */
import { Plus } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { WorkspaceTab } from './WorkspaceTab';
import { useNavigate } from 'react-router-dom';

export function WorkspaceTabBar() {
    const { workspaces, activeWorkspaceId, switchWorkspace, closeWorkspace, createWorkspace, updateWorkspace } = useWorkspace();
    const navigate = useNavigate();

    const handleNewWorkspace = async () => {
        const newWorkspace = await createWorkspace(null, `Workspace ${workspaces.length + 1}`, null);
        if (newWorkspace) {
            navigate('/');
        }
    };

    const handleTabClick = (workspaceId) => {
        switchWorkspace(workspaceId);
    };

    const handleCloseTab = async (workspaceId) => {
        // TODO: Check for unsaved changes before closing
        await closeWorkspace(workspaceId);
    };



    return (
        <div className="flex items-center bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {/* Workspace Tabs */}
            <div className="flex items-center flex-1 overflow-x-auto">
                {workspaces.map(workspace => (
                    <WorkspaceTab
                        key={workspace.id}
                        workspace={workspace}
                        isActive={workspace.id === activeWorkspaceId}
                        onClick={handleTabClick}
                        onClose={handleCloseTab}
                        onUpdate={updateWorkspace}
                    />
                ))}
            </div>

            {/* New Workspace Button */}
            <button
                onClick={handleNewWorkspace}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex-shrink-0"
                title="Open new workspace"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}
