import { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightActiveLine, drawSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { sql, PostgreSQL } from '@codemirror/lang-sql';
import { autocompletion, closeBrackets } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { Button } from '../common/Button';

export function QueryEditor({ query, onChange, onExecute, loading, schema }) {
  const editorRef = useRef(null);
  const viewRef = useRef(null);
  const isDark = document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (!editorRef.current) return;

    const tables = {};
    if (schema) {
      Object.entries(schema).forEach(([schemaName, schemaData]) => {
        schemaData.tables?.forEach(table => {
          tables[table.name] = table.columns?.map(col => col.name) || [];
        });
      });
    }

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      drawSelection(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      sql({ dialect: PostgreSQL, schema: tables }),
      syntaxHighlighting(defaultHighlightStyle),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        { key: 'Ctrl-Enter', run: () => { onExecute(); return true; } },
        { key: 'Cmd-Enter', run: () => { onExecute(); return true; } },
      ]),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
      EditorView.theme({
        '&': {
          height: '300px',
          fontSize: '14px',
          border: '1px solid #e5e7eb',
        },
        '.cm-content': {
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          padding: '10px 0',
          caretColor: '#3b82f6',
        },
        '.cm-cursor': {
          borderLeftColor: '#3b82f6',
          borderLeftWidth: '2px',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
        },
        '.cm-gutters': {
          backgroundColor: '#f9fafb',
          color: '#9ca3af',
          border: 'none',
        },
      }, { dark: false }),
    ];

    if (isDark) {
      extensions.push(oneDark);
    }

    const startState = EditorState.create({
      doc: query,
      extensions,
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [schema, isDark]);

  useEffect(() => {
    if (viewRef.current && query !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: { from: 0, to: viewRef.current.state.doc.length, insert: query },
      });
    }
  }, [query]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
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
      <div
        ref={editorRef}
        className="rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700"
      />
    </div>
  );
}
