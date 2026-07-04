from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.mapa_mental import MapaMental


class MapaRepo:
    def __init__(self, db: Session):
        self._db = db

    def criar(self, mapa: MapaMental) -> MapaMental:
        self._db.add(mapa)
        self._db.commit()
        self._db.refresh(mapa)
        return mapa

    def listar_por_usuario(self, id_usuario: int) -> List[MapaMental]:
        return (
            self._db.query(MapaMental)
            .filter(MapaMental.id_usuario == id_usuario)
            .all()
        )

    def buscar_por_id(self, mapa_id: int) -> Optional[MapaMental]:
        return (
            self._db.query(MapaMental)
            .filter(MapaMental.id == mapa_id)
            .first()
        )
    
    def procurar_por_usuario(self, id_usuario: int) -> Optional[MapaMental]:
        return (
            self._db.query(MapaMental)
            .filter(MapaMental.id_usuario == id_usuario)
            .first()
        )
    
    def atualizar(self, mapa: MapaMental):
        self._db.add(mapa)
        self._db.commit()
        self._db.refresh(mapa)
        return mapa