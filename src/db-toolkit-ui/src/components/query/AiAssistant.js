/**
 * AI Assistant panel for Query Editor
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  AlertCircle,
  Loader2,
  X,
  ArrowRight
} from 'lucide-react';
import { Button } from '../common/Button';
import { useAiAssistant } from '../../hooks/useAiAssistant';
import { useToast } from '../../contexts/ToastContext';

export function AiAssistant({ 
  connectionId, 
  currentQuery, 
  onQueryGenerated, 
  onQueryOptimized,
  lastError,
  schemaContext = {},
  isVisible,
  onClose,
  chatHistory = [],
  onChatUpdate
}) {
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [copiedStates, setCopiedStates] = useState({});
  
  const { generateQuery, optimizeQuery, explainQuery, fixQueryError, isLoading, error, clearError } = useAiAssistant(connectionId);
  const toast = useToast();

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
      toast.success('Copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const handleGenerateQuery = async () => {
    if (!naturalLanguage.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      const userMessage = { role: 'user', content: naturalLanguage, type: 'generate' };
      onChatUpdate([...chatHistory, userMessage]);
      
      const result = await generateQuery(naturalLanguage, schemaContext);
      if (result.success && result.sql) {
        const assistantMessage = { role: 'assistant', content: result.sql, type: 'sql' };
        onChatUpdate([...chatHistory, userMessage, assistantMessage]);
        onQueryGenerated(result.sql);
        toast.success('Query generated successfully');
        setNaturalLanguage('');
      } else {
        const errorMessage = { role: 'assistant', content: result.error || 'Failed to generate query', type: 'error' };
        onChatUpdate([...chatHistory, userMessage, errorMessage]);
        toast.error(result.error || 'Failed to generate query');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };



  return (
    <div className="bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">DBAssist</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          title="Close AI Assistant"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
              Start by describing what you want to query
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 ml-4' 
                  : 'bg-gray-50 dark:bg-gray-900 mr-4'
              }`}>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {msg.role === 'user' ? 'You' : 'DBAssist'}
                </div>
                <div className={`text-sm ${
                  msg.type === 'sql' ? 'font-mono bg-gray-800 dark:bg-gray-950 text-green-400 p-2 rounded' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                <Button
                  onClick={clearError}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-600 dark:text-red-400"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input at bottom */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="relative">
          <textarea
            value={naturalLanguage}
            onChange={(e) => setNaturalLanguage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (naturalLanguage.trim() && !isLoading) {
                  handleGenerateQuery();
                }
              }
            }}
            placeholder="Describe what you want to query..."
            className="w-full h-24 px-3 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleGenerateQuery}
            disabled={isLoading || !naturalLanguage.trim()}
            className={`absolute right-2 bottom-2 p-2 rounded-lg transition-colors ${
              naturalLanguage.trim() && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ArrowRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}