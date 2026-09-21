from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import require_roles
from ..models import DetalleFactura, Factura, Usuario, Venta
from ..schemas import FacturaOut, factura_a_out
from ..utils_factura_pdf import construir_pdf_factura

router = APIRouter(prefix="/api/facturas", tags=["Facturas"])


def _generar_numero_factura(db: Session) -> str:
    """Genera un consecutivo simple tipo FAC-000001."""
    ultima = db.query(Factura).order_by(Factura.id.desc()).first()
    siguiente = (ultima.id + 1) if ultima else 1
    return f"FAC-{siguiente:06d}"


def _cargar_factura_completa(db: Session, factura_id: int) -> Optional[Factura]:
    return (
        db.query(Factura)
        .options(joinedload(Factura.detalles), joinedload(Factura.venta).joinedload(Venta.cliente))
        .filter(Factura.id == factura_id)
        .first()
    )


@router.post("/desde-venta/{venta_id}", status_code=status.HTTP_201_CREATED)
def generar_factura(
    venta_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    """Genera una factura a partir de una venta ya registrada, copiando su
    detalle como snapshot inmutable en detalle_facturas."""
    venta = (
        db.query(Venta)
        .options(joinedload(Venta.detalles), joinedload(Venta.cliente))
        .filter(Venta.id == venta_id)
        .first()
    )
    if not venta:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    if venta.estado == "anulada":
        raise HTTPException(status_code=400, detail="No se puede facturar una venta anulada")

    if db.query(Factura).filter(Factura.venta_id == venta_id).first():
        raise HTTPException(status_code=400, detail="Esta venta ya tiene una factura generada")

    detalles_factura = [
        DetalleFactura(
            nombre_item=d.nombre_item,
            cantidad=d.cantidad,
            precio_unitario=d.precio_unitario,
            subtotal=d.subtotal,
        )
        for d in venta.detalles
    ]

    factura = Factura(
        venta_id=venta.id,
        numero_factura=_generar_numero_factura(db),
        subtotal=venta.subtotal - venta.descuento,
        impuestos=venta.impuestos,
        total=venta.total,
        estado="emitida",
    )
    factura.detalles = detalles_factura

    db.add(factura)
    db.commit()
    db.refresh(factura)

    factura_completa = _cargar_factura_completa(db, factura.id)
    return factura_a_out(factura_completa)


@router.get("")
def listar_facturas(
    numero_factura: Optional[str] = Query(None, description="Búsqueda parcial por número de factura"),
    cliente_id: Optional[int] = Query(None),
    fecha_inicio: Optional[date] = Query(None),
    fecha_fin: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    consulta = db.query(Factura).options(
        joinedload(Factura.detalles), joinedload(Factura.venta).joinedload(Venta.cliente)
    )

    if numero_factura:
        consulta = consulta.filter(Factura.numero_factura.ilike(f"%{numero_factura}%"))
    if fecha_inicio:
        consulta = consulta.filter(func.date(Factura.creado_en) >= fecha_inicio)
    if fecha_fin:
        consulta = consulta.filter(func.date(Factura.creado_en) <= fecha_fin)
    if cliente_id:
        consulta = consulta.join(Venta).filter(Venta.cliente_id == cliente_id)

    facturas = consulta.order_by(Factura.creado_en.desc()).all()
    return {"facturas": [factura_a_out(f) for f in facturas]}


@router.get("/{id_factura}")
def obtener_factura(
    id_factura: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    factura = _cargar_factura_completa(db, id_factura)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return factura_a_out(factura)


@router.get("/{id_factura}/pdf")
def descargar_factura_pdf(
    id_factura: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(require_roles("administrador", "empleado")),
):
    factura = _cargar_factura_completa(db, id_factura)
    if not factura:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    cliente = factura.venta.cliente if factura.venta else None

    pdf = construir_pdf_factura(
        titulo=f"Factura de Venta N° {factura.numero_factura}",
        fecha=factura.creado_en,
        cliente_nombre=f"{cliente.nombre} {cliente.apellido}" if cliente else "N/A",
        cliente_documento=cliente.numero_documento if cliente else "N/A",
        cliente_direccion=cliente.direccion if cliente else "N/A",
        cliente_telefono=cliente.telefono if cliente else "N/A",
        detalles=[(d.nombre_item, d.cantidad, d.precio_unitario, d.subtotal) for d in factura.detalles],
        subtotal=factura.subtotal,
        impuestos=factura.impuestos,
        total=factura.total,
        estado=factura.estado,
    )

    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{factura.numero_factura}.pdf"'},
    )