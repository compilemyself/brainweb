import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, flow, mapas
app = FastAPI(title="Brainweb API", version="1.1.0")
def _normalize_origin(value: str): return value.strip().rstrip("/")
def _configured_origins():
    origins=["http://localhost:3000","http://localhost:5173"]
    for value in (os.getenv("FRONTEND_URL", ""),):
        if value.strip(): origins.append(_normalize_origin(value))
    for origin in os.getenv("CORS_ORIGINS", "").split(","):
        if origin.strip(): origins.append(_normalize_origin(origin))
    return list(dict.fromkeys(origins))
app.add_middleware(CORSMiddleware, allow_origins=_configured_origins(), allow_origin_regex=r"^https://.*\.vercel\.app$", allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(auth.router); app.include_router(mapas.router); app.include_router(flow.router)
@app.get("/")
def root(): return {"status":"Brainweb API online"}
@app.get("/health")
def health(): return {"status":"ok"}