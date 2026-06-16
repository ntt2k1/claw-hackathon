from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import os
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s: %(message)s")

from auth.router import router as auth_router
from recommendations.router import router as recommendations_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    from database import init_db
    await init_db()
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(auth_router)
app.include_router(recommendations_router)

@app.get("/health")
async def health():
    return JSONResponse({"status": "ok"})

# Serve React build — must be LAST to not shadow API routes
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
