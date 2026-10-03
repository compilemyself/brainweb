from typing import Optional
from sqlalchemy.orm import Session
from app.models.configuracao import Configuracao

class ConfiguracaoRepo:
    def __init__(self, db: Session): self._db = db
    def buscar_por_usuario(self, id_usuario: int) -> Optional[Configuracao]:
        return self._db.query(Configuracao).filter(Configuracao.id_usuario == id_usuario).first()
    def criar(self, configuracao: Configuracao) -> Configuracao:
        self._db.add(configuracao); self._db.commit(); self._db.refresh(configuracao); return configuracao
    def atualizar(self, configuracao: Configuracao) -> Configuracao:
        self._db.add(configuracao); self._db.commit(); self._db.refresh(configuracao); return configuracao