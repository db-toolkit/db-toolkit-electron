import { useState } from 'react';
import { Save, X, Trash2, Plus } from 'lucide-react';
import { Button } from '../common/Button';
import { useData } from '../../hooks';
import { useToast } from '../../contexts/ToastContext';

export function EditableTable({ connectionId, result, onRefresh }) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const { updateRow, deleteRow } = useData(connectionId);
  const toast = useToast();

  const startEdit = (rowIdx, colIdx, value) => {
    setEditingCell({ rowIdx, colIdx });
    setEditValue(value !== null ? String(value) : '');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveEdit = async (rowIdx, colIdx) => {
    const column = result.columns[colIdx];
    const row = result.rows[rowIdx];
    
    // Assume first column is primary key
    const primaryKey = { [result.columns[0]]: row[0] };
    const changes = { [column]: editValue || null };

    try {
      await updateRow('table_name', 'public', primaryKey, changes);
      toast.success('Row updated successfully');
      cancelEdit();
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to update row');
    }
  };

  const handleDelete = async (rowIdx) => {
    if (!window.confirm('Delete this row?')) return;

    const row = result.rows[rowIdx];
    const primaryKey = { [result.columns[0]]: row[0] };

    try {
      await deleteRow('table_name', 'public', primaryKey);
      toast.success('Row deleted successfully');
      onRefresh?.();
    } catch (err) {
      toast.error('Failed to delete row');
    }
  };

  if (!result || !result.rows) return null;

  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 w-20">
              Actions
            </th>
            {result.columns?.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {result.rows?.map((row, rowIdx) => (
            <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-3">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleDelete(rowIdx)}
                />
              </td>
              {row.map((cell, colIdx) => (
                <td
                  key={colIdx}
                  className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900"
                  onDoubleClick={() => startEdit(rowIdx, colIdx, cell)}
                >
                  {editingCell?.rowIdx === rowIdx && editingCell?.colIdx === colIdx ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="px-2 py-1 border rounded text-sm w-full dark:bg-gray-800 dark:border-gray-600"
                        autoFocus
                      />
                      <button onClick={() => saveEdit(rowIdx, colIdx)} className="text-green-600 hover:text-green-700">
                        <Save size={16} />
                      </button>
                      <button onClick={cancelEdit} className="text-red-600 hover:text-red-700">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <span>{cell !== null ? String(cell) : <span className="text-gray-400 italic">NULL</span>}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
