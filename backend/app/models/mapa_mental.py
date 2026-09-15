from sqlalchemy import Column, BigInteger, String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.sql import func
from app.database import Base

class MapaMental(Base):
    __tablename__ = "mapas_mentais"
    id = Column(BigInteger, primary_key=True, index=True)
    id_usuario = Column(BigInteger, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, index=True)
    titulo = Column(String(255), nullable=False)
    nota_flutuante = Column(Text, nullable=False, default="", server_default="")
    nota_flutuante_ativa = Column(Boolean, nullable=False, default=True, server_default="true")
    relogio_ativo = Column(Boolean, nullable=False, default=True, server_default="true")
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
