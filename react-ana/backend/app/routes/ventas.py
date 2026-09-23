from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import require_roles
from ..models import Cliente, DetalleVenta, Pedido, Producto, Servicio, Usuario, Venta
from ..schemas import VentaCreate, VentaEstadoUpdate, venta_a_out

router = APIRouter(prefix="/api/ventas", tags=["Ventas"])

# IVA aplicado a todas las ventas. Se calcula siempre aquí, en el servidor:
# nunca se confía en un valor de "impuestos" que venga del cliente (Postman,
# el formulario del admin, etc.), porque eso permitiría manipular el total.
IVA_PORCENTAJE = Decimal("0.19")


def _calcular_iva(subtotal: Decimal) -> Decimal:
    return (subtotal * IVA_PORCENTAJE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _construir_detalles_desde_items(db: Session, items) -> tuple[list[DetalleVenta], Decimal]:
    """Arma la lista de DetalleVenta a partir de los items del request,
    tomando el precio real y el nombre desde la base de datos (nunca desde
    el cliente) para evitar manipulación de precios."""
    detalles: list[DetalleVenta] = []
    subtotal_total = Decimal("0")

    for item in items:
        if item.producto_id:
            producto = db.query(Producto).filter(Producto.id == item.producto_id).first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")
            nombre = producto.nombre
            precio = producto.precio
        else:
            servicio = db.query(Servicio).filter(Servicio.id == item.servicio_id).first()
            if not servicio:
                raise HTTPException(status_code=404, detail=f"Servicio {item.servicio_id} no encontrado")
            nombre = servicio.nombre
            precio = servicio.precio

        subtotal_item = precio * item.cantidad
        subtotal_total += subtotal_item

        detalles.append(
            DetalleVenta(
                producto_id=item.producto_id,
                servicio_id=item.servicio_id,
                nombre_item=nombre,
                cantidad=item.cantidad,
                precio_unitario=precio,
                subtotal=subtotal_item,
            )
        )

    return detalles, subtotal_total


@router.post("", status_code=status.HTTP_201_CREATED)
def crear_venta(
    datos: VentaCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Registro manual de una venta (ej: venta en mostrador), hecha por un
    empleado o administrador. No requiere que exista un pedido previo."""
    cliente = db.query(Cliente).filter(Cliente.id == datos.cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if datos.pedido_id:
        pedido = db.query(Pedido).filter(Pedido.id == datos.pedido_id).first()
        if not pedido:
            raise HTTPException(status_code=404, detail="Pedido no encontrado")
        if pedido.estado == "cancelado":
            raise HTTPException(
                status_code=400, detail="No se puede registrar una venta de un pedido cancelado"
            )
        if db.query(Venta).filter(Venta.pedido_id == datos.pedido_id).first():
            raise HTTPException(status_code=400, detail="Este pedido ya tiene una venta registrada")

    detalles, subtotal = _construir_detalles_desde_items(db, datos.items)

    impuestos = _calcular_iva(subtotal)
    total = subtotal - datos.descuento + impuestos
    if total < 0:
        raise HTTPException(status_code=400, detail="El total no puede ser negativo")

    venta = Venta(
        cliente_id=datos.cliente_id,
        usuario_id=usuario_actual.id,
        pedido_id=datos.pedido_id,
        subtotal=subtotal,
        descuento=datos.descuento,
        impuestos=impuestos,
        total=total,
        estado="completada",
    )
    venta.detalles = detalles

    db.add(venta)
    db.commit()
    db.refresh(venta)
    return venta_a_out(venta)


@router.post("/desde-pedido/{pedido_id}", status_code=status.HTTP_201_CREATED)
def crear_venta_desde_pedido(
    pedido_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Convierte un pedido del sitio web (ya existente) en una venta formal,
    copiando sus items y servicios como snapshot en detalle_ventas."""
    pedido = (
        db.query(Pedido)
        .options(joinedload(Pedido.items), joinedload(Pedido.servicios))
        .filter(Pedido.id == pedido_id)
        .first()
    )
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    if pedido.estado == "cancelado":
        raise HTTPException(
            status_code=400, detail="No se puede registrar una venta de un pedido cancelado"
        )

    if db.query(Venta).filter(Venta.pedido_id == pedido_id).first():
        raise HTTPException(status_code=400, detail="Este pedido ya tiene una venta registrada")

    cliente = db.query(Cliente).filter(Cliente.usuario_id == pedido.usuario_id).first()
    if not cliente:
        raise HTTPException(
            status_code=400,
            detail="El usuario dueño del pedido no tiene un perfil de cliente asociado",
        )

    detalles: list[DetalleVenta] = []
    subtotal = Decimal("0")

    for item in pedido.items:
        sub = item.precio_unitario * item.cantidad
        subtotal += sub
        detalles.append(
            DetalleVenta(
                producto_id=item.producto_id,
                nombre_item=item.nombre_producto,
                cantidad=item.cantidad,
                precio_unitario=item.precio_unitario,
                subtotal=sub,
            )
        )

    for servicio_pedido in pedido.servicios:
        sub = servicio_pedido.precio_unitario
        subtotal += sub
        nombre_servicio = servicio_pedido.servicio.nombre if servicio_pedido.servicio else "Servicio"
        detalles.append(
            DetalleVenta(
                servicio_id=servicio_pedido.servicio_id,
                nombre_item=nombre_servicio,
                cantidad=1,
                precio_unitario=servicio_pedido.precio_unitario,
                subtotal=sub,
            )
        )

    if not detalles:
        raise HTTPException(status_code=400, detail="El pedido no tiene productos ni servicios")

    impuestos = _calcular_iva(subtotal)
    total = subtotal + impuestos

    venta = Venta(
        cliente_id=cliente.id,
        usuario_id=usuario_actual.id,
        pedido_id=pedido.id,
        subtotal=subtotal,
        descuento=Decimal("0"),
        impuestos=impuestos,
        total=total,
        estado="completada",
    )
    venta.detalles = detalles

    db.add(venta)
    db.commit()
    db.refresh(venta)
    return venta_a_out(venta)


@router.get("")
def listar_ventas(
    fecha_inicio: Optional[date] = Query(None, description="Filtra ventas desde esta fecha (YYYY-MM-DD)"),
    fecha_fin: Optional[date] = Query(None, description="Filtra ventas hasta esta fecha (YYYY-MM-DD)"),
    cliente_id: Optional[int] = Query(None),
    producto_id: Optional[int] = Query(None),
    servicio_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Historial de ventas con filtros combinables."""
    consulta = db.query(Venta).options(joinedload(Venta.detalles), joinedload(Venta.cliente))

    if fecha_inicio:
        consulta = consulta.filter(func.date(Venta.creado_en) >= fecha_inicio)
    if fecha_fin:
        consulta = consulta.filter(func.date(Venta.creado_en) <= fecha_fin)
    if cliente_id:
        consulta = consulta.filter(Venta.cliente_id == cliente_id)
    if estado:
        consulta = consulta.filter(Venta.estado == estado)
    if producto_id or servicio_id:
        consulta = consulta.join(DetalleVenta)
        if producto_id:
            consulta = consulta.filter(DetalleVenta.producto_id == producto_id)
        if servicio_id:
            consulta = consulta.filter(DetalleVenta.servicio_id == servicio_id)

    ventas = consulta.order_by(Venta.creado_en.desc()).distinct().all()
    return {"ventas": [venta_a_out(v) for v in ventas]}


@router.get("/{id_venta}")
def obtener_venta(
    id_venta: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    venta = (
        db.query(Venta)
        .options(joinedload(Venta.detalles), joinedload(Venta.cliente))
        .filter(Venta.id == id_venta)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
    return venta_a_out(venta)


@router.patch("/{id_venta}/estado")
def actualizar_estado_venta(
    id_venta: int,
    datos: VentaEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    venta = db.query(Venta).options(joinedload(Venta.detalles), joinedload(Venta.cliente)).filter(Venta.id == id_venta).first()
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    venta.estado = datos.estado

    # Si la venta se anula, su factura (si ya se emitió) también debe quedar
    # anulada; si no, el dashboard seguiría sumándola en "Facturado".
    if datos.estado == "anulada" and venta.factura and venta.factura.estado != "anulada":
        venta.factura.estado = "anulada"

    db.commit()
    db.refresh(venta)
    return venta_a_out(venta)