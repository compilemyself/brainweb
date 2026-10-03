from sqlalchemy import Column, BigInteger, DateTime, ForeignKey, Text, String
from sqlalchemy.sql import func
from app.database import Base

class FlowEdge(Base):
    __tablename__ = "flow_edges"
    id = Column(BigInteger, primary_key=True, index=True)
    id_mapa_mental = Column(BigInteger, ForeignKey("mapas_mentais.id", ondelete="CASCADE"), nullable=False, index=True)
    id_node_origem = Column(BigInteger, ForeignKey("flow_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    id_node_destino = Column(BigInteger, ForeignKey("flow_nodes.id", ondelete="CASCADE"), nullable=False, index=True)
    source_handle = Column(String(32), nullable=False, default="right-source", server_default="right-source")
    target_handle = Column(String(32), nullable=False, default="left-target", server_default="left-target")
    label = Column(Text, nullable=False, default="", server_default="")
    criado_em = Column(DateTime(timezone=True), server_default=func.now())