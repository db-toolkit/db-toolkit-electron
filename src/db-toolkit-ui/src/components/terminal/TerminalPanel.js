/**
 * Terminal panel with tabs and modern theme.
 */
import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { X, Minimize2, Maximize2, Plus } from 'lucide-react';
import { WS_ENDPOINTS } from '../../services/websocket';
import 'xterm/css/xterm.css';

function TerminalPanel({ isOpen, onClose }) {
  const [tabs, setTabs] = useState(() => {
    const saved = localStorage.getItem('terminal-tabs');
    return saved ? JSON.parse(saved) : [{ id: 1, title: 'Terminal 1' }];
  });
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('terminal-active-tab');
    return saved ? parseInt(saved) : 1;
  });
  const [isMaximized, setIsMaximized] = useState(false);
  const [height, setHeight] = useState(() => {
    const saved = localStorage.getItem('terminal-height');
    return saved ? parseInt(saved) : 384;
  });
  const [isResizing, setIsResizing] = useState(false);
  const terminalsRef = useRef({});
  const containerRefs = useRef({});

  useEffect(() => {
    localStorage.setItem('terminal-tabs', JSON.stringify(tabs));
  }, [tabs]);

  useEffect(() => {
    localStorage.setItem('terminal-active-tab', activeTab.toString());
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('terminal-height', height.toString());
  }, [height]);

  const addTab = () => {
    const newId = Math.max(...tabs.map(t => t.id)) + 1;
    setTabs([...tabs, { id: newId, title: `Terminal ${newId}` }]);
    setActiveTab(newId);
  };

  const closeTab = (id) => {
    if (tabs.length === 1) return;
    
    const terminal = terminalsRef.current[id];
    if (terminal) {
      terminal.term?.dispose();
      terminal.ws?.close();
      delete terminalsRef.current[id];
    }
    
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    
    // Clean up session storage
    localStorage.removeItem(`terminal-session-${id}`);
    
    if (activeTab === id) {
      setActiveTab(newTabs[newTabs.length - 1].id);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    tabs.forEach(tab => {
      if (terminalsRef.current[tab.id]) return;

      const containerRef = containerRefs.current[tab.id];
      if (!containerRef) return;

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Menlo, Monaco, "Courier New", monospace',
        scrollback: 10000,
        theme: {
          background: '#0f172a',
          foreground: '#e2e8f0',
          cursor: '#06b6d4',
          cursorAccent: '#0f172a',
          black: '#1e293b',
          red: '#ef4444',
          green: '#10b981',
          yellow: '#f59e0b',
          blue: '#3b82f6',
          magenta: '#a855f7',
          cyan: '#06b6d4',
          white: '#cbd5e1',
          brightBlack: '#475569',
          brightRed: '#f87171',
          brightGreen: '#34d399',
          brightYellow: '#fbbf24',
          brightBlue: '#60a5fa',
          brightMagenta: '#c084fc',
          brightCyan: '#22d3ee',
          brightWhite: '#f1f5f9',
        },
      });

      const fit = new FitAddon();
      term.loadAddon(fit);
      term.open(containerRef);
      
      setTimeout(() => {
        fit.fit();
        if (tab.id === activeTab) {
          term.focus();
        }
      }, 50);

      const ws = new WebSocket(WS_ENDPOINTS.TERMINAL);

      ws.onopen = () => {
        // Send session ID to restore previous state
        ws.send(JSON.stringify({ session_id: `tab-${tab.id}` }));
      };

      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          event.data.arrayBuffer().then((buffer) => {
            term.write(new Uint8Array(buffer));
          });
        } else {
          term.write(event.data);
        }
      };

      let currentDir = '';
      
      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
          
          // Track directory changes (simple detection)
          if (data === '\r') {
            // Send current directory for session save
            setTimeout(() => {
              if (currentDir) {
                ws.send(`SESSION:${currentDir}`);
              }
            }, 100);
          }
        }
      });

      term.onResize(({ rows, cols }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(`RESIZE:${rows}:${cols}`);
        }
      });

      terminalsRef.current[tab.id] = { term, fit, ws };
    });

    const handleWindowResize = () => {
      Object.values(terminalsRef.current).forEach(({ fit }) => {
        fit?.fit();
      });
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, [isOpen, tabs, activeTab]);

  useEffect(() => {
    if (isOpen && terminalsRef.current[activeTab]) {
      const { fit, term } = terminalsRef.current[activeTab];
      const timer = setTimeout(() => {
        fit?.fit();
        term?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [height, isMaximized, isOpen, activeTab]);

  useEffect(() => {
    return () => {
      // Save all sessions before unmount
      Object.keys(terminalsRef.current).forEach(tabId => {
        const { ws } = terminalsRef.current[tabId];
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      
      Object.values(terminalsRef.current).forEach(({ term, ws }) => {
        term?.dispose();
        ws?.close();
      });
      terminalsRef.current = {};
    };
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newHeight = window.innerHeight - e.clientY;
      setHeight(Math.max(200, Math.min(newHeight, window.innerHeight - 100)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-slate-900 to-slate-950 border-t border-cyan-500/20 z-40 shadow-2xl"
      style={{ height: isMaximized ? '100vh' : `${height}px` }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-cyan-500 transition-colors"
      />
      
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
        <div className="flex items-center gap-2 flex-1 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-cyan-400 border-t-2 border-cyan-500'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="text-xs font-medium whitespace-nowrap">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="hover:text-red-400 transition-colors"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-all"
            title="New Terminal"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400 transition-all"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-all"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="relative w-full h-full" style={{ height: isMaximized ? 'calc(100vh - 48px)' : `${height - 48}px` }}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`absolute inset-0 ${activeTab === tab.id ? 'block' : 'hidden'}`}
          >
            <div
              ref={el => containerRefs.current[tab.id] = el}
              className="w-full h-full p-3"
              onClick={() => terminalsRef.current[tab.id]?.term?.focus()}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default TerminalPanel;
