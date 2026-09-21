from datetime import date, timedelta
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_roles
from ..models import Cliente, DetalleVenta, Factura, PQR, Producto, Servicio, Usuario, Venta

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


def _indicadores_operativos(db: Session) -> dict:
    """Indicadores que pueden ver tanto el administrador como el empleado.
    No incluyen usuarios ni facturación, que son solo del administrador."""
    total_productos = db.query(func.count(Producto.id)).scalar()
    total_servicios = db.query(func.count(Servicio.id)).scalar()
    total_ventas = db.query(func.count(Venta.id)).filter(Venta.estado != "anulada").scalar()
    pqr_pendientes = (
        db.query(func.count(PQR.id)).filter(PQR.estado.in_(["pendiente", "en_proceso"])).scalar()
    )
    return {
        "total_productos": total_productos,
        "total_servicios": total_servicios,
        "total_ventas": total_ventas,
        "pqr_pendientes": pqr_pendientes,
    }


@router.get("/admin")
def dashboard_admin(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador")),
):
    """Indicadores generales del sistema, solo para administrador."""
    datos = _indicadores_operativos(db)

    total_usuarios = db.query(func.count(Usuario.id)).scalar()
    total_facturado = (
        db.query(func.coalesce(func.sum(Factura.total), 0))
        .filter(Factura.estado == "emitida")
        .scalar()
    )
    pqr_total = db.query(func.count(PQR.id)).scalar()

    datos["total_usuarios"] = total_usuarios
    datos["total_facturado"] = float(total_facturado)
    datos["pqr_total"] = pqr_total
    return datos


@router.get("/empleado")
def dashboard_empleado(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Indicadores operativos para el panel de empleado. Devuelve solo lo que
    un empleado puede ver: la restricción vive aquí en el backend, no solo en
    lo que el frontend decide mostrar u ocultar."""
    return _indicadores_operativos(db)


@router.get("/ventas")
def dashboard_ventas(
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    agrupacion: str = Query("dia", pattern="^(dia|semana|mes)$"),
    producto_id: Optional[int] = Query(None),
    servicio_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    cliente_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Serie de ventas agrupada por día/semana/mes, para graficar barras/línea.
    Por defecto trae los últimos 30 días si no se especifican fechas."""
    if not fecha_fin:
        fecha_fin = date.today()
    if not fecha_inicio:
        fecha_inicio = fecha_fin - timedelta(days=29)

    if agrupacion == "dia":
        etiqueta = func.date(Venta.creado_en)
    elif agrupacion == "semana":
        etiqueta = func.yearweek(Venta.creado_en, 3)
    else:
        etiqueta = func.date_format(Venta.creado_en, "%Y-%m")

    consulta = db.query(
        etiqueta.label("periodo"),
        func.count(Venta.id.distinct()).label("cantidad"),
        func.sum(Venta.total).label("total"),
    ).filter(
        func.date(Venta.creado_en) >= fecha_inicio,
        func.date(Venta.creado_en) <= fecha_fin,
        Venta.estado != "anulada",
    )

    if cliente_id:
        consulta = consulta.filter(Venta.cliente_id == cliente_id)
    if estado:
        consulta = consulta.filter(Venta.estado == estado)
    if producto_id or servicio_id:
        consulta = consulta.join(DetalleVenta, DetalleVenta.venta_id == Venta.id)
        if producto_id:
            consulta = consulta.filter(DetalleVenta.producto_id == producto_id)
        if servicio_id:
            consulta = consulta.filter(DetalleVenta.servicio_id == servicio_id)

    resultados = consulta.group_by("periodo").order_by("periodo").all()

    serie = [
        {
            "periodo": str(r.periodo),
            "cantidad_ventas": r.cantidad,
            "total": float(r.total or 0),
        }
        for r in resultados
    ]

    return {
        "fecha_inicio": fecha_inicio.isoformat(),
        "fecha_fin": fecha_fin.isoformat(),
        "agrupacion": agrupacion,
        "serie": serie,
        "total_periodo": sum(item["total"] for item in serie),
        "cantidad_ventas_periodo": sum(item["cantidad_ventas"] for item in serie),
    }


@router.get("/cliente")
def dashboard_cliente(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Resumen personal para el cliente logueado: sus propias compras y PQR."""
    cliente = db.query(Cliente).filter(Cliente.usuario_id == usuario_actual.id).first()
    if not cliente:
        return {
            "total_compras": 0,
            "total_gastado": 0,
            "ultima_compra": None,
            "pqr_pendientes": 0,
        }

    ventas_cliente = (
        db.query(Venta).filter(Venta.cliente_id == cliente.id, Venta.estado != "anulada").all()
    )
    total_compras = len(ventas_cliente)
    total_gastado = sum((v.total for v in ventas_cliente), Decimal("0"))
    ultima_compra = max((v.creado_en for v in ventas_cliente), default=None)

    pqr_pendientes = (
        db.query(func.count(PQR.id))
        .filter(PQR.usuario_id == usuario_actual.id, PQR.estado.in_(["pendiente", "en_proceso"]))
        .scalar()
    )

    return {
        "total_compras": total_compras,
        "total_gastado": float(total_gastado),
        "ultima_compra": ultima_compra.isoformat() if ultima_compra else None,
        "pqr_pendientes": pqr_pendientes,
    }