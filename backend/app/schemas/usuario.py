from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str

class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str

class UsuarioSchema(BaseModel):
    id: int
    nome: str
    email: str
    cor_mapa: str = "#48abb3"
    criado_em: datetime
    model_config = {"from_attributes": True}

class UsuarioPreferenciasSchema(BaseModel):
    cor_mapa: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")

class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioSchema