import { useEffect, useState } from 'react';
import { Columns, Key, Sparkles } from 'lucide-react';
import { useSchema } from '../../hooks';
import { useSchemaAI } from '../../hooks/useSchemaAI';
import { useToast } from '../../contexts/ToastContext';
import { LoadingState } from '../common/LoadingState';
import { Button } from '../common/Button';
import { TableAiInsights } from './TableAiInsights';

export function TableDetails({ connectionId, schemaName, tableName }) {
  const { fetchTableInfo } = useSchema(connectionId);
  const { analyzeTable, loading: aiLoading } = useSchemaAI(connectionId);
  const toast = useToast();
  const [tableInfo, setTableInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableAnalysis, setTableAnalysis] = useState(null);
  const [showAiInsights, setShowAiInsights] = useState(false);

  useEffect(() => {
    if (schemaName && tableName) {
      loadTableInfo();
    }
  }, [schemaName, tableName]);

  const loadTableInfo = async () => {
    setLoading(true);
    try {
      const info = await fetchTableInfo(schemaName, tableName);
      setTableInfo(info);
    } catch (err) {
      console.error('Failed to load table info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeTable = async (forceRefresh = false) => {
    try {
      setShowAiInsights(true);
      const result = await analyzeTable(tableName, tableInfo?.columns || [], forceRefresh);
      setTableAnalysis(result);
      toast.success('Table analysis complete');
    } catch (err) {
      toast.error('Failed to analyze table');
    }
  };

  if (loading) return <LoadingState message="Loading table details..." />;
  if (!tableInfo) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {schemaName}.{tableName}
        </h3>
        <Button
          variant="secondary"
          size="sm"
          icon={<Sparkles size={16} />}
          onClick={() => handleAnalyzeTable()}
          disabled={aiLoading}
        >
          {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
        </Button>
      </div>

      {showAiInsights && (
        <TableAiInsights analysis={tableAnalysis} loading={aiLoading} />
      )}

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Columns size={20} className="text-green-600 dark:text-green-400" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Columns</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nullable</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {tableInfo.columns?.map((col) => (
                <tr key={col.column_name} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">{col.column_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{col.data_type}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{col.is_nullable === 'YES' ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-2 text-sm">
                    {col.is_primary_key && <Key size={16} className="text-yellow-600 dark:text-yellow-400" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {tableInfo.sample_data && (
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Data</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {tableInfo.columns?.map((col) => (
                    <th key={col.column_name} className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                      {col.column_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tableInfo.sample_data.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    {Object.values(row).map((cell, cellIdx) => (
                      <td key={cellIdx} className="px-4 py-2 text-gray-900 dark:text-gray-100">
                        {cell !== null ? String(cell) : <span className="text-gray-400 italic">NULL</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
