from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import decodificar_token
from app.database import get_db
from app.models.usuario import Usuario
from app.repositories.usuario_repo import UsuarioRepo

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido ou expirado.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decodificar_token(token)

    if not payload:
        raise credenciais_invalidas

    usuario_id = payload.get("sub")

    if not usuario_id:
        raise credenciais_invalidas

    try:
        usuario_id = int(usuario_id)
    except ValueError:
        raise credenciais_invalidas

    usuario = UsuarioRepo(db).procurar_por_id(usuario_id)

    if not usuario:
        raise credenciais_invalidas

    return usuario