import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Configuración del archivo de base de datos local
# Por defecto se creará un archivo closet.db en el directorio raíz del proyecto
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./closet.db")

# Si se usa SQLite, agregamos connect_args para permitir múltiples hilos concurrentes
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependencia para obtener la sesión de BD de forma segura en las rutas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
