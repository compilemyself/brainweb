from sqlalchemy import (
    Column,
    BigInteger,
    DateTime,
    ForeignKey,
)
from sqlalchemy.sql import func

from app.database import Base


class FlowEdge(Base):
    __tablename__ = "flow_edges"

    id = Column(BigInteger, primary_key=True, index=True)

    id_mapa_mental = Column(
        BigInteger,
        ForeignKey("mapas_mentais.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    id_node_origem = Column(
        BigInteger,
        ForeignKey("flow_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    id_node_destino = Column(
        BigInteger,
        ForeignKey("flow_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    criado_em = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )