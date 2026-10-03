from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Configuracao(Base):
    __tablename__ = "configuracoes"
    id = Column(BigInteger, primary_key=True, index=True)
    id_usuario = Column(BigInteger, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    cor_mapa = Column(String(32), nullable=False, default="BRAINWEB", server_default="BRAINWEB")
    custom_1_primaria = Column(String(7), nullable=False, default="#48abb3", server_default="#48abb3")
    custom_1_secundaria = Column(String(7), nullable=False, default="#0f2f33", server_default="#0f2f33")
    custom_2_primaria = Column(String(7), nullable=False, default="#48abb3", server_default="#48abb3")
    custom_2_secundaria = Column(String(7), nullable=False, default="#0f2f33", server_default="#0f2f33")
    nota_flutuante_ativa = Column(Boolean, nullable=False, default=True, server_default="true")
    relogio_ativo = Column(Boolean, nullable=False, default=True, server_default="true")
    historico_clipboard_ativo = Column(Boolean, nullable=False, default=True, server_default="true")
    imagem_deformavel = Column(Boolean, nullable=False, default=False, server_default="false")
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    usuario = relationship("Usuario", back_populates="configuracao")