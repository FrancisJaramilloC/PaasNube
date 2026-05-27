import os
import sys

# Asegurar que el directorio actual esté en el PATH para importar app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import ClothingItem

# Imagen transparente de 1x1 píxeles en formato PNG codificada en Base64 para simular una foto subida
TINY_IMAGE_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

def seed_database():
    # Inicializar tablas si no existen
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Verificar si ya existen registros
        if db.query(ClothingItem).count() > 0:
            print("La base de datos ya cuenta con prendas de vestir de muestra.")
            return
            
        print("Poblando la base de datos con prendas iniciales...")
        
        sample_items = [
            ClothingItem(
                name="Camiseta Deportiva Azul",
                category="Torso",
                status="Limpio",
                color="#2563eb",
                image_base64=None
            ),
            ClothingItem(
                name="Jeans Clásicos Azules",
                category="Piernas",
                status="Sucio",
                color="#1d4ed8",
                image_base64=None
            ),
            ClothingItem(
                name="Chaqueta Abrigada Negra",
                category="Torso",
                status="Limpio",
                color="#0f172a",
                image_base64=None
            ),
            ClothingItem(
                name="Tenis de Running Blancos",
                category="Zapatos",
                status="Limpio",
                color="#ffffff",
                image_base64=None
            ),
            ClothingItem(
                name="Gorra de Béisbol Roja",
                category="Accesorios",
                status="Sucio",
                color="#dc2626",
                image_base64=None
            )
        ]
        
        db.add_all(sample_items)
        db.commit()
        print("¡Base de datos poblada con éxito con 5 prendas iniciales!")
        
    except Exception as e:
        print(f"Error al poblar la base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
