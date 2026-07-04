from sqlalchemy.orm import Session

from app.models.flow_node import FlowNode
from app.models.flow_edge import FlowEdge


class FlowRepo:

    def __init__(self, db: Session):
        self._db = db

    # ---------- CONSULTAS ----------

    def buscar_nodes(self, mapa_id: int):
        return (
            self._db.query(FlowNode)
            .filter(FlowNode.id_mapa_mental == mapa_id)
            .all()
        )

    def buscar_edges(self, mapa_id: int):
        return (
            self._db.query(FlowEdge)
            .filter(FlowEdge.id_mapa_mental == mapa_id)
            .all()
        )

    # ---------- INSERÇÃO ----------

    def criar_node(self, node: FlowNode):
        self._db.add(node)
        self._db.commit()
        self._db.refresh(node)
        return node

    def criar_edge(self, edge: FlowEdge):
        self._db.add(edge)
        self._db.commit()
        self._db.refresh(edge)
        return edge

    # ---------- REMOÇÃO ----------

    def apagar_nodes(self, mapa_id: int):
        (
            self._db.query(FlowNode)
            .filter(FlowNode.id_mapa_mental == mapa_id)
            .delete()
        )
        self._db.commit()

    def apagar_edges(self, mapa_id: int):
        (
            self._db.query(FlowEdge)
            .filter(FlowEdge.id_mapa_mental == mapa_id)
            .delete()
        )
        self._db.commit()

    # ---------- COMMIT ----------

    def commit(self):
        self._db.commit()