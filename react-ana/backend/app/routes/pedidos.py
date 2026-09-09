from typing import List

from fastapi import APIRouter, Body, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import Carrito, CarritoItem, Pedido, PedidoItem, Producto, Usuario
from ..schemas import PedidoCrear, PedidoEstadoUpdate

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])


class ItemPedidoManual(BaseModel):
    producto_id: int
    cantidad: int


class PedidoManualCrear(BaseModel):
    correo_cliente: str
    items: List[ItemPedidoManual]


def _pedido_a_dict(pedido: Pedido, incluir_cliente: bool = False, incluir_detalles: bool = False) -> dict:
    datos = {
        "id": pedido.id,
        "total": pedido.total,
        "estado": pedido.estado,
        "metodo_pago": pedido.metodo_pago,
        "creado_en": pedido.creado_en,
    }
    if incluir_cliente and pedido.usuario:
        cliente = pedido.usuario.cliente
        datos["nombre"] = cliente.nombre if cliente else pedido.usuario.nombre
        datos["apellido"] = cliente.apellido if cliente else None
        datos["correo"] = pedido.usuario.correo
    if incluir_detalles:
        datos["detalles"] = [
            {"nombre": d.nombre_producto, "precio": d.precio_unitario, "cantidad": d.cantidad}
            for d in pedido.items
        ]
    return datos


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_pedido_desde_carrito(
    datos: PedidoCrear = Body(default=PedidoCrear()),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    carrito = db.query(Carrito).filter(Carrito.usuario_id == usuario_actual.id).first()
    items_carrito = carrito.items if carrito else []
    if not items_carrito:
        raise HTTPException(status_code=400, detail="Tu carrito está vacío")

    total = sum(float(item.producto.precio) * item.cantidad for item in items_carrito)

    nuevo_pedido = Pedido(
        usuario_id=usuario_actual.id,
        total=total,
        estado="pendiente",
        metodo_pago=datos.metodo_pago,
    )
    db.add(nuevo_pedido)
    db.flush()  # para obtener nuevo_pedido.id antes del commit

    for item in items_carrito:
        db.add(
            PedidoItem(
                pedido_id=nuevo_pedido.id,
                producto_id=item.producto_id,
                nombre_producto=item.producto.nombre,
                precio_unitario=item.producto.precio,
                cantidad=item.cantidad,
            )
        )
        db.delete(item)

    db.commit()
    db.refresh(nuevo_pedido)
    return {"pedido": _pedido_a_dict(nuevo_pedido, incluir_detalles=True)}


@router.post("/manual", status_code=status.HTTP_201_CREATED)
def crear_pedido_manual(
    datos: PedidoManualCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Un administrador o empleado registra un pedido a nombre de un cliente
    ya existente, identificado por su correo (por ejemplo, un pedido tomado
    por teléfono o en el local)."""
    cliente = db.query(Usuario).filter(Usuario.correo == datos.correo_cliente).first()
    if not cliente:
        raise HTTPException(
            status_code=404, detail="No existe ningún usuario con ese correo"
        )

    if not datos.items:
        raise HTTPException(status_code=400, detail="Agrega al menos un producto")

    items_a_crear = []
    total = 0.0
    for item in datos.items:
        if item.cantidad < 1:
            raise HTTPException(status_code=400, detail="La cantidad debe ser al menos 1")

        producto = db.query(Producto).filter(Producto.id == item.producto_id).first()
        if not producto:
            raise HTTPException(
                status_code=404, detail=f"El producto {item.producto_id} no existe"
            )

        total += float(producto.precio) * item.cantidad
        items_a_crear.append((producto, item.cantidad))

    nuevo_pedido = Pedido(
        usuario_id=cliente.id,
        total=total,
        estado="pendiente",
        metodo_pago="efectivo",
    )
    db.add(nuevo_pedido)
    db.flush()  # para obtener nuevo_pedido.id antes del commit

    for producto, cantidad in items_a_crear:
        db.add(
            PedidoItem(
                pedido_id=nuevo_pedido.id,
                producto_id=producto.id,
                nombre_producto=producto.nombre,
                precio_unitario=producto.precio,
                cantidad=cantidad,
            )
        )

    db.commit()
    db.refresh(nuevo_pedido)
    return {"pedido": _pedido_a_dict(nuevo_pedido, incluir_cliente=True, incluir_detalles=True)}


@router.get("/mios")
def mis_pedidos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.usuario_id == usuario_actual.id)
        .order_by(Pedido.creado_en.desc())
        .all()
    )
    return {"pedidos": [_pedido_a_dict(p) for p in pedidos]}


@router.get("")
def listar_todos_los_pedidos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    pedidos = (
        db.query(Pedido)
        .options(joinedload(Pedido.usuario))
        .order_by(Pedido.creado_en.desc())
        .all()
    )
    return {"pedidos": [_pedido_a_dict(p, incluir_cliente=True) for p in pedidos]}


@router.get("/{id_pedido}")
def obtener_pedido(
    id_pedido: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    pedido = db.query(Pedido).filter(Pedido.id == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if usuario_actual.rol not in ("administrador", "empleado") and pedido.usuario_id != usuario_actual.id:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver este pedido")

    return {"pedido": _pedido_a_dict(pedido, incluir_cliente=True, incluir_detalles=True)}


@router.patch("/{id_pedido}/estado")
def actualizar_estado_pedido(
    id_pedido: int,
    datos: PedidoEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    pedido = db.query(Pedido).filter(Pedido.id == id_pedido).first()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    pedido.estado = datos.estado
    db.commit()
    db.refresh(pedido)
    return {"pedido": _pedido_a_dict(pedido, incluir_cliente=True)}