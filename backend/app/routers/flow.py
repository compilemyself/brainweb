from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_usuario_atual
from app.models.usuario import Usuario
from app.repositories.flow_repo import FlowRepo
from app.repositories.mapa_repo import MapaRepo
from app.schemas.flow import FlowSchema
from app.services.flow_servico import FlowServico
from app.services.mapa_servico import MapaServico

router = APIRouter(prefix="/mapas", tags=["Flow"])


def get_mapa_servico(db: Session = Depends(get_db)) -> MapaServico:
    return MapaServico(MapaRepo(db))


def get_flow_servico(db: Session = Depends(get_db)) -> FlowServico:
    return FlowServico(FlowRepo(db))


def validar_dono_do_mapa(
    mapa_id: int,
    usuario_atual: Usuario,
    mapa_servico: MapaServico,
):
    mapa = mapa_servico.buscar(mapa_id)

    if mapa.id_usuario != usuario_atual.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Você não tem permissão para acessar este mapa.",
        )

    return mapa


@router.get("/principal/flow", response_model=FlowSchema)
def carregar_flow_principal(
    usuario_atual: Usuario = Depends(get_usuario_atual),
    mapa_servico: MapaServico = Depends(get_mapa_servico),
    flow_servico: FlowServico = Depends(get_flow_servico),
):
    mapa = mapa_servico.obter_ou_criar_principal(usuario_atual.id)
    return flow_servico.carregar_flow(mapa.id)


@router.put("/{mapa_id}/flow")
def salvar_flow(
    mapa_id: int,
    dados: FlowSchema,
    usuario_atual: Usuario = Depends(get_usuario_atual),
    mapa_servico: MapaServico = Depends(get_mapa_servico),
    flow_servico: FlowServico = Depends(get_flow_servico),
):
    validar_dono_do_mapa(mapa_id, usuario_atual, mapa_servico)
    return flow_servico.salvar_flow(mapa_id, dados)