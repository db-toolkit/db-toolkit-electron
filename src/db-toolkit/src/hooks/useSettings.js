/**
 * Hook for application settings management
 */
import { useState, useCallback, useEffect } from 'react';
import { settingsAPI } from '../services/api';

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await settingsAPI.get();
      setSettings(response.data || response);
      return response.data || response;
    } catch (err) {
      setError(err.message);
      // Provide default settings if API fails
      const defaultSettings = {
        theme: 'system',
        query_limit: 1000,
        query_timeout: 30,
        editor_font_size: 14,
        editor_theme: 'vs-dark',
        default_db_type: 'postgresql'
      };
      setSettings(defaultSettings);
      return defaultSettings;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await settingsAPI.update(updates);
      setSettings(response.data);
      window.dispatchEvent(new Event('settings-updated'));
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await settingsAPI.reset();
      setSettings(response.data);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    refetch: fetchSettings,
  };
}
