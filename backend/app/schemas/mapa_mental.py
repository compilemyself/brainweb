from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MapaCreate(BaseModel):
    titulo: str

class MapaSchema(BaseModel):
    id: int
    id_usuario: int
    titulo: str
    nota_flutuante: str = ""
    nota_flutuante_ativa: bool = True
    relogio_ativo: bool = True
    criado_em: datetime
    model_config = {"from_attributes": True}

class MapaConfiguracaoSchema(BaseModel):
    nota_flutuante: Optional[str] = None
    nota_flutuante_ativa: Optional[bool] = None
    relogio_ativo: Optional[bool] = None