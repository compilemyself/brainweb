import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, flow, mapas

app = FastAPI(title="Brainweb API", version="1.0.0")


def _normalize_origin(value: str) -> str:
    return value.strip().rstrip("/")


def _configured_origins():
    origins = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # FRONTEND_URL mantém compatibilidade com a configuração já usada.
    frontend_url = os.getenv("FRONTEND_URL", "")
    if frontend_url.strip():
        origins.append(_normalize_origin(frontend_url))

    # CORS_ORIGINS já constava na documentação, mas antes era ignorada pelo
    # backend. Aceita uma ou várias URLs separadas por vírgula.
    cors_origins = os.getenv("CORS_ORIGINS", "")
    for origin in cors_origins.split(","):
        normalized = _normalize_origin(origin)
        if normalized:
            origins.append(normalized)

    # Remove repetições preservando a ordem para facilitar a leitura dos logs.
    return list(dict.fromkeys(origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=_configured_origins(),
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(mapas.router)
app.include_router(flow.router)


@app.get("/")
def root():
    return {"status": "Brainweb API online"}


@app.get("/health")
def health():
    return {"status": "ok"}
