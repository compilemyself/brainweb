from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_usuario_atual
from app.models.usuario import Usuario
from app.repositories.flow_repo import FlowRepo
from app.repositories.mapa_repo import MapaRepo
from app.schemas.flow import FlowSchema
from app.services.flow_servico import FlowServico

router = APIRouter(prefix="/mapas", tags=["Flow"])

def get_servico(db: Session = Depends(get_db)): return FlowServico(FlowRepo(db))

def owner(mapa_id, usuario, db):
    mapa = MapaRepo(db).buscar_por_id(mapa_id)
    if not mapa: raise HTTPException(status_code=404, detail="Mapa não encontrado")
    if mapa.id_usuario != usuario.id: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não tem permissão para acessar este mapa.")
    return mapa

@router.get("/principal/flow", response_model=FlowSchema)
def flow_principal(usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db), servico: FlowServico = Depends(get_servico)):
    from app.repositories.mapa_repo import MapaRepo
    mapa = MapaRepo(db).procurar_por_usuario(usuario.id)
    if not mapa: raise HTTPException(status_code=404, detail="Mapa não encontrado")
    return servico.carregar_flow(mapa.id)

@router.put("/{mapa_id}/flow")
def salvar_flow(mapa_id: int, dados: FlowSchema, usuario: Usuario = Depends(get_usuario_atual), db: Session = Depends(get_db), servico: FlowServico = Depends(get_servico)):
    owner(mapa_id, usuario, db); return servico.salvar_flow(mapa_id, dados)
