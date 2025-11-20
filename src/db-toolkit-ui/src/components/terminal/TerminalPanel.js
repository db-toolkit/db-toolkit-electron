/**
 * Terminal panel with xterm.js integration.
 */
import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { WS_ENDPOINTS } from '../../services/websocket';
import 'xterm/css/xterm.css';

function TerminalPanel({ isOpen, onClose }) {
  const terminalRef = useRef(null);
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [height, setHeight] = useState(384);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (!isOpen || !terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      scrollback: 10000,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);
    
    setTimeout(() => {
      fit.fit();
      term.focus();
    }, 50);

    termRef.current = term;
    fitAddonRef.current = fit;

    const ws = new WebSocket(WS_ENDPOINTS.TERMINAL);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (event.data instanceof Blob) {
        event.data.arrayBuffer().then((buffer) => {
          term.write(new Uint8Array(buffer));
        });
      } else {
        term.write(event.data);
      }
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    term.onResize(({ rows, cols }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`RESIZE:${rows}:${cols}`);
      }
    });

    const handleWindowResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
      term.dispose();
      ws.close();
      termRef.current = null;
      fitAddonRef.current = null;
      wsRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && fitAddonRef.current && termRef.current) {
      const timer = setTimeout(() => {
        fitAddonRef.current.fit();
        termRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [height, isMaximized, isOpen]);

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
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-40"
      style={{ height: isMaximized ? '100vh' : `${height}px` }}
    >
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors"
      />
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm text-white font-medium">Terminal</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            title={isMaximized ? 'Minimize' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div
        ref={terminalRef}
        className="w-full p-2 overflow-hidden"
        style={{ height: isMaximized ? 'calc(100vh - 40px)' : `${height - 40}px` }}
        onClick={() => termRef.current?.focus()}
      />
    </div>
  );
}

export default TerminalPanel;
