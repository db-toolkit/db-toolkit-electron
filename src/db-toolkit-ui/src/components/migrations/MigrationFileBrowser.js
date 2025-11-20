/**
 * Migration file browser component.
 */
import { useState, useEffect } from 'react';
import { FileText, Eye, Edit, Trash2, Edit3, FolderOpen } from 'lucide-react';
import { Button } from '../common/Button';
import { useToast } from '../../contexts/ToastContext';

function MigrationFileBrowser({ projectPath, onRefresh }) {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [showContentModal, setShowContentModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (projectPath) {
      loadFiles();
    }
  }, [projectPath]);

  const loadFiles = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('list-migration-files', projectPath);
      setFiles(result || []);
    } catch (error) {
      toast.error('Failed to load migration files');
    }
  };

  const handleViewContent = async (file) => {
    try {
      const content = await window.electron.ipcRenderer.invoke('read-file', file.path);
      setFileContent(content);
      setSelectedFile(file);
      setShowContentModal(true);
    } catch (error) {
      toast.error('Failed to read file');
    }
  };

  const handleOpenInEditor = async (file) => {
    try {
      await window.electron.ipcRenderer.invoke('open-in-editor', file.path);
      toast.success('Opened in system editor');
    } catch (error) {
      toast.error('Failed to open file');
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Delete ${file.name}?`)) return;

    try {
      await window.electron.ipcRenderer.invoke('delete-file', file.path);
      toast.success('File deleted');
      loadFiles();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleRename = async () => {
    if (!newFileName.trim()) {
      toast.error('Please enter a file name');
      return;
    }

    try {
      await window.electron.ipcRenderer.invoke('rename-file', selectedFile.path, newFileName);
      toast.success('File renamed');
      setShowRenameModal(false);
      setNewFileName('');
      loadFiles();
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error('Failed to rename file');
    }
  };

  const handleOpenFolder = async () => {
    try {
      await window.electron.ipcRenderer.invoke('open-folder', projectPath);
    } catch (error) {
      toast.error('Failed to open folder');
    }
  };

  if (!projectPath) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        Select a project to view migration files
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Migration Files</h3>
        <Button size="sm" variant="secondary" onClick={handleOpenFolder}>
          <FolderOpen size={14} className="mr-1" /> Open Folder
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            No migration files found
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {file.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleViewContent(file)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="View content"
                  >
                    <Eye size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleOpenInEditor(file)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Open in editor"
                  >
                    <Edit size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(file);
                      setNewFileName(file.name);
                      setShowRenameModal(true);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Rename"
                  >
                    <Edit3 size={14} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Delete"
                  >
                    <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showContentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedFile?.name}
              </h3>
              <button
                onClick={() => setShowContentModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <pre className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
                {fileContent}
              </pre>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="secondary" onClick={() => setShowContentModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRenameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Rename File
            </h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowRenameModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleRename}>Rename</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MigrationFileBrowser;
