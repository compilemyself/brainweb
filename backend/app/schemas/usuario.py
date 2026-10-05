from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str

class UsuarioLogin(BaseModel):
    identificador: str
    senha: str

class ConfiguracaoSchema(BaseModel):
    id_usuario: int
    cor_mapa: str = "BRAINWEB"
    custom_1_primaria: str = Field(default="#48abb3", pattern=r"^#[0-9a-fA-F]{6}$")
    custom_1_secundaria: str = Field(default="#0f2f33", pattern=r"^#[0-9a-fA-F]{6}$")
    custom_2_primaria: str = Field(default="#48abb3", pattern=r"^#[0-9a-fA-F]{6}$")
    custom_2_secundaria: str = Field(default="#0f2f33", pattern=r"^#[0-9a-fA-F]{6}$")
    nota_flutuante_ativa: bool = True
    relogio_ativo: bool = True
    historico_clipboard_ativo: bool = True
    imagem_deformavel: bool = False
    criado_em: Optional[datetime] = None
    atualizado_em: Optional[datetime] = None
    model_config = {"from_attributes": True}

class UsuarioSchema(BaseModel):
    id: int
    nome: str
    email: str
    configuracao: Optional[ConfiguracaoSchema] = None
    criado_em: datetime
    model_config = {"from_attributes": True}

class UsuarioPreferenciasSchema(BaseModel):
    cor_mapa: Optional[str] = None
    custom_1_primaria: Optional[str] = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    custom_1_secundaria: Optional[str] = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    custom_2_primaria: Optional[str] = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    custom_2_secundaria: Optional[str] = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    nota_flutuante_ativa: Optional[bool] = None
    relogio_ativo: Optional[bool] = None
    historico_clipboard_ativo: Optional[bool] = None
    imagem_deformavel: Optional[bool] = None

class TokenSchema(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioSchema