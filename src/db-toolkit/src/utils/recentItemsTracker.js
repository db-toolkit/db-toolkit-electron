/**
 * Track recently used tables and columns for better autocomplete sorting
 */

class RecentItemsTracker {
  constructor(maxItems = 50) {
    this.maxItems = maxItems;
    this.recentTables = [];
    this.recentColumns = [];
  }

  /**
   * Track table usage
   */
  trackTable(tableName) {
    if (!tableName) return;

    // Remove if exists
    this.recentTables = this.recentTables.filter(t => t !== tableName);
    
    // Add to front
    this.recentTables.unshift(tableName);
    
    // Limit size
    if (this.recentTables.length > this.maxItems) {
      this.recentTables = this.recentTables.slice(0, this.maxItems);
    }
  }

  /**
   * Track column usage
   */
  trackColumn(columnName) {
    if (!columnName) return;

    // Remove if exists
    this.recentColumns = this.recentColumns.filter(c => c !== columnName);
    
    // Add to front
    this.recentColumns.unshift(columnName);
    
    // Limit size
    if (this.recentColumns.length > this.maxItems) {
      this.recentColumns = this.recentColumns.slice(0, this.maxItems);
    }
  }

  /**
   * Track items from query text
   */
  trackFromQuery(query) {
    if (!query) return;

    // Extract table names (after FROM, JOIN)
    const tableMatches = query.match(/(?:FROM|JOIN)\s+(\w+)/gi);
    if (tableMatches) {
      tableMatches.forEach(match => {
        const table = match.replace(/(?:FROM|JOIN)\s+/i, '').trim();
        this.trackTable(table);
      });
    }

    // Extract column names (after SELECT, WHERE)
    const columnMatches = query.match(/(?:SELECT|WHERE)\s+[\w.]+/gi);
    if (columnMatches) {
      columnMatches.forEach(match => {
        const parts = match.replace(/(?:SELECT|WHERE)\s+/i, '').trim().split('.');
        const column = parts[parts.length - 1];
        if (column && column !== '*') {
          this.trackColumn(column);
        }
      });
    }
  }

  /**
   * Get priority score for item (higher = more recent)
   */
  getTablePriority(tableName) {
    const index = this.recentTables.indexOf(tableName);
    return index === -1 ? 0 : this.maxItems - index;
  }

  getColumnPriority(columnName) {
    const index = this.recentColumns.indexOf(columnName);
    return index === -1 ? 0 : this.maxItems - index;
  }

  /**
   * Clear all tracked items
   */
  clear() {
    this.recentTables = [];
    this.recentColumns = [];
  }
}

// Singleton instance
const tracker = new RecentItemsTracker();

export default tracker;
