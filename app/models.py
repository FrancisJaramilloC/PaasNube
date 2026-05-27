from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # ej. "Tops", "Bottoms", "Calzado", "Accesorios"
    status = Column(String(20), default="Limpio", nullable=False)  # "Limpio" o "Sucio"
    color = Column(String(7), nullable=True)  # Código Hexadecimal de color (ej. "#ffffff")
    image_base64 = Column(Text, nullable=True)  # Imagen en Base64 para persistencia robusta en PaaS
    created_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc), 
        nullable=False
    )
