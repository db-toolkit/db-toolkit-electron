/**
 * Workspace Tab Bar Component
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkspace } from './WorkspaceProvider';
import { WorkspaceTab } from './WorkspaceTab';
import { useNavigate } from 'react-router-dom';

export function WorkspaceTabBar() {
    const { workspaces, activeWorkspaceId, switchWorkspace, closeWorkspace, createWorkspace, updateWorkspace } = useWorkspace();
    const navigate = useNavigate();
    const [draggedIndex, setDraggedIndex] = useState(null);

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
        await closeWorkspace(workspaceId);
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newWorkspaces = [...workspaces];
        const draggedItem = newWorkspaces[draggedIndex];
        newWorkspaces.splice(draggedIndex, 1);
        newWorkspaces.splice(index, 0, draggedItem);

        // Update order in backend
        newWorkspaces.forEach((ws, idx) => {
            updateWorkspace(ws.id, { order: idx });
        });

        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };



    return (
        <div className="flex items-center bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {/* Workspace Tabs */}
            <div className="flex items-center flex-1 overflow-x-auto">
                {workspaces.map((workspace, index) => (
                    <div
                        key={workspace.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                    >
                        <WorkspaceTab
                            workspace={workspace}
                            isActive={workspace.id === activeWorkspaceId}
                            onClick={handleTabClick}
                            onClose={handleCloseTab}
                            onUpdate={updateWorkspace}
                            workspaces={workspaces}
                        />
                    </div>
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
