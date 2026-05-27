import os
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import engine, get_db, Base
from app import models, schemas, crud
from azure.cosmos.aio import CosmosClient
import os

# Tu App Service leerá la variable automáticamente en la nube
ENDPOINT_OR_STRING = os.getenv("COSMOS_CONNECTION_STRING")

# Inicializa el cliente de Azure Cosmos DB
client = CosmosClient.from_connection_string(ENDPOINT_OR_STRING)

# Selecciona tu base de datos y contenedor de backup
database = client.get_database_client("backup_smartcloset")
container = database.get_container_client("items_closet")

# Crear tablas de base de datos automáticamente al iniciar
# Esto facilita el despliegue directo en PaaS sin requerir pasos de migración manual
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Closet Manager",
    description="Aplicación modular para gestionar prendas de vestir e higiene",
    version="1.0.0"
)

# Definir directorios base de forma segura
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(BASE_DIR, "static")
templates_dir = os.path.join(BASE_DIR, "templates")

# Asegurar que existan los directorios
os.makedirs(static_dir, exist_ok=True)
os.makedirs(os.path.join(static_dir, "css"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "js"), exist_ok=True)
os.makedirs(templates_dir, exist_ok=True)

# Montar archivos estáticos
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Configurar plantillas Jinja2
templates = Jinja2Templates(directory=templates_dir)

# ================= RUTA WEB PRINCIPAL =================

@app.get("/", response_class=HTMLResponse)
def read_root(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

# ================= RUTAS DE LA API (CRUD) =================

@app.get("/api/items", response_model=List[schemas.ClothingItemResponse])
def read_items(
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Obtiene la lista de prendas de vestir, con filtros opcionales de categoría y estado."""
    return crud.get_items(db, category=category, status=status)

@app.get("/api/items/{item_id}", response_model=schemas.ClothingItemResponse)
def read_item(item_id: int, db: Session = Depends(get_db)):
    """Obtiene una prenda de vestir específica por su ID."""
    db_item = crud.get_item(db, item_id=item_id)
    if db_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Prenda no encontrada"
        )
    return db_item

@app.post("/api/items", response_model=schemas.ClothingItemResponse, status_code=status.HTTP_201_CREATED)
def create_item(item: schemas.ClothingItemCreate, db: Session = Depends(get_db)):
    """Crea una nueva prenda de vestir."""
    return crud.create_item(db=db, item=item)

@app.put("/api/items/{item_id}", response_model=schemas.ClothingItemResponse)
def update_item(
    item_id: int, 
    item: schemas.ClothingItemUpdate, 
    db: Session = Depends(get_db)
):
    """Actualiza los datos de una prenda de vestir."""
    db_item = crud.update_item(db=db, item_id=item_id, item=item)
    if db_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Prenda no encontrada para actualizar"
        )
    return db_item

@app.patch("/api/items/{item_id}/status", response_model=schemas.ClothingItemResponse)
def update_item_status(
    item_id: int,
    status_update: schemas.ClothingItemStatusUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza exclusivamente el estado (Limpio/Sucio) de una prenda."""
    db_item = crud.update_item_status(db=db, item_id=item_id, status=status_update.status)
    if db_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Prenda no encontrada"
        )
    return db_item

@app.delete("/api/items/{item_id}", status_code=status.HTTP_200_OK)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    """Elimina una prenda de vestir."""
    success = crud.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_444_NOT_FOUND if hasattr(status, "HTTP_444_NOT_FOUND") else 404, 
            detail="Prenda no encontrada para eliminar"
        )
    return {"message": "Prenda eliminada exitosamente", "id": item_id}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """Obtiene estadísticas generales del clóset (total, prendas limpias y prendas sucias)."""
    items = crud.get_items(db)
    total = len(items)
    limpias = sum(1 for item in items if item.status == "Limpio")
    sucias = total - limpias
    return {
        "total": total,
        "limpias": limpias,
        "sucias": sucias
    }
