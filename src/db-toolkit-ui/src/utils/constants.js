/**
 * Application constants
 */

// Cache TTL (Time To Live) in milliseconds
export const CACHE_TTL = {
  SCHEMA: 15 * 60 * 1000,       // 15 minutes
  TABLE_INFO: 10 * 60 * 1000,   // 10 minutes
  CONNECTIONS: 30 * 60 * 1000,  // 30 minutes
  SETTINGS: 60 * 60 * 1000,     // 1 hour
};

// Cache keys
export const CACHE_KEYS = {
  SCHEMA: 'db_toolkit_schema',
  TABLE_INFO: 'db_toolkit_table_info',
  CONNECTIONS: 'db_toolkit_connections',
  SETTINGS: 'db_toolkit_settings',
};
