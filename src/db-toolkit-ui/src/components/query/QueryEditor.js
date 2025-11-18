import { useRef, useEffect } from 'react';
import { Play, Lightbulb } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { Button } from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { registerSqlSnippets } from './sqlSnippets';
import './QueryEditor.css';

export function QueryEditor({ query, onChange, onExecute, onExplain, loading, schema, error }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const { theme } = useTheme();
  const { settings } = useSettingsContext();

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

    // Register autocomplete
    monaco.languages.registerCompletionItemProvider('sql', {
      triggerCharacters: ['.', ' '],
      provideCompletionItems: (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        };

        const suggestions = [];

        // Get current schema from closure
        if (schema?.schemas) {
          Object.entries(schema.schemas).forEach(([schemaName, schemaData]) => {
            if (schemaData.tables) {
              Object.entries(schemaData.tables).forEach(([tableName, tableData]) => {
                suggestions.push({
                  label: tableName,
                  kind: monaco.languages.CompletionItemKind.Class,
                  detail: `Table in ${schemaName}`,
                  insertText: tableName,
                  range,
                  sortText: `1_${tableName}`,
                });

                suggestions.push({
                  label: `${schemaName}.${tableName}`,
                  kind: monaco.languages.CompletionItemKind.Class,
                  detail: 'Qualified table name',
                  insertText: `${schemaName}.${tableName}`,
                  range,
                  sortText: `2_${schemaName}.${tableName}`,
                });

                if (tableData.columns) {
                  tableData.columns.forEach(column => {
                    suggestions.push({
                      label: column.column_name,
                      kind: monaco.languages.CompletionItemKind.Field,
                      detail: `${column.data_type} - ${schemaName}.${tableName}`,
                      insertText: column.column_name,
                      range,
                      sortText: `3_${column.column_name}`,
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
  };

  // Highlight errors in editor
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !error) {
      // Clear decorations if no error
      if (editorRef.current && decorationsRef.current.length > 0) {
        decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
      }
      return;
    }

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Parse error message for line number
    const lineMatch = error.match(/line (\d+)/i);
    const positionMatch = error.match(/position (\d+)/i);
    
    let lineNumber = 1;
    if (lineMatch) {
      lineNumber = parseInt(lineMatch[1], 10);
    } else if (positionMatch) {
      // Estimate line from position
      const position = parseInt(positionMatch[1], 10);
      const lines = query.split('\n');
      let charCount = 0;
      for (let i = 0; i < lines.length; i++) {
        charCount += lines[i].length + 1;
        if (charCount >= position) {
          lineNumber = i + 1;
          break;
        }
      }
    }

    // Add error decoration
    const newDecorations = [
      {
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'error-line',
          glyphMarginClassName: 'error-glyph',
          glyphMarginHoverMessage: { value: error },
          hoverMessage: { value: `**Error:** ${error}` },
        },
      },
    ];

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);

    // Jump to error line
    editor.revealLineInCenter(lineNumber);
    editor.setPosition({ lineNumber, column: 1 });
  }, [error, query]);

  const handleEditorWillMount = (monaco) => {
    // Register SQL snippets
    registerSqlSnippets(monaco);

    // Define custom themes (Monaco has built-in SQL syntax highlighting)
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
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Lightbulb size={16} />}
            onClick={onExplain}
            disabled={loading || !query.trim()}
          >
            Explain
          </Button>
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
            fontSize: settings?.editor_font_size || 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: settings?.auto_format_on_paste || false,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
            glyphMargin: true,
          }}
        />
      </div>
    </div>
  );
}
