/**
 * Migrations panel for running migrator commands.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Minimize2, Maximize2, Play, RotateCcw, History, Plus, FileText, Folder } from 'lucide-react';
import { useConnections } from '../../hooks';
import { useMigratorStream } from '../../hooks/useMigratorStream';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../common/Button';

function MigrationsPanel({ isOpen, onClose }) {
  const { connections } = useConnections();
  const toast = useToast();
  const [selectedProject, setSelectedProject] = useState('');
  const [savedProjects, setSavedProjects] = useState([]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [output, setOutput] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [migrationName, setMigrationName] = useState('');
  const [height, setHeight] = useState(384);
  const [isResizing, setIsResizing] = useState(false);
  const outputRef = useRef(null);

  const addOutput = useCallback((text, type = 'info') => {
    setOutput(prev => [...prev, { text, type, timestamp: new Date() }]);
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY;
      setHeight(Math.max(200, Math.min(newHeight, window.innerHeight - 100)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const { executeCommand, isRunning } = useMigratorStream(addOutput);

  useEffect(() => {
    if (isOpen) {
      const projects = JSON.parse(localStorage.getItem('migration-projects') || '[]');
      setSavedProjects(projects);
    }
  }, [isOpen]);

  const handleSelectFolder = async () => {
    const path = await window.electron.ipcRenderer.invoke('select-folder');
    if (path) {
      setSelectedProject(path);
      addOutput(`Selected project: ${path}`, 'info');
    }
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const runCommand = (command, args = []) => {
    if (!selectedProject) {
      toast.error('Please select a project folder');
      return;
    }

    const fullCommand = `${command} ${args.join(' ')}`;
    addOutput(`$ migrator ${fullCommand}`, 'command');
    executeCommand(fullCommand, selectedProject);
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

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40"
        style={{ height: isMaximized ? '100vh' : `${height}px` }}
      >
        <div
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors"
        />
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-900 dark:text-white font-medium">Migrations</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isRunning}
            >
              <option value="">Select project...</option>
              {savedProjects.map((proj, idx) => (
                <option key={idx} value={proj.path}>{proj.name}</option>
              ))}
            </select>
            <button
              onClick={handleSelectFolder}
              disabled={isRunning}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Folder size={14} /> Browse
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              title={isMaximized ? 'Minimize' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
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

        <div 
          ref={outputRef}
          className="overflow-y-auto p-4 font-mono text-sm bg-gray-900 text-gray-100"
          style={{ height: isMaximized ? 'calc(100vh - 120px)' : `${height - 120}px` }}
        >
          {output.length === 0 ? (
            <div className="text-gray-500">Select a connection and run migration commands...</div>
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
    </>
  );
}

export default MigrationsPanel;
