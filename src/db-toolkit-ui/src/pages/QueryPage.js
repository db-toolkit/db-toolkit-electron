import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Plus, X, Bot, Loader2, Workflow } from 'lucide-react';
import Split from 'react-split';
import { useQuery, useSchema } from '../hooks';
import { useSettingsContext } from '../contexts/SettingsContext';
import { Button } from '../components/common/Button';
import { connectionsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { QueryEditor } from '../components/query/QueryEditor';
import { QueryResultsPanel } from '../components/query/QueryResultsPanel';
import { CsvExportModal } from '../components/csv';
import { AiAssistant } from '../components/query/AiAssistant';
import { QueryBuilder } from '../components/query-builder/QueryBuilder';
import { cacheService } from '../services/indexedDB';

function QueryPage() {
  const { connectionId } = useParams();
  const [tabs, setTabs] = useState([{ id: 1, name: 'Query 1', query: '', result: null, executionTime: 0, error: null, chatHistory: [] }]);
  const [activeTabId, setActiveTabId] = useState(1);
  const [showExport, setShowExport] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showQueryBuilder, setShowQueryBuilder] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const { loading, executeQuery } = useQuery(connectionId);
  const { schema, fetchSchemaTree } = useSchema(connectionId);
  const toast = useToast();
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  const query = activeTab?.query || '';
  const result = activeTab?.result || null;
  const executionTime = activeTab?.executionTime || 0;
  const error = activeTab?.error || null;

  // Load saved tabs from IndexedDB (with localStorage fallback)
  useEffect(() => {
    const loadTabs = async () => {
      try {
        // Try IndexedDB first
        const cached = await cacheService.getQueryTabs(connectionId);
        if (cached) {
          setTabs(cached.tabs);
          setActiveTabId(cached.activeTabId);
          return;
        }

        // Fallback to localStorage
        const saved = localStorage.getItem(`query-tabs-${connectionId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setTabs(parsed.tabs);
          setActiveTabId(parsed.activeTabId);
          // Migrate to IndexedDB
          await cacheService.setQueryTabs(connectionId, parsed);
          localStorage.removeItem(`query-tabs-${connectionId}`);
        }
      } catch (err) {
        console.error('Failed to load saved tabs:', err);
      }
    };
    loadTabs();
  }, [connectionId]);

  // Auto-save tabs to IndexedDB
  useEffect(() => {
    const timer = setTimeout(() => {
      cacheService.setQueryTabs(connectionId, { tabs, activeTabId }).catch(err => {
        console.error('Failed to save tabs:', err);
        // Fallback to localStorage
        localStorage.setItem(`query-tabs-${connectionId}`, JSON.stringify({ tabs, activeTabId }));
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [tabs, activeTabId, connectionId]);

  // Auto-reconnect on page load
  useEffect(() => {
    const reconnect = async () => {
      if (!connectionId) return;
      
      setReconnecting(true);
      let retries = 3;
      
      while (retries > 0) {
        try {
          await connectionsAPI.connect(connectionId);
          await fetchSchemaTree();
          setReconnecting(false);
          return;
        } catch (err) {
          retries--;
          console.error(`Reconnection attempt failed (${3 - retries}/3):`, err);
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          } else {
            toast.error('Failed to reconnect after 3 attempts');
          }
        }
      }
      
      setReconnecting(false);
    };
    
    reconnect();
  }, [connectionId, fetchSchemaTree, toast]);

  const setQuery = useCallback((newQuery) => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, query: newQuery } : t));
  }, [activeTabId]);

  const addTab = () => {
    const newId = Math.max(...tabs.map(t => t.id)) + 1;
    setTabs(prev => [...prev, { id: newId, name: `Query ${newId}`, query: '', result: null, executionTime: 0, error: null, chatHistory: [] }]);
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
  const { settings } = useSettingsContext();

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
      {reconnecting && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-700 dark:text-blue-300">Reconnecting to database...</span>
        </div>
      )}

      <div className="flex-shrink-0 flex justify-between items-center px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700" style={{ opacity: reconnecting ? 0.5 : 1, pointerEvents: reconnecting ? 'none' : 'auto' }}>
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
            variant="secondary"
            size="sm"
            onClick={() => setShowQueryBuilder(true)}
          >
            <Workflow size={16} className="mr-2" />
            Visual Builder
          </Button>
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



      <div className="flex-1 min-h-0 flex">
        {showAiAssistant ? (
          <Split
            sizes={[75, 25]}
            minSize={[400, 300]}
            gutterSize={8}
            className="flex h-full w-full"
          >
            <div className="h-full flex flex-col">
              <Split
                direction="vertical"
                sizes={[50, 50]}
                minSize={200}
                gutterSize={8}
                className="flex flex-col h-full"
              >
                <div className="flex flex-col">
                  <QueryEditor
                    query={query}
                    onChange={setQuery}
                    onExecute={handleExecute}
                    loading={loading}
                    schema={schema}
                    error={error}
                  />
                </div>

                <div className="flex flex-col">
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
            
            <div className="flex flex-col h-full">
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
                chatHistory={activeTab?.chatHistory || []}
                onChatUpdate={(newHistory) => {
                  setTabs(prev => prev.map(t => 
                    t.id === activeTabId ? { ...t, chatHistory: newHistory.slice(-10) } : t
                  ));
                }}
              />
            </div>
          </Split>
        ) : (
          <div className="flex-1">
            <Split
              direction="vertical"
              sizes={[50, 50]}
              minSize={200}
              gutterSize={8}
              className="flex flex-col h-full"
            >
              <div className="flex flex-col">
                <QueryEditor
                  query={query}
                  onChange={setQuery}
                  onExecute={handleExecute}
                  loading={loading}
                  schema={schema}
                  error={error}
                />
              </div>

              <div className="flex flex-col">
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
        result={result}
      />

      {showQueryBuilder && schema && (
        <QueryBuilder
          schema={schema}
          onClose={() => setShowQueryBuilder(false)}
          onExecuteQuery={async (sql) => {
            setQuery(sql);
            setShowQueryBuilder(false);
            // Execute after a brief delay to allow UI to update
            setTimeout(() => handleExecute(), 100);
          }}
        />
      )}
    </div>
  );
}

export default QueryPage;
