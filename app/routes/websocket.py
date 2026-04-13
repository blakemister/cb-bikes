from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.database import subscribe, unsubscribe, get_log

router = APIRouter()


@router.websocket("/ws/sql-log")
async def sql_log_ws(ws: WebSocket):
    await ws.accept()
    q = subscribe()
    try:
        # Send existing log entries first
        for entry in get_log():
            await ws.send_json(entry)
        # Stream new entries
        while True:
            entry = await q.get()
            await ws.send_json(entry)
    except WebSocketDisconnect:
        pass
    finally:
        unsubscribe(q)
