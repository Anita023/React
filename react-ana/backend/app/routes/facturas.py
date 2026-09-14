import io
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import require_roles
from ..models import DetalleFactura, Factura, Usuario, Venta
from ..schemas import FacturaOut, factura_a_out

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
    cliente_nombre = f"{cliente.nombre} {cliente.apellido}" if cliente else "N/A"
    cliente_documento = cliente.numero_documento if cliente else "N/A"
    cliente_direccion = cliente.direccion if cliente else "N/A"
    cliente_telefono = cliente.telefono if cliente else "N/A"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        title=f"Factura {factura.numero_factura}",
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    estilos = getSampleStyleSheet()
    elementos = []

    elementos.append(Paragraph("Sweet Ice", estilos["Title"]))
    elementos.append(Paragraph(f"Factura de Venta N° {factura.numero_factura}", estilos["Heading2"]))
    elementos.append(
        Paragraph(
            f"Fecha de emisión: {factura.creado_en.strftime('%d/%m/%Y %H:%M') if factura.creado_en else 'N/A'}",
            estilos["Normal"],
        )
    )
    elementos.append(Spacer(1, 14))

    elementos.append(Paragraph("<b>Datos del cliente</b>", estilos["Heading4"]))
    elementos.append(Paragraph(f"Nombre: {cliente_nombre}", estilos["Normal"]))
    elementos.append(Paragraph(f"Documento: {cliente_documento}", estilos["Normal"]))
    elementos.append(Paragraph(f"Dirección: {cliente_direccion}", estilos["Normal"]))
    elementos.append(Paragraph(f"Teléfono: {cliente_telefono}", estilos["Normal"]))
    elementos.append(Spacer(1, 16))

    datos_tabla = [["Producto/Servicio", "Cantidad", "Precio unitario", "Subtotal"]]
    for d in factura.detalles:
        datos_tabla.append(
            [d.nombre_item, str(d.cantidad), f"${d.precio_unitario:,.0f}", f"${d.subtotal:,.0f}"]
        )

    tabla = Table(datos_tabla, colWidths=[220, 70, 100, 100], repeatRows=1)
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#db2777")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#fff1f2")]),
            ]
        )
    )
    elementos.append(tabla)
    elementos.append(Spacer(1, 18))

    elementos.append(Paragraph(f"Subtotal: ${factura.subtotal:,.0f}", estilos["Normal"]))
    elementos.append(Paragraph(f"Impuestos: ${factura.impuestos:,.0f}", estilos["Normal"]))
    elementos.append(Paragraph(f"<b>Total: ${factura.total:,.0f}</b>", estilos["Heading3"]))
    elementos.append(Paragraph(f"Estado: {factura.estado}", estilos["Normal"]))
    elementos.append(Spacer(1, 24))
    elementos.append(
        Paragraph(
            f"Documento generado el {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            estilos["Italic"],
        )
    )

    doc.build(elementos)
    buffer.seek(0)

    nombre_archivo = f"{factura.numero_factura}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nombre_archivo}"'},
    )