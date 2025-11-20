import { useState, useCallback } from 'react';
import { schemaAPI } from '../services/api';
import { useRequestDeduplication } from './usePerformance';

export function useSchema(connectionId) {
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { dedupedRequest } = useRequestDeduplication();

  const fetchSchemaTree = useCallback(async (useCache = true) => {
    if (!connectionId) return;
    
    const requestKey = `schema_${connectionId}_${useCache}`;
    
    setLoading(true);
    setError(null);
    try {
      const response = await dedupedRequest(requestKey, () => 
        schemaAPI.getTree(connectionId, useCache)
      );
      setSchema(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connectionId, dedupedRequest]);

  const fetchTableInfo = useCallback(async (schemaName, tableName) => {
    if (!connectionId) return;
    
    const requestKey = `table_${connectionId}_${schemaName}_${tableName}`;
    
    setLoading(true);
    setError(null);
    try {
      const response = await dedupedRequest(requestKey, () => 
        schemaAPI.getTableInfo(connectionId, schemaName, tableName)
      );
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connectionId, dedupedRequest]);

  const refreshSchema = useCallback(async () => {
    if (!connectionId) return;
    
    setLoading(true);
    setError(null);
    try {
      await schemaAPI.refresh(connectionId);
      await fetchSchemaTree(false);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [connectionId, fetchSchemaTree]);

  return {
    schema,
    loading,
    error,
    fetchSchemaTree,
    fetchTableInfo,
    refreshSchema,
  };
}
