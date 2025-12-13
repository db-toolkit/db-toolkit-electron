import { useRef, useEffect } from 'react';
import { Play } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { format } from 'sql-formatter';
import { Button } from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { registerSqlSnippets } from './sqlSnippets';
import { createSQLCompletionProvider, clearCompletionCache } from '../../utils/monacoCompletions';
import { createSQLHoverProvider } from '../../utils/monacoHoverProvider';
import recentItemsTracker from '../../utils/recentItemsTracker';
import { FixSuggestionCard } from './FixSuggestionCard';
import './QueryEditor.css';

export function QueryEditor({ query, onChange, onExecute, loading, schema, error, fixSuggestion, onAcceptFix, onRejectFix }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const schemaRef = useRef(schema);
  const providerRef = useRef(null);
  const { theme } = useTheme();
  const { settings } = useSettingsContext();

  const handleExecuteWithFormat = () => {
    // Track query usage for autocomplete
    if (query && query.trim()) {
      recentItemsTracker.trackFromQuery(query);
    }

    // Format query before execution if setting is enabled
    if (settings?.auto_format_on_paste && query && query.trim()) {
      try {
        const formatted = format(query, {
          language: 'postgresql',
          tabWidth: 2,
          keywordCase: 'upper',
        });
        if (formatted && formatted !== query) {
          onChange(formatted);
          // Execute after a brief delay to allow state update
          setTimeout(() => onExecute(), 50);
        } else {
          onExecute();
        }
      } catch (err) {
        console.error('Format error:', err);
        onExecute();
      }
    } else {
      onExecute();
    }
  };

  // Update schema ref and clear cache when schema changes
  useEffect(() => {
    schemaRef.current = schema;
    if (providerRef.current) {
      clearCompletionCache(providerRef.current);
    }
  }, [schema]);

  // Prevent default reload on Cmd+R globally when editor is focused
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Use ref to access latest handler in Monaco commands (which close over initial props)
  const handleExecuteWithFormatRef = useRef(handleExecuteWithFormat);
  useEffect(() => {
    handleExecuteWithFormatRef.current = handleExecuteWithFormat;
  }, [handleExecuteWithFormat]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Execute query: F5 or Cmd+R
    const runQuery = () => {
      console.log('Run query triggered');
      if (handleExecuteWithFormatRef.current) {
        handleExecuteWithFormatRef.current();
      }
    };

    editor.addCommand(monaco.KeyCode.F5, runQuery);

    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR,
      runQuery
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

    // Toggle comment: Ctrl+/
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash,
      () => {
        editor.trigger('keyboard', 'editor.action.commentLine');
      }
    );

    // Register schema-aware autocomplete
    // Use a getter that accesses the ref to ensure we always get the latest schema
    const getSchema = () => Promise.resolve(schemaRef.current);
    const completionProvider = createSQLCompletionProvider(getSchema, monaco, recentItemsTracker);
    providerRef.current = completionProvider;
    monaco.languages.registerCompletionItemProvider('sql', completionProvider);

    // Register hover provider
    const hoverProvider = createSQLHoverProvider(getSchema, monaco);
    monaco.languages.registerHoverProvider('sql', hoverProvider);
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
    // Register SQL snippets if enabled
    if (settings?.editor_snippets_enabled !== false) {
      registerSqlSnippets(monaco);
    }

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
            size="sm"
            icon={<Play size={16} />}
            onClick={handleExecuteWithFormat}
            disabled={loading || !query.trim()}
            loading={loading}
          >
            Run (Cmd+R)
          </Button>
        </div>
      </div>
      <div className="flex-1 relative">
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
            tabSize: settings?.editor_tab_size || 2,
            wordWrap: settings?.editor_word_wrap ? 'on' : 'off',
            formatOnPaste: settings?.auto_format_on_paste || false,
            formatOnType: true,
            suggestOnTriggerCharacters: settings?.editor_auto_complete !== false,
            quickSuggestions: settings?.editor_auto_complete !== false ? true : false,
            snippetSuggestions: settings?.editor_snippets_enabled !== false ? 'inline' : 'none',
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
            glyphMargin: true,
          }}
        />
        <FixSuggestionCard
          suggestion={fixSuggestion}
          onAccept={onAcceptFix}
          onReject={onRejectFix}
        />
      </div>
    </div>
  );
}
