from sqlalchemy import Column, BigInteger, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id            = Column(BigInteger, primary_key=True, index=True)
    nome          = Column(String(100), nullable=False)
    email         = Column(String(255), nullable=False, unique=True)
    senha_hash    = Column(String(255), nullable=False)
    criado_em     = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True),
                           server_default=func.now(),
                           onupdate=func.now())