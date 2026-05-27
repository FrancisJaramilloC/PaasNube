# Smart Closet Manager

Smart Closet Manager es una aplicacion web modular y minimalista desarrollada en Python para la gestion del inventario de prendas de vestir y el control de su estado de higiene (limpio o sucio). Esta diseñada bajo el principio de codigo limpio y portabilidad, facilitando su despliegue inmediato en cualquier plataforma de plataforma como servicio (PaaS).

## Tecnologias

El proyecto utiliza las siguientes tecnologias en su desarrollo:

* **Backend**: Python 3.12+ utilizando el framework FastAPI para la construccion de la API REST y el enrutamiento de vistas.
* **Servidor**: Uvicorn como servidor de interfaz de puerta de enlace asincrona (ASGI).
* **Motor de Plantillas**: Jinja2 para renderizar de forma segura el frontend HTML.
* **Persistencia de Datos**: SQLite como base de datos ligera autocontenida y SQLAlchemy como mapeador objeto-relacional (ORM) para la gestion de consultas de forma modular.
* **Frontend**: HTML5 semantico, Vanilla CSS para la definicion de estilos minimalistas sin frameworks de terceros, y Vanilla JavaScript (ES6) asincrono para la interaccion con la API y procesamiento local de imagenes en formato Base64.

## Estructura del Proyecto

El codigo se organiza de manera modular bajo la siguiente estructura de archivos:

```text
PaasNube/
├── app/
│   ├── database.py      # Configuracion de la conexion a SQLite y sesion de SQLAlchemy
│   ├── models.py        # Definicion del modelo de datos de la prenda (ClothingItem)
│   ├── schemas.py       # Esquemas de validacion de datos de entrada/salida (Pydantic)
│   ├── crud.py          # Logica pura de operaciones sobre la base de datos (CRUD)
│   ├── main.py          # Enrutamiento de la aplicacion, endpoints API y montaje de estaticos
│   ├── static/          # Activos estaticos del cliente
│   │   ├── css/
│   │   │   └── style.css # Estilos minimalistas, responsivos y planos en Vanilla CSS
│   │   └── js/
│   │       └── app.js   # Logica de consumo de API y manejo de modales
│   └── templates/       # Vistas HTML5 de la aplicacion
│       └── index.html   # Interfaz principal
├── requirements.txt     # Listado de dependencias del proyecto
├── seed.py              # Script opcional para inicializar la base de datos con datos de prueba
└── README.md            # Documentacion general del sistema
```

## Documentacion de la API

La aplicacion expone una API REST para gestionar el ciclo de vida de las prendas:

* **GET /api/items**: Obtiene la lista completa de prendas de vestir. Soporta los filtros opcionales por query parameters `category` y `status`.
* **GET /api/items/{item_id}**: Obtiene los detalles de una prenda especifica mediante su ID.
* **POST /api/items**: Registra una nueva prenda en el closet. Recibe un JSON que incluye opcionalmente una imagen codificada en string Base64.
* **PUT /api/items/{item_id}**: Modifica completamente los datos de una prenda registrada.
* **PATCH /api/items/{item_id}/status**: Modifica exclusivamente el estado de higiene (Limpio o Sucio) de una prenda.
* **DELETE /api/items/{item_id}**: Elimina una prenda del closet de manera permanente.
* **GET /api/stats**: Devuelve las estadisticas de prendas registradas: total de prendas, total de limpias y total de sucias.

## Pasos para la Ejecucion

Siga las siguientes instrucciones para ejecutar el proyecto en un entorno local:

### 1. Preparacion del Entorno Virtual

Cree un entorno virtual de Python en la raiz del proyecto para aislar las dependencias:

```bash
python -m venv venv
```

Active el entorno virtual en su terminal:

* **En Linux/macOS**:
  ```bash
  source venv/bin/activate
  ```
* **En Windows (Command Prompt)**:
  ```cmd
  venv\Scripts\activate.bat
  ```
* **En Windows (PowerShell)**:
  ```powershell
  venv\Scripts\Activate.ps1
  ```

### 2. Instalacion de Dependencias

Instale las librerias requeridas especificadas en el archivo requirements.txt:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Inicializacion de Datos de Prueba (Opcional)

Si desea iniciar la aplicacion con 5 prendas ya cargadas en el sistema (evitando que el closet aparezca completamente vacio la primera vez), ejecute el script de sembrado de datos:

```bash
python seed.py
```

Este paso creara de forma automatica la base de datos local `closet.db` y cargara la informacion de prueba.

### 4. Ejecucion del Servidor de Desarrollo

Inicie el servidor local utilizando Uvicorn:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 5. Acceso a la Aplicacion

Una vez iniciado el servidor, abra su navegador web e ingrese a las siguientes direcciones:

* **Interfaz de Usuario**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Documentacion Interactiva de la API (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
