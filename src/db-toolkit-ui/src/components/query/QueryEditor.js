import { useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { Button } from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';

export function QueryEditor({ query, onChange, onExecute, loading, schema }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const { theme } = useTheme();

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Execute query: Ctrl+Enter
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      () => {
        onExecute();
      }
    );

    // Format query: Ctrl+Shift+F
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
      () => {
        try {
          const formatted = format(editor.getValue(), {
            language: 'postgresql',
            tabWidth: 2,
            keywordCase: 'upper',
          });
          editor.setValue(formatted);
        } catch (err) {
          console.error('Format error:', err);
        }
      }
    );
  };

  // Register autocomplete provider when schema changes
  useEffect(() => {
    if (!monacoRef.current || !schema) return;

    const monaco = monacoRef.current;
    const disposable = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [];

        // Get text before cursor to determine context
        const textBeforeCursor = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        }).toUpperCase();

        // Suggest tables after FROM, JOIN, INTO, UPDATE
        const tableKeywords = ['FROM', 'JOIN', 'INTO', 'UPDATE'];
        const shouldSuggestTables = tableKeywords.some(kw => 
          textBeforeCursor.includes(kw) && 
          textBeforeCursor.lastIndexOf(kw) > textBeforeCursor.lastIndexOf('WHERE')
        );

        if (shouldSuggestTables && schema.schemas) {
          Object.entries(schema.schemas).forEach(([schemaName, schemaData]) => {
            if (schemaData.tables) {
              Object.keys(schemaData.tables).forEach(tableName => {
                suggestions.push({
                  label: tableName,
                  kind: monaco.languages.CompletionItemKind.Class,
                  detail: `Table in ${schemaName}`,
                  insertText: tableName,
                  range,
                });

                // Also suggest schema.table format
                suggestions.push({
                  label: `${schemaName}.${tableName}`,
                  kind: monaco.languages.CompletionItemKind.Class,
                  detail: 'Qualified table name',
                  insertText: `${schemaName}.${tableName}`,
                  range,
                });
              });
            }
          });
        }

        // Suggest columns after SELECT, WHERE, SET, ORDER BY, GROUP BY
        const columnKeywords = ['SELECT', 'WHERE', 'SET', 'ORDER BY', 'GROUP BY', 'HAVING'];
        const shouldSuggestColumns = columnKeywords.some(kw => textBeforeCursor.includes(kw));

        if (shouldSuggestColumns && schema.schemas) {
          Object.entries(schema.schemas).forEach(([schemaName, schemaData]) => {
            if (schemaData.tables) {
              Object.entries(schemaData.tables).forEach(([tableName, tableData]) => {
                if (tableData.columns) {
                  tableData.columns.forEach(column => {
                    suggestions.push({
                      label: column.column_name,
                      kind: monaco.languages.CompletionItemKind.Field,
                      detail: `${column.data_type} - ${schemaName}.${tableName}`,
                      insertText: column.column_name,
                      range,
                    });
                  });
                }
              });
            }
          });
        }

        return { suggestions };
      },
    });

    return () => disposable.dispose();
  }, [schema]);

  const handleEditorWillMount = (monaco) => {
    monaco.languages.register({ id: 'sql' });
    
    monaco.languages.setMonarchTokensProvider('sql', {
      keywords: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP',
        'TABLE', 'INDEX', 'VIEW', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AND', 'OR',
        'NOT', 'NULL', 'IS', 'IN', 'LIKE', 'BETWEEN', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
        'OFFSET', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UNION', 'ALL', 'EXISTS',
        'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'DEFAULT',
        'CHECK', 'UNIQUE', 'CASCADE', 'SET', 'VALUES', 'RETURNING'
      ],
      operators: ['=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=', '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%', '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=', '%=', '<<=', '>>=', '>>>='],
      tokenizer: {
        root: [
          [/[a-z_$][\w$]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          [/[A-Z][\w$]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'type.identifier'
            }
          }],
          { include: '@whitespace' },
          [/[{}()\[\]]/, '@brackets'],
          [/[<>](?!@symbols)/, '@brackets'],
          [/@symbols/, {
            cases: {
              '@operators': 'operator',
              '@default': ''
            }
          }],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          [/[;,.]/, 'delimiter'],
          [/'([^'\\]|\\.)*$/, 'string.invalid'],
          [/'/, 'string', '@string'],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@stringDouble'],
        ],
        string: [
          [/[^\\']+/, 'string'],
          [/\\./, 'string.escape.invalid'],
          [/'/, 'string', '@pop']
        ],
        stringDouble: [
          [/[^\\"]+/, 'string'],
          [/\\./, 'string.escape.invalid'],
          [/"/, 'string', '@pop']
        ],
        whitespace: [
          [/[ \t\r\n]+/, 'white'],
          [/--.*$/, 'comment'],
          [/\/\*/, 'comment', '@comment'],
        ],
        comment: [
          [/[^\/*]+/, 'comment'],
          [/\*\//, 'comment', '@pop'],
          [/[\/*]/, 'comment']
        ],
      },
    });

    monaco.editor.defineTheme('sql-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '0000FF', fontStyle: 'bold' },
        { token: 'string', foreground: 'A31515' },
        { token: 'number', foreground: '098658' },
        { token: 'comment', foreground: '008000', fontStyle: 'italic' },
        { token: 'operator', foreground: '000000' },
      ],
      colors: {}
    });

    monaco.editor.defineTheme('sql-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
        { token: 'operator', foreground: 'D4D4D4' },
      ],
      colors: {}
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">SQL Editor</h3>
        <Button
          size="sm"
          icon={<Play size={16} />}
          onClick={onExecute}
          disabled={loading || !query.trim()}
          loading={loading}
        >
          Run (Ctrl+Enter)
        </Button>
      </div>
      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="sql"
          value={query}
          onChange={onChange}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'sql-dark' : 'sql-light'}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          }}
        />
      </div>
    </div>
  );
}
