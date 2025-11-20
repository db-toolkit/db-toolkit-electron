"""WebSocket handler for terminal sessions."""
import asyncio
import os
import pty
import select
import struct
import fcntl
import termios
from fastapi import WebSocket, WebSocketDisconnect


async def websocket_terminal(websocket: WebSocket):
    """Handle terminal WebSocket connection."""
    await websocket.accept()
    
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
        
        # Change to user home directory
        home = os.path.expanduser('~')
        os.chdir(home)
        
        # Execute shell with login flag for prompt
        os.execv(shell, [shell, '-l'])
    else:
        # Parent process
        os.close(slave_fd)
        
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
        
        async def write_input():
            """Receive from WebSocket and write to terminal."""
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
                        else:
                            os.write(master_fd, text.encode())
            except WebSocketDisconnect:
                pass
        
        try:
            await asyncio.gather(read_output(), write_input())
        finally:
            os.close(master_fd)
            os.kill(pid, 9)
            os.waitpid(pid, 0)
