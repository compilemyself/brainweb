from typing import Optional
from sqlalchemy.orm import Session
from app.models.usuario import Usuario

class UsuarioRepo:
    def __init__(self, db: Session):
        self._db = db

    def procurar_por_email(self, email: str) -> Optional[Usuario]:
        return self._db.query(Usuario).filter(Usuario.email == email).first()

    def procurar_por_id(self, id: int) -> Optional[Usuario]:
        return self._db.query(Usuario).filter(Usuario.id == id).first()

    def criar(self, usuario: Usuario) -> Usuario:
        self._db.add(usuario)
        self._db.commit()
        self._db.refresh(usuario)
        return usuario