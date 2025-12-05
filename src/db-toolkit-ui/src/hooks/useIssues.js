import { useState, useCallback } from 'react';
import { issuesAPI } from '../services/api';

export function useIssues() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createIssue = useCallback(async (issueData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await issuesAPI.create(issueData);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to create issue';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await issuesAPI.getAll();
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch issues';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const getIssueById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await issuesAPI.getById(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch issue';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateIssueStatus = useCallback(async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      const response = await issuesAPI.updateStatus(id, status);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to update issue';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteIssue = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await issuesAPI.delete(id);
      return response.data;
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete issue';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createIssue,
    getAllIssues,
    getIssueById,
    updateIssueStatus,
    deleteIssue
  };
}
