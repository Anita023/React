from fastapi import APIRouter, Body, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import Carrito, CarritoItem, Pedido, PedidoItem, Usuario
from ..schemas import PedidoCrear, PedidoEstadoUpdate

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])


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