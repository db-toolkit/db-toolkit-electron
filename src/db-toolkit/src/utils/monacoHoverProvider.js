/**
 * Monaco Editor hover provider for SQL
 */

/**
 * Find column info from schema
 */
function findColumnInfo(word, schema) {
  if (!schema?.schemas) return null;

  for (const [schemaName, schemaData] of Object.entries(schema.schemas)) {
    if (!schemaData.tables) continue;

    for (const [tableName, tableData] of Object.entries(schemaData.tables)) {
      if (!tableData.columns) continue;

      // Check if word matches table.column format
      if (word.includes('.')) {
        const [table, column] = word.split('.');
        if (table === tableName) {
          const col = tableData.columns.find(c => c.column_name === column);
          if (col) return { ...col, tableName, schemaName };
        }
      } else {
        // Check column name only
        const col = tableData.columns.find(c => c.column_name === word);
        if (col) return { ...col, tableName, schemaName };
      }
    }
  }

  return null;
}

/**
 * Find table info from schema
 */
function findTableInfo(word, schema) {
  if (!schema?.schemas) return null;

  for (const [schemaName, schemaData] of Object.entries(schema.schemas)) {
    if (!schemaData.tables) continue;

    const tableData = schemaData.tables[word];
    if (tableData) {
      return { ...tableData, tableName: word, schemaName };
    }
  }

  return null;
}

/**
 * Format column hover content
 */
function formatColumnHover(columnInfo) {
  const parts = [
    `**${columnInfo.tableName}.${columnInfo.column_name}**`,
    '',
    `Type: \`${columnInfo.data_type}\``,
  ];

  if (columnInfo.character_maximum_length) {
    parts.push(`Max Length: ${columnInfo.character_maximum_length}`);
  }

  if (columnInfo.is_nullable === 'NO') {
    parts.push('**NOT NULL**');
  }

  if (columnInfo.column_default) {
    parts.push(`Default: \`${columnInfo.column_default}\``);
  }

  if (columnInfo.is_primary_key) {
    parts.push('🔑 **PRIMARY KEY**');
  }

  if (columnInfo.is_foreign_key) {
    parts.push('🔗 **FOREIGN KEY**');
  }

  return parts.join('\n\n');
}

/**
 * Format table hover content
 */
function formatTableHover(tableInfo) {
  const parts = [
    `**Table: ${tableInfo.tableName}**`,
    '',
    `Schema: \`${tableInfo.schemaName}\``,
    `Columns: ${tableInfo.column_count || tableInfo.columns?.length || 0}`,
  ];

  if (tableInfo.row_count !== undefined) {
    parts.push(`Rows: ${tableInfo.row_count}`);
  }

  return parts.join('\n\n');
}

/**
 * Create Monaco hover provider
 */
export function createSQLHoverProvider(getSchema, monaco) {
  return {
    provideHover: async function(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const schema = await getSchema();
      if (!schema) return null;

      // Check if it's a column
      const columnInfo = findColumnInfo(word.word, schema);
      if (columnInfo) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: formatColumnHover(columnInfo) }
          ]
        };
      }

      // Check if it's a table
      const tableInfo = findTableInfo(word.word, schema);
      if (tableInfo) {
        return {
          range: new monaco.Range(
            position.lineNumber,
            word.startColumn,
            position.lineNumber,
            word.endColumn
          ),
          contents: [
            { value: formatTableHover(tableInfo) }
          ]
        };
      }

      return null;
    }
  };
}
