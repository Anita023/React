from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import require_roles
from ..models import Producto, Usuario
from ..schemas import ProductoCreate, ProductoUpdate, producto_a_out

router = APIRouter(prefix="/api/productos", tags=["Productos"])


@router.get("")
def listar_productos(db: Session = Depends(get_db)):
    """Público: catálogo de productos disponibles."""
    productos = db.query(Producto).filter(Producto.disponible == True).all()  # noqa: E712
    return {"productos": [producto_a_out(p) for p in productos]}


@router.get("/admin/todos")
def listar_todos_los_productos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Panel admin: incluye productos no disponibles."""
    productos = db.query(Producto).all()
    return {"productos": [producto_a_out(p) for p in productos]}


@router.get("/{id_producto}")
def obtener_producto(id_producto: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto_a_out(producto)


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_producto(
    datos: ProductoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    if db.query(Producto).filter(Producto.slug == datos.slug).first():
        raise HTTPException(status_code=400, detail="Ya existe un producto con ese slug")

    nuevo_producto = Producto(**datos.model_dump())
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return producto_a_out(nuevo_producto)


@router.put("/{id_producto}")
def actualizar_producto(
    id_producto: int,
    datos: ProductoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    producto = db.query(Producto).filter(Producto.id == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    cambios = datos.model_dump(exclude_unset=True)

    if "slug" in cambios and cambios["slug"] != producto.slug:
        if db.query(Producto).filter(Producto.slug == cambios["slug"]).first():
            raise HTTPException(status_code=400, detail="Ya existe un producto con ese slug")

    for campo, valor in cambios.items():
        setattr(producto, campo, valor)

    db.commit()
    db.refresh(producto)
    return producto_a_out(producto)


@router.delete("/{id_producto}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    id_producto: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    producto = db.query(Producto).filter(Producto.id == id_producto).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    try:
        db.delete(producto)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar: el producto tiene pedidos o carritos asociados. "
            "Márcalo como 'no disponible' en su lugar.",
        )
    return None
