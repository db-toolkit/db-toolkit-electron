/**
 * Workspace Tab Bar Component
 */
import { Plus } from "lucide-react";
import { useWorkspace } from "./WorkspaceProvider";
import { WorkspaceTab } from "./WorkspaceTab";
import { useNavigate } from "react-router-dom";

export function WorkspaceTabBar() {
  const {
    workspaces,
    activeWorkspaceId,
    switchWorkspace,
    closeWorkspace,
    createWorkspace,
    updateWorkspace,
  } = useWorkspace();
  const navigate = useNavigate();

  const handleNewWorkspace = async () => {
    const newWorkspace = await createWorkspace(
      null,
      `Workspace ${workspaces.length + 1}`,
      null,
    );
    if (newWorkspace) {
      navigate("/");
    }
  };

  const handleTabClick = (workspaceId) => {
    switchWorkspace(workspaceId);
  };

  const handleCloseTab = async (workspaceId) => {
    await closeWorkspace(workspaceId);
  };

  return (
    <div className="flex items-center gap-0 min-w-0 flex-1 relative h-full">
      {/* Workspace Tabs - Scrollable Container */}
      <div
        className="flex items-center overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent h-full"
        style={{
          width: "calc(100% - 44px)", // Reserve space for + button
          WebkitOverflowScrolling: "touch",
        }}
      >
        {workspaces.map((workspace) => (
          <WorkspaceTab
            key={workspace.id}
            workspace={workspace}
            isActive={workspace.id === activeWorkspaceId}
            onClick={handleTabClick}
            onClose={handleCloseTab}
            onUpdate={updateWorkspace}
            workspaces={workspaces}
          />
        ))}
      </div>

      {/* New Workspace Button - Fixed to right */}
      <button
        onClick={handleNewWorkspace}
        className="absolute right-0 top-0 bottom-0 flex items-center justify-center px-3 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 z-10"
        style={{ WebkitAppRegion: "no-drag" }}
        title="Open new workspace"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
