from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_usuario_atual
from app.models.usuario import Usuario
from app.repositories.mapa_repo import MapaRepo
from app.schemas.mapa_mental import MapaCreate, MapaSchema
from app.services.mapa_servico import MapaServico

router = APIRouter(prefix="/mapas", tags=["Mapas Mentais"])


def get_servico(db: Session = Depends(get_db)) -> MapaServico:
    return MapaServico(MapaRepo(db))


@router.post("/", response_model=MapaSchema)
def criar_mapa(
    dados: MapaCreate,
    usuario_atual: Usuario = Depends(get_usuario_atual),
    servico: MapaServico = Depends(get_servico),
):
    return servico.criar(usuario_atual.id, dados)


@router.get("/", response_model=list[MapaSchema])
def listar_mapas(
    usuario_atual: Usuario = Depends(get_usuario_atual),
    servico: MapaServico = Depends(get_servico),
):
    return servico.listar(usuario_atual.id)


@router.get("/principal", response_model=MapaSchema)
def mapa_principal(
    usuario_atual: Usuario = Depends(get_usuario_atual),
    servico: MapaServico = Depends(get_servico),
):
    return servico.obter_ou_criar_principal(usuario_atual.id)


@router.get("/{mapa_id}", response_model=MapaSchema)
def buscar_mapa(
    mapa_id: int,
    usuario_atual: Usuario = Depends(get_usuario_atual),
    servico: MapaServico = Depends(get_servico),
):
    mapa = servico.buscar(mapa_id)

    if mapa.id_usuario != usuario_atual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este mapa.",
        )

    return mapa