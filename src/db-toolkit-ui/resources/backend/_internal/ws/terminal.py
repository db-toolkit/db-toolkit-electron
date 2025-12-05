"""WebSocket handler for terminal sessions."""
import asyncio
import os
import pty
import select
import struct
import fcntl
import termios
import json
from fastapi import WebSocket, WebSocketDisconnect
from ws.terminal_sessions import save_session, get_session


async def websocket_terminal(websocket: WebSocket):
    """Handle terminal WebSocket connection."""
    await websocket.accept()
    
    # Receive session ID from client
    init_msg = await websocket.receive_text()
    session_data = json.loads(init_msg)
    session_id = session_data.get('session_id')
    
    # Load previous session if exists
    previous_session = get_session(session_id) if session_id else None
    
    # Create pseudo-terminal
    master_fd, slave_fd = pty.openpty()
    
    # Set initial terminal size
    winsize = struct.pack('HHHH', 24, 80, 0, 0)
    fcntl.ioctl(master_fd, termios.TIOCSWINSZ, winsize)
    
    # Set terminal to raw mode
    attrs = termios.tcgetattr(slave_fd)
    attrs[3] = attrs[3] | termios.ECHO
    termios.tcsetattr(slave_fd, termios.TCSANOW, attrs)
    
    # Start shell process
    shell = os.environ.get('SHELL', '/bin/bash')
    pid = os.fork()
    
    if pid == 0:
        # Child process
        os.close(master_fd)
        os.setsid()
        os.dup2(slave_fd, 0)
        os.dup2(slave_fd, 1)
        os.dup2(slave_fd, 2)
        os.close(slave_fd)
        
        # Set environment for interactive shell
        os.environ['TERM'] = 'xterm-256color'
        os.environ['COLORTERM'] = 'truecolor'
        
        # Restore previous directory or use home
        if previous_session and os.path.exists(previous_session.get('cwd', '')):
            os.chdir(previous_session['cwd'])
        else:
            home = os.path.expanduser('~')
            os.chdir(home)
        
        # Execute shell with login flag for prompt
        os.execv(shell, [shell, '-l'])
    else:
        # Parent process
        os.close(slave_fd)
        
        # Set initial cwd to match child process
        if previous_session and os.path.exists(previous_session.get('cwd', '')):
            initial_cwd = previous_session['cwd']
        else:
            initial_cwd = os.path.expanduser('~')
        
        async def read_output():
            """Read from terminal and send to WebSocket."""
            while True:
                try:
                    r, _, _ = select.select([master_fd], [], [], 0.1)
                    if r:
                        data = os.read(master_fd, 1024)
                        if data:
                            await websocket.send_bytes(data)
                        else:
                            break
                    await asyncio.sleep(0.01)
                except Exception:
                    break
        
        command_history = []
        current_cwd = initial_cwd
        
        async def write_input():
            """Receive from WebSocket and write to terminal."""
            nonlocal current_cwd
            try:
                while True:
                    data = await websocket.receive()
                    if 'bytes' in data:
                        os.write(master_fd, data['bytes'])
                    elif 'text' in data:
                        text = data['text']
                        if text.startswith('RESIZE:'):
                            # Handle resize: RESIZE:rows:cols
                            _, rows, cols = text.split(':')
                            winsize = struct.pack('HHHH', int(rows), int(cols), 0, 0)
                            fcntl.ioctl(master_fd, termios.TIOCSWINSZ, winsize)
                        elif text.startswith('SESSION:'):
                            # Handle session save: SESSION:cwd
                            _, cwd = text.split(':', 1)
                            current_cwd = cwd
                        else:
                            os.write(master_fd, text.encode())
                            # Track commands (on Enter key)
                            if text == '\r':
                                command_history.append(text)
            except (WebSocketDisconnect, RuntimeError):
                pass
        
        try:
            await asyncio.gather(read_output(), write_input())
        finally:
            # Save session before closing
            if session_id:
                save_session(session_id, current_cwd, command_history)
            
            os.close(master_fd)
            os.kill(pid, 9)
            os.waitpid(pid, 0)
