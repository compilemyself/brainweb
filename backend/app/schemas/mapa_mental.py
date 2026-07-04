from pydantic import BaseModel
from typing import List, Dict, Any
from datetime import datetime


class MapaCreate(BaseModel):
    titulo: str

class MapaSchema(BaseModel):
    id: int
    id_usuario: int
    titulo: str
    criado_em: datetime

    model_config = {"from_attributes": True}