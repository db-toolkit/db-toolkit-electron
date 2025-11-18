import { useRef } from 'react';
import { Play } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Button } from '../common/Button';
import { useTheme } from '../../contexts/ThemeContext';

export function QueryEditor({ query, onChange, onExecute, loading }) {
  const editorRef = useRef(null);
  const { theme } = useTheme();

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
    
    editor.addCommand(
      window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter,
      () => {
        onExecute();
      }
    );
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
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
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
