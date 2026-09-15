from sqlalchemy.orm import Session
from app.models.flow_node import FlowNode
from app.models.flow_edge import FlowEdge
from app.models.mapa_mental import MapaMental

class FlowRepo:
    def __init__(self, db: Session): self._db = db
    def buscar_nodes(self, mapa_id): return self._db.query(FlowNode).filter(FlowNode.id_mapa_mental == mapa_id).all()
    def buscar_edges(self, mapa_id): return self._db.query(FlowEdge).filter(FlowEdge.id_mapa_mental == mapa_id).all()
    def bloquear_mapa_para_escrita(self, mapa_id): return self._db.query(MapaMental).filter(MapaMental.id == mapa_id).with_for_update().one()
    def criar_node(self, node): self._db.add(node); self._db.flush(); return node
    def criar_edge(self, edge): self._db.add(edge); return edge
    def apagar_nodes(self, mapa_id): self._db.query(FlowNode).filter(FlowNode.id_mapa_mental == mapa_id).delete(synchronize_session=False)
    def apagar_edges(self, mapa_id): self._db.query(FlowEdge).filter(FlowEdge.id_mapa_mental == mapa_id).delete(synchronize_session=False)
    def commit(self): self._db.commit()
    def rollback(self): self._db.rollback()