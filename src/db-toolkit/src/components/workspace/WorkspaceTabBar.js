/**
 * Workspace Tab Bar Component
 */
import { Plus } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { WorkspaceTab } from './WorkspaceTab';
import { useNavigate } from 'react-router-dom';

export function WorkspaceTabBar() {
    const { workspaces, activeWorkspaceId, switchWorkspace, closeWorkspace } = useWorkspace();
    const navigate = useNavigate();

    const handleNewWorkspace = () => {
        navigate('/connections');
    };

    const handleTabClick = (workspaceId) => {
        const workspace = workspaces.find(w => w.id === workspaceId);
        if (workspace) {
            switchWorkspace(workspaceId);
            // Navigate to the workspace's last active route
            if (workspace.state?.activeRoute) {
                navigate(workspace.state.activeRoute);
            }
        }
    };

    const handleCloseTab = async (workspaceId) => {
        // TODO: Check for unsaved changes before closing
        await closeWorkspace(workspaceId);
    };

    if (workspaces.length === 0) {
        return null;
    }

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
