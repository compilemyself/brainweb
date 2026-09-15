from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies.auth import get_usuario_atual
from app.models.usuario import Usuario
from app.repositories.mapa_repo import MapaRepo
from app.schemas.mapa_mental import MapaCreate, MapaSchema, MapaConfiguracaoSchema
from app.services.mapa_servico import MapaServico

router = APIRouter(prefix="/mapas", tags=["Mapas Mentais"])

def get_servico(db: Session = Depends(get_db)) -> MapaServico: return MapaServico(MapaRepo(db))

def require_owner(mapa, usuario):
    if mapa.id_usuario != usuario.id: raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Você não tem permissão para acessar este mapa.")

@router.post("/", response_model=MapaSchema)
def criar_mapa(dados: MapaCreate, usuario: Usuario = Depends(get_usuario_atual), servico: MapaServico = Depends(get_servico)): return servico.criar(usuario.id, dados)

@router.get("/", response_model=list[MapaSchema])
def listar_mapas(usuario: Usuario = Depends(get_usuario_atual), servico: MapaServico = Depends(get_servico)): return servico.listar(usuario.id)

@router.get("/principal", response_model=MapaSchema)
def mapa_principal(usuario: Usuario = Depends(get_usuario_atual), servico: MapaServico = Depends(get_servico)): return servico.obter_ou_criar_principal(usuario.id)

@router.get("/{mapa_id}", response_model=MapaSchema)
def buscar_mapa(mapa_id: int, usuario: Usuario = Depends(get_usuario_atual), servico: MapaServico = Depends(get_servico)):
    mapa = servico.buscar(mapa_id); require_owner(mapa, usuario); return mapa

@router.put("/{mapa_id}/configuracao", response_model=MapaSchema)
def configurar_mapa(mapa_id: int, dados: MapaConfiguracaoSchema, usuario: Usuario = Depends(get_usuario_atual), servico: MapaServico = Depends(get_servico)):
    mapa = servico.buscar(mapa_id); require_owner(mapa, usuario); return servico.atualizar_configuracao(mapa, dados)