import os
import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from ..dependencies import require_roles
from ..models import Usuario

router = APIRouter(prefix="/api/uploads", tags=["Uploads"])

# Carpeta donde se guardan los archivos físicamente (relativa a donde corres uvicorn)
CARPETA_UPLOADS = "uploads/productos"
EXTENSIONES_PERMITIDAS = {".jpg", ".jpeg", ".png", ".webp"}
TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024  # 2 MB, igual al límite que ya validas en el frontend

os.makedirs(CARPETA_UPLOADS, exist_ok=True)


@router.post("/imagen")
def subir_imagen(
    archivo: UploadFile = File(...),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    extension = os.path.splitext(archivo.filename or "")[1].lower()
    if extension not in EXTENSIONES_PERMITIDAS:
        raise HTTPException(
            status_code=400,
            detail="Formato de imagen no permitido. Usa jpg, jpeg, png o webp.",
        )

    contenido = archivo.file.read()
    if len(contenido) > TAMANO_MAXIMO_BYTES:
        raise HTTPException(status_code=400, detail="La imagen debe pesar menos de 2 MB")

    nombre_archivo = f"{uuid.uuid4().hex}{extension}"
    ruta_destino = os.path.join(CARPETA_UPLOADS, nombre_archivo)

    with open(ruta_destino, "wb") as f:
        f.write(contenido)

    # Ruta pública que se guardará en productos.imagen_url
    url = f"/uploads/productos/{nombre_archivo}"
    return {"url": url}