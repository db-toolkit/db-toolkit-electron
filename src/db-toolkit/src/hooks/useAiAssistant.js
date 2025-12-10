/**
 * Hook for AI assistant functionality
 */
import { useState } from 'react';
const ipc = {
  invoke: (channel, ...args) => window.electron.ipcRenderer.invoke(channel, ...args)
};

export function useAiAssistant(connectionId) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateQuery = async (naturalLanguage, schemaContext = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ipc.invoke('ai:generate-query', {
        connection_id: connectionId,
        natural_language: naturalLanguage,
        schema_context: schemaContext
      });
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to generate query';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const optimizeQuery = async (query, executionPlan = null, schemaContext = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ipc.invoke('ai:optimize-query', {
        connection_id: connectionId,
        query,
        execution_plan: executionPlan,
        schema_context: schemaContext
      });
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to optimize query';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const explainQuery = async (query, schemaContext = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ipc.invoke('ai:explain-query', {
        connection_id: connectionId,
        query,
        schema_context: schemaContext
      });
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to explain query';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fixQueryError = async (query, errorMessage, schemaContext = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await ipc.invoke('ai:fix-query', {
        connection_id: connectionId,
        query,
        error_message: errorMessage,
        schema_context: schemaContext
      });
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fix query';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    generateQuery,
    optimizeQuery,
    explainQuery,
    fixQueryError,
    isLoading,
    error,
    clearError
  };
}