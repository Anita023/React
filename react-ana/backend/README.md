# Backend - React + Vite + FastAPI (Cuarto Avance)

Backend desarrollado en **FastAPI** conectado a **MySQL**, con autenticación
mediante **JWT**, hashing de contraseñas con **bcrypt**, control de roles
(administrador, empleado, cliente) y operaciones **CRUD** completas para
usuarios, productos y servicios.

## 1. Estructura del proyecto

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py            # Punto de entrada, CORS, registro de routers
│   ├── database.py        # Conexión SQLAlchemy con MySQL
│   ├── models.py          # Tablas: roles, permisos, usuarios, productos, servicios
│   ├── schemas.py         # Validaciones Pydantic (entrada/salida de la API)
│   ├── auth.py            # Hashing de contraseñas + generación/verificación JWT
│   ├── dependencies.py    # Dependencias: get_current_user, require_roles(...)
│   └── routes/
│       ├── __init__.py
│       ├── auth.py        # POST /api/auth/login
│       ├── usuarios.py    # Registro + CRUD de usuarios + /me/perfil
│       ├── productos.py   # CRUD de productos
│       └── servicios.py   # CRUD de servicios
├── basedatos/
│   └── bd.sql              # Script de creación de la BD (tablas + roles base)
├── crear_admin.py          # Script para crear el primer usuario administrador
├── requirements.txt
├── .env.example             # Plantilla de variables de entorno
└── .gitignore
```

## 2. Instalación paso a paso

### 2.1. Crear y activar el entorno virtual

```bash
cd backend
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

Linux/Mac:
```bash
source venv/bin/activate
```

### 2.2. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 2.3. Configurar variables de entorno

Copia `.env.example` a `.env` y ajusta los valores (usuario/clave de MySQL,
SECRET_KEY, URL del frontend):

```bash
cp .env.example .env      # Linux/Mac
copy .env.example .env    # Windows
```

### 2.4. Crear la base de datos

Ejecuta el script `basedatos/bd.sql` en MySQL Workbench, phpMyAdmin, o por
consola:

```bash
mysql -u root -p < basedatos/bd.sql
```

Esto crea la base `bd_jhm_tech_solutions_fastapi`, las tablas y los tres
roles obligatorios: **administrador**, **empleado**, **cliente**.
El endpoint de registro (`/api/usuarios/registro`) depende de que exista el
rol `cliente`, así que este paso es obligatorio antes de probar la API.

### 2.5. Crear el primer usuario administrador

Como el registro público solo crea clientes, usa el script incluido para
crear el administrador inicial:

```bash
python crear_admin.py
```

Por defecto crea: `admin@jhmtech.com` / `Admin_2026*` (puedes cambiar estos
valores editando el script antes de ejecutarlo).

### 2.6. Ejecutar el servidor

```bash
uvicorn app.main:app --reload
```

- API: http://127.0.0.1:8000
- Documentación Swagger: http://127.0.0.1:8000/docs

## 3. Endpoints principales

| Método | Ruta                          | Acceso                          |
|--------|-------------------------------|----------------------------------|
| POST   | /api/usuarios/registro        | Público (crea un cliente)        |
| POST   | /api/auth/login               | Público                          |
| GET    | /api/usuarios/me/perfil        | Usuario autenticado (cualquiera) |
| GET    | /api/usuarios                 | Administrador, empleado          |
| GET    | /api/usuarios/{id}             | Dueño del perfil, admin, empleado|
| PUT    | /api/usuarios/{id}             | Dueño del perfil o admin         |
| PATCH  | /api/usuarios/{id}/estado       | Administrador                    |
| DELETE | /api/usuarios/{id}             | Administrador                    |
| GET    | /api/productos                | Público                          |
| POST   | /api/productos                | Administrador, empleado          |
| PUT    | /api/productos/{id}            | Administrador, empleado          |
| DELETE | /api/productos/{id}            | Administrador                    |
| GET    | /api/servicios                | Público                          |
| POST   | /api/servicios                | Administrador, empleado          |
| PUT    | /api/servicios/{id}            | Administrador, empleado          |
| DELETE | /api/servicios/{id}            | Administrador                    |

## 4. Cómo consumirlo desde React

```js
// Login
const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});
const data = await res.json();
// data.access_token, data.usuario, data.rol
localStorage.setItem("token", data.access_token);

// Petición autenticada
const res2 = await fetch("http://127.0.0.1:8000/api/usuarios/me/perfil", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});
```

## 5. Pruebas con Postman / Swagger

1. Registra un cliente en `POST /api/usuarios/registro`.
2. Inicia sesión en `POST /api/auth/login` y copia el `access_token`.
3. En Postman, ve a la pestaña **Authorization** → tipo **Bearer Token** →
   pega el token, para probar los endpoints protegidos.
4. En Swagger (`/docs`) puedes usar el botón **Authorize** (candado) e
   introducir `Bearer TU_TOKEN`.

## 6. Notas de seguridad

- Las contraseñas nunca se almacenan en texto plano: se guardan como hash
  bcrypt (`$2b$12$...`).
- El archivo `.env` real **no debe subirse** a ningún repositorio público
  (ya está en `.gitignore`).
- La autorización definitiva de roles siempre se valida en el backend,
  aunque el frontend también oculte opciones según el rol.
