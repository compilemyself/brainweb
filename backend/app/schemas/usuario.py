from pydantic import BaseModel, EmailStr
from datetime import datetime

class UsuarioCreate(BaseModel):
    """Dados recebidos no cadastro — espelha o RegisterForm do front-end."""
    nome: str
    email: EmailStr
    senha: str

class UsuarioLogin(BaseModel):
    """Dados recebidos no login — espelha o LoginForm do front-end."""
    email: EmailStr
    senha: str

class UsuarioSchema(BaseModel):
    """Dados retornados após cadastro — nunca expõe senha_hash."""
    id: int
    nome: str
    email: str
    criado_em: datetime

    model_config = {"from_attributes": True}

class TokenSchema(BaseModel):
    """Token JWT retornado após login bem-sucedido."""
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioSchema