from sqlalchemy import (
    Column,
    BigInteger,
    Integer,
    DateTime,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import JSONB, ENUM
from sqlalchemy.sql import func

from app.database import Base


NodeType = ENUM(
    "TEXT",
    "IMAGE",
    "CHECKLIST",
    name="node_type",
    create_type=False
)


class FlowNode(Base):
    __tablename__ = "flow_nodes"

    id = Column(BigInteger, primary_key=True, index=True)

    id_mapa_mental = Column(
        BigInteger,
        ForeignKey("mapas_mentais.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    tipo = Column(NodeType, nullable=False)

    conteudo = Column(JSONB, nullable=False)

    pos_x = Column(Integer, nullable=False)

    pos_y = Column(Integer, nullable=False)

    criado_em = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    atualizado_em = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )