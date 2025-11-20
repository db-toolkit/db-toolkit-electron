/**
 * Migrations page for database schema migrations.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, RotateCcw, History, Plus, FileText, Folder, Trash2, X } from 'lucide-react';
import { useConnections } from '../hooks';
import { useMigratorStream } from '../hooks/useMigratorStream';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/common/Button';
import MigrationFileBrowser from '../components/migrations/MigrationFileBrowser';

function MigrationsPage() {
  const { connections } = useConnections();
  const toast = useToast();
  const [selectedProject, setSelectedProject] = useState(null);
  const [savedProjects, setSavedProjects] = useState([]);
  const [output, setOutput] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [migrationName, setMigrationName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectPath, setProjectPath] = useState('');
  const [projectConnection, setProjectConnection] = useState('');
  const outputRef = useRef(null);

  const addOutput = useCallback((text, type = 'info') => {
    setOutput(prev => [...prev, { text, type, timestamp: new Date() }]);
  }, []);

  const { executeCommand, isRunning } = useMigratorStream(addOutput);

  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem('migration-projects') || '[]');
    setSavedProjects(projects);
    if (projects.length > 0) {
      setSelectedProject(projects[0]);
    }
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const handleSelectFolder = async () => {
    const path = await window.electron.ipcRenderer.invoke('select-folder');
    if (path) {
      setProjectPath(path);
    }
  };

  const handleSaveProject = () => {
    if (!projectName.trim() || !projectPath.trim() || !projectConnection) {
      toast.error('Please fill all fields');
      return;
    }

    const newProject = {
      name: projectName,
      path: projectPath,
      connectionId: projectConnection,
    };

    const updated = [...savedProjects, newProject];
    setSavedProjects(updated);
    localStorage.setItem('migration-projects', JSON.stringify(updated));
    setSelectedProject(newProject);
    setShowProjectModal(false);
    setProjectName('');
    setProjectPath('');
    setProjectConnection('');
    toast.success('Project saved');
  };

  const handleDeleteProject = (projectToDelete) => {
    if (window.confirm(`Delete project "${projectToDelete.name}"?`)) {
      const updated = savedProjects.filter(p => p.path !== projectToDelete.path);
      setSavedProjects(updated);
      localStorage.setItem('migration-projects', JSON.stringify(updated));
      if (selectedProject?.path === projectToDelete.path) {
        setSelectedProject(updated[0] || null);
      }
      toast.success('Project deleted');
    }
  };

  const runCommand = (command, args = []) => {
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }

    if (!selectedProject.connectionId) {
      toast.error('Project has no database connection');
      return;
    }

    const connection = connections.find(c => c.id === selectedProject.connectionId);
    if (!connection) {
      toast.error('Database connection not found');
      return;
    }

    const dbUrl = `${connection.db_type}://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;
    const fullCommand = `${command} ${args.join(' ')}`;
    addOutput(`$ migrator ${fullCommand}`, 'command');
    executeCommand(fullCommand, selectedProject.path, dbUrl);
  };

  const handleInit = () => runCommand('init');
  
  const handleCreate = () => {
    if (!migrationName.trim()) {
      toast.error('Please enter migration name');
      return;
    }
    runCommand('makemigrations', [`"${migrationName}"`]);
    setShowCreateModal(false);
    setMigrationName('');
  };

  const handleApply = () => runCommand('migrate');
  const handleRollback = () => runCommand('downgrade');
  const handleHistory = () => runCommand('history');

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Database Migrations</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedProject?.path || ''}
            onChange={(e) => {
              const proj = savedProjects.find(p => p.path === e.target.value);
              setSelectedProject(proj || null);
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={isRunning}
          >
            <option value="">Select project...</option>
            {savedProjects.map((proj, idx) => (
              <option key={idx} value={proj.path}>{proj.name}</option>
            ))}
          </select>

          <Button size="sm" onClick={() => setShowProjectModal(true)} disabled={isRunning}>
            <Plus size={16} className="mr-1" /> New Project
          </Button>

          {selectedProject && (
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => handleDeleteProject(selectedProject)}
              disabled={isRunning}
            >
              <Trash2 size={16} className="mr-1" /> Delete
            </Button>
          )}
        </div>

        {selectedProject && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            <div>Path: {selectedProject.path}</div>
            <div>Connection: {connections.find(c => c.id === selectedProject.connectionId)?.name || 'Not found'}</div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleInit} disabled={isRunning || !selectedProject}>
          <FileText size={14} className="mr-1" /> Init
        </Button>
        <Button size="sm" onClick={() => setShowCreateModal(true)} disabled={isRunning || !selectedProject}>
          <Plus size={14} className="mr-1" /> Create
        </Button>
        <Button size="sm" onClick={handleApply} disabled={isRunning || !selectedProject}>
          <Play size={14} className="mr-1" /> Apply
        </Button>
        <Button size="sm" variant="secondary" onClick={handleRollback} disabled={isRunning || !selectedProject}>
          <RotateCcw size={14} className="mr-1" /> Rollback
        </Button>
        <Button size="sm" variant="secondary" onClick={handleHistory} disabled={isRunning || !selectedProject}>
          <History size={14} className="mr-1" /> History
        </Button>
        </div>
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={() => setOutput([])} 
          disabled={output.length === 0}
          title="Clear output"
        >
          <X size={14} className="mr-1" /> Clear
        </Button>
      </div>

      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-6 font-mono text-sm bg-gray-900 text-gray-100"
      >
        {output.length === 0 ? (
          <div className="text-gray-500">
            {!selectedProject 
              ? 'Create or select a migration project to get started...'
              : 'Run migration commands to see output here...'}
          </div>
        ) : (
          output.map((line, idx) => (
            <div 
              key={idx} 
              className={`mb-1 ${
                line.type === 'command' ? 'text-blue-400' :
                line.type === 'error' ? 'text-red-400' :
                line.type === 'success' ? 'text-green-400' :
                'text-gray-300'
              }`}
            >
              {line.text}
            </div>
          ))
        )}
      </div>
      </div>

      {/* File Browser Sidebar */}
      <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <MigrationFileBrowser 
          projectPath={selectedProject?.path} 
          onRefresh={() => addOutput('Files refreshed', 'info')}
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Migration</h3>
            <input
              type="text"
              placeholder="Migration name (e.g., add users table)"
              value={migrationName}
              onChange={(e) => setMigrationName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Migration Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="My Project"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="/path/to/project"
                    value={projectPath}
                    onChange={(e) => setProjectPath(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <Button size="sm" onClick={handleSelectFolder}>
                    <Folder size={16} />
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Database Connection
                </label>
                <select
                  value={projectConnection}
                  onChange={(e) => setProjectConnection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select connection...</option>
                  {connections.map((conn) => (
                    <option key={conn.id} value={conn.id}>{conn.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <Button variant="secondary" onClick={() => setShowProjectModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProject}>
                Save Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MigrationsPage;
