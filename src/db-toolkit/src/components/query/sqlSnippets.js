/**
 * SQL snippet templates for Monaco editor
 */
export function registerSqlSnippets(monaco) {
  monaco.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const snippets = [
        {
          label: 'select',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'SELECT ${1:*}\nFROM ${2:table_name}\nWHERE ${3:condition};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'SELECT statement',
          detail: 'SELECT query template',
          range,
          sortText: 'z_select',
        },
        {
          label: 'insert',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'INSERT INTO ${1:table_name} (${2:columns})\nVALUES (${3:values});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'INSERT statement',
          detail: 'INSERT query template',
          range,
          sortText: 'z_insert',
        },
        {
          label: 'update',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'UPDATE ${1:table_name}\nSET ${2:column} = ${3:value}\nWHERE ${4:condition};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'UPDATE statement',
          detail: 'UPDATE query template',
          range,
          sortText: 'z_update',
        },
        {
          label: 'delete',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'DELETE FROM ${1:table_name}\nWHERE ${2:condition};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'DELETE statement',
          detail: 'DELETE query template',
          range,
          sortText: 'z_delete',
        },
        {
          label: 'createtable',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'CREATE TABLE ${1:table_name} (\n  ${2:id} SERIAL PRIMARY KEY,\n  ${3:column_name} ${4:data_type},\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'CREATE TABLE statement',
          detail: 'CREATE TABLE template',
          range,
          sortText: 'z_createtable',
        },
        {
          label: 'join',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'SELECT ${1:*}\nFROM ${2:table1}\nINNER JOIN ${3:table2} ON ${2:table1}.${4:id} = ${3:table2}.${5:foreign_id}\nWHERE ${6:condition};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'JOIN statement',
          detail: 'INNER JOIN template',
          range,
          sortText: 'z_join',
        },
        {
          label: 'leftjoin',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'SELECT ${1:*}\nFROM ${2:table1}\nLEFT JOIN ${3:table2} ON ${2:table1}.${4:id} = ${3:table2}.${5:foreign_id};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'LEFT JOIN statement',
          detail: 'LEFT JOIN template',
          range,
          sortText: 'z_leftjoin',
        },
        {
          label: 'groupby',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'SELECT ${1:column}, COUNT(*)\nFROM ${2:table_name}\nGROUP BY ${1:column}\nHAVING COUNT(*) > ${3:1};',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'GROUP BY statement',
          detail: 'GROUP BY template',
          range,
          sortText: 'z_groupby',
        },
        {
          label: 'createindex',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'CREATE INDEX ${1:index_name} ON ${2:table_name} (${3:column_name});',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'CREATE INDEX statement',
          detail: 'CREATE INDEX template',
          range,
          sortText: 'z_createindex',
        },
      ];

      return { suggestions: snippets };
    },
  });
}
