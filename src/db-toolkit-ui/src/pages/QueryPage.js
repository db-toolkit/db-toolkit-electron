import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Plus, X, Bot } from 'lucide-react';
import Split from 'react-split';
import { useQuery, useSchema } from '../hooks';
import { useExplain } from '../hooks/useExplain';
import { useSettingsContext } from '../contexts/SettingsContext';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { QueryEditor } from '../components/query/QueryEditor';
import { QueryResultsPanel } from '../components/query/QueryResultsPanel';
import { ExplainPlanModal } from '../components/query/ExplainPlanModal';
import { CsvExportModal } from '../components/csv';
import { AiAssistant } from '../components/query/AiAssistant';

function QueryPage() {
  const { connectionId } = useParams();
  const [tabs, setTabs] = useState([{ id: 1, name: 'Query 1', query: '', result: null, executionTime: 0, error: null }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [showExport, setShowExport] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const { loading, executeQuery } = useQuery(connectionId);
  const { schema, fetchSchemaTree } = useSchema(connectionId);
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  const query = activeTab?.query || '';
  const result = activeTab?.result || null;
  const executionTime = activeTab?.executionTime || 0;
  const error = activeTab?.error || null;

  // Load saved tabs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`query-tabs-${connectionId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTabs(parsed.tabs);
        setActiveTabId(parsed.activeTabId);
      } catch (err) {
        console.error('Failed to load saved tabs:', err);
      }
    }
  }, [connectionId]);

  // Auto-save tabs to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`query-tabs-${connectionId}`, JSON.stringify({ tabs, activeTabId }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [tabs, activeTabId, connectionId]);

  // Fetch schema for autocomplete
  useEffect(() => {
    if (connectionId) {
      fetchSchemaTree().catch(err => console.error('Failed to load schema:', err));
    }
  }, [connectionId, fetchSchemaTree]);

  const setQuery = useCallback((newQuery) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, query: newQuery } : t));
  }, [activeTabId]);

  const addTab = () => {
    const newId = Math.max(...tabs.map(t => t.id)) + 1;
    setTabs(prev => [...prev, { id: newId, name: `Query ${newId}`, query: '', result: null, executionTime: 0, error: null }]);
    setActiveTabId(newId);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    const index = tabs.findIndex(t => t.id === id);
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[Math.max(0, index - 1)].id);
    }
  };
  const [showExplainModal, setShowExplainModal] = useState(false);
  const { explainResult, loading: explainLoading, explainQuery } = useExplain(connectionId);
  const { settings } = useSettingsContext();

  const handleExplain = async () => {
    if (!query.trim()) return;
    setShowExplainModal(true);
    try {
      await explainQuery(query);
    } catch (err) {
      console.error('Explain failed:', err);
    }
  };

  const handleExecute = async () => {
    if (!query.trim()) return;
    const startTime = Date.now();
    try {
      const limit = settings?.default_query_limit || 1000;
      const timeout = settings?.default_query_timeout || 30;
      const queryResult = await executeQuery(query, limit, 0, timeout);
      const time = Date.now() - startTime;
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, result: queryResult, executionTime: time, error: null } : t));
    } catch (err) {
      console.error('Query failed:', err);
      const errorMsg = err.response?.data?.detail || err.message;
      const time = Date.now() - startTime;
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, error: errorMsg, executionTime: time } : t));
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex justify-between items-center px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t cursor-pointer transition ${
                activeTabId === tab.id
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span className="text-sm font-medium whitespace-nowrap">{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                  className="hover:text-red-600 dark:hover:text-red-400"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
            title="New tab"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant={showAiAssistant ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowAiAssistant(!showAiAssistant)}
          >
            <Bot size={16} className="mr-2" />
            AI Assistant
          </Button>
          {result && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowExport(true)}
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>



      <div className="flex-1 overflow-hidden flex">
        {showAiAssistant ? (
          <Split
            sizes={[75, 25]}
            minSize={[400, 300]}
            gutterSize={8}
            className="flex h-full w-full"
          >
            <div className="h-full overflow-hidden">
              <Split
                direction="vertical"
                sizes={[50, 50]}
                minSize={200}
                gutterSize={8}
                className="flex flex-col h-full"
              >
                <div className="overflow-hidden">
                  <QueryEditor
                    query={query}
                    onChange={setQuery}
                    onExecute={handleExecute}
                    onExplain={handleExplain}
                    loading={loading}
                    schema={schema}
                    error={error}
                  />
                </div>

                <div className="overflow-hidden">
                  <QueryResultsPanel
                    connectionId={connectionId}
                    result={result}
                    executionTime={executionTime}
                    onSelectQuery={setQuery}
                    onRefresh={handleExecute}
                  />
                </div>
              </Split>
            </div>
            
            <div className="overflow-hidden">
              <AiAssistant
                connectionId={connectionId}
                currentQuery={query}
                onQueryGenerated={setQuery}
                onQueryOptimized={(result) => {
                  console.log('Query optimized:', result);
                }}
                lastError={error}
                schemaContext={{ tables: schema }}
                isVisible={showAiAssistant}
                onClose={() => setShowAiAssistant(false)}
              />
            </div>
          </Split>
        ) : (
          <div className="flex-1 overflow-hidden">
            <Split
              direction="vertical"
              sizes={[50, 50]}
              minSize={200}
              gutterSize={8}
              className="flex flex-col h-full"
            >
              <div className="overflow-hidden">
                <QueryEditor
                  query={query}
                  onChange={setQuery}
                  onExecute={handleExecute}
                  onExplain={handleExplain}
                  loading={loading}
                  schema={schema}
                  error={error}
                />
              </div>

              <div className="overflow-hidden">
                <QueryResultsPanel
                  connectionId={connectionId}
                  result={result}
                  executionTime={executionTime}
                  onSelectQuery={setQuery}
                  onRefresh={handleExecute}
                />
              </div>
            </Split>
          </div>
        )}
      </div>

      <CsvExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        connectionId={connectionId}
        query={query}
      />

      <ExplainPlanModal
        isOpen={showExplainModal}
        onClose={() => setShowExplainModal(false)}
        explainResult={explainResult}
        loading={explainLoading}
      />
    </div>
  );
}

export default QueryPage;
