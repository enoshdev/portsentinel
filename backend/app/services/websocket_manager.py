import asyncio
import json
from typing import List, Dict, Any, Optional
from fastapi import WebSocket

class WebSocketManager:
    """Manages active WebSocket connections for real-time dashboard telemetry broadcasting."""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        """Stores the main ASGI asyncio event loop for thread-safe broadcasting."""
        self.loop = loop

    async def connect(self, websocket: WebSocket):
        self.loop = asyncio.get_running_loop()
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcasts a JSON message to all active dashboard subscribers."""
        dead_connections = []
        payload = json.dumps(message)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                dead_connections.append(connection)
        
        for dead in dead_connections:
            self.disconnect(dead)

    def broadcast_sync(self, message: Dict[str, Any]):
        """Thread-safe broadcast callable from sync FastAPI worker threads and Scapy sniffer threads."""
        if not self.active_connections:
            return
        try:
            loop = self.loop
            if loop and loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast(message), loop)
                return
            running_loop = asyncio.get_running_loop()
            if running_loop.is_running():
                asyncio.create_task(self.broadcast(message))
        except Exception:
            pass

# Global singleton manager
ws_manager = WebSocketManager()
