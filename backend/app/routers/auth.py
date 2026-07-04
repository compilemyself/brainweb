from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioLogin, UsuarioSchema, TokenSchema
from app.repositories.usuario_repo import UsuarioRepo
from app.services.autenticacao_servico import AutenticacaoServico

router = APIRouter(prefix="/auth", tags=["Autenticação"])

def get_servico(db: Session = Depends(get_db)) -> AutenticacaoServico:
    """Monta a cadeia: sessão → repositório → serviço."""
    return AutenticacaoServico(UsuarioRepo(db))

@router.post("/registrar", response_model=UsuarioSchema, status_code=201)
def registrar(dados: UsuarioCreate, servico: AutenticacaoServico = Depends(get_servico)):
    return servico.registrar(dados)

@router.post("/login", response_model=TokenSchema)
def login(dados: UsuarioLogin, servico: AutenticacaoServico = Depends(get_servico)):
    return servico.login(dados.email, dados.senha)