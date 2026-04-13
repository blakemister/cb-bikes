from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path

from app.routes import api, reports, bike_week, schema, websocket

app = FastAPI(title="CB Bikes Operations Platform")

# API routes
app.include_router(api.router)
app.include_router(reports.router)
app.include_router(bike_week.router)
app.include_router(schema.router)
app.include_router(websocket.router)

# Serve frontend static files
frontend_dir = Path(__file__).parent.parent / "frontend"

app.mount("/assets", StaticFiles(directory=frontend_dir / "assets"), name="assets")
app.mount("/css", StaticFiles(directory=frontend_dir / "css"), name="css")
app.mount("/js", StaticFiles(directory=frontend_dir / "js"), name="js")


@app.get("/")
async def index():
    return FileResponse(frontend_dir / "index.html")


@app.get("/favicon.ico")
async def favicon():
    return JSONResponse(content={}, status_code=204)


# SPA catch-all — serve index.html for client-side routing
@app.api_route("/{path:path}", methods=["GET"])
async def spa_catch_all(request: Request, path: str):
    # Skip paths that should 404 naturally (API, WebSocket, static)
    if path.startswith(("api/", "ws/", "css/", "js/", "assets/")):
        return JSONResponse({"error": "Not found"}, status_code=404)
    return FileResponse(frontend_dir / "index.html")
