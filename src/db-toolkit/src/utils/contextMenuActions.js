/**
 * Context menu action utilities for schema operations.
 */

import { 
  Eye, 
  Code, 
  FileText, 
  Copy, 
  Download, 
  Bot, 
  RefreshCw, 
  Trash2 
} from 'lucide-react';

/**
 * Generate SELECT * query for a table.
 */
export function generateSelectQuery(schemaName, tableName) {
  return `SELECT * FROM ${schemaName}.${tableName} LIMIT 100;`;
}

/**
 * Generate INSERT template for a table.
 */
export function generateInsertTemplate(schemaName, tableName, columns = []) {
  if (!columns || columns.length === 0) {
    return `INSERT INTO ${schemaName}.${tableName} (column1, column2) VALUES (value1, value2);`;
  }
  
  const columnNames = columns.map(col => col.name || col.column_name).join(', ');
  const valuePlaceholders = columns.map(() => '?').join(', ');
  
  return `INSERT INTO ${schemaName}.${tableName} (${columnNames})\nVALUES (${valuePlaceholders});`;
}

/**
 * Generate UPDATE template for a table.
 */
export function generateUpdateTemplate(schemaName, tableName, columns = []) {
  if (!columns || columns.length === 0) {
    return `UPDATE ${schemaName}.${tableName}\nSET column1 = value1\nWHERE condition;`;
  }
  
  const setClause = columns
    .slice(0, 3)
    .map(col => `${col.name || col.column_name} = ?`)
    .join(',\n    ');
  
  return `UPDATE ${schemaName}.${tableName}\nSET ${setClause}\nWHERE condition;`;
}

/**
 * Generate DROP TABLE statement.
 */
export function generateDropTableQuery(schemaName, tableName) {
  return `DROP TABLE ${schemaName}.${tableName};`;
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Export table schema as JSON.
 */
export function exportSchemaAsJSON(schemaName, tableName, tableData) {
  const schema = {
    schema: schemaName,
    table: tableName,
    columns: tableData?.columns || [],
    indexes: tableData?.indexes || [],
    constraints: tableData?.constraints || [],
    exported_at: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${tableName}_schema.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Get context menu items for table.
 */
export function getTableContextMenuItems({
  schemaName,
  tableName,
  tableData,
  onViewData,
  onGenerateQuery,
  onAnalyzeWithAI,
  onRefresh,
  onDrop,
  toast
}) {
  return [
    {
      label: 'View Data (top 100 rows)',
      icon: <Eye size={16} />,
      onClick: () => onViewData?.(schemaName, tableName)
    },
    {
      label: 'Generate SELECT *',
      icon: <Code size={16} />,
      onClick: () => {
        const query = generateSelectQuery(schemaName, tableName);
        onGenerateQuery?.(query);
        toast?.success('SELECT query generated');
      }
    },
    {
      label: 'Generate INSERT template',
      icon: <FileText size={16} />,
      onClick: () => {
        const query = generateInsertTemplate(schemaName, tableName, tableData?.columns);
        onGenerateQuery?.(query);
        toast?.success('INSERT template generated');
      }
    },
    {
      label: 'Generate UPDATE template',
      icon: <FileText size={16} />,
      onClick: () => {
        const query = generateUpdateTemplate(schemaName, tableName, tableData?.columns);
        onGenerateQuery?.(query);
        toast?.success('UPDATE template generated');
      }
    },
    {
      label: 'Copy Table Name',
      icon: <Copy size={16} />,
      onClick: async () => {
        const success = await copyToClipboard(`${schemaName}.${tableName}`);
        if (success) toast?.success('Table name copied');
      }
    },
    {
      label: 'Export Schema as JSON',
      icon: <Download size={16} />,
      onClick: () => {
        exportSchemaAsJSON(schemaName, tableName, tableData);
        toast?.success('Schema exported');
      }
    },
    {
      label: 'Analyze with AI',
      icon: <Bot size={16} />,
      onClick: () => onAnalyzeWithAI?.(schemaName, tableName, tableData)
    },
    { separator: true },
    {
      label: 'Refresh Table',
      icon: <RefreshCw size={16} />,
      onClick: () => onRefresh?.(schemaName, tableName)
    },
    {
      label: 'Drop Table',
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: () => onDrop?.(schemaName, tableName)
    }
  ];
}
