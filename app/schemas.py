from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class ClothingItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Nombre de la prenda")
    category: str = Field(..., min_length=1, max_length=50, description="Categoría de la prenda")
    status: str = Field("Limpio", pattern="^(Limpio|Sucio)$", description="Estado de la prenda")
    color: Optional[str] = Field(None, max_length=7, description="Color en hexadecimal")
    image_base64: Optional[str] = Field(None, description="Imagen codificada en Base64")

class ClothingItemCreate(ClothingItemBase):
    pass

class ClothingItemUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    status: Optional[str] = Field(None, pattern="^(Limpio|Sucio)$")
    color: Optional[str] = Field(None, max_length=7)
    image_base64: Optional[str] = None

class ClothingItemStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(Limpio|Sucio)$")

class ClothingItemResponse(ClothingItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
