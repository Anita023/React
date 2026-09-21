import io
from datetime import datetime
from typing import Optional, Sequence, Tuple
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ETIQUETAS_METODO_PAGO = {
    "efectivo": "Efectivo",
    "tarjeta": "Tarjeta",
    "transferencia": "Transferencia",
}

ETIQUETAS_ESTADO_PEDIDO = {
    "pendiente": "Pendiente",
    "en_proceso": "En proceso",
    "entregado": "Entregado",
    "cancelado": "Cancelado",
}


def formatear_moneda(valor) -> str:
    """12000 -> $12.000 (mismo formato es-CO que usa el frontend)."""
    return "$" + f"{float(valor):,.0f}".replace(",", ".")


def construir_pdf_factura(
    *,
    titulo: str,
    fecha: Optional[datetime],
    cliente_nombre: str,
    cliente_documento: str,
    cliente_direccion: str,
    cliente_telefono: str,
    detalles: Sequence[Tuple[str, int, float, float]],  # (nombre, cantidad, precio_unit, subtotal)
    total,
    subtotal=None,
    impuestos=None,
    estado: Optional[str] = None,
    metodo_pago: Optional[str] = None,
) -> bytes:
    """Arma el PDF de una factura y devuelve los bytes. No toca la base de
    datos: recibe datos sueltos, así sirve tanto para una Factura (admin)
    como para un Pedido (correo al cliente)."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        title=titulo,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    estilos = getSampleStyleSheet()
    elementos = []

    elementos.append(Paragraph("Sweet Ice", estilos["Title"]))
    elementos.append(Paragraph(escape(titulo), estilos["Heading2"]))
    elementos.append(
        Paragraph(
            f"Fecha de emisión: {fecha.strftime('%d/%m/%Y %H:%M') if fecha else 'N/A'}",
            estilos["Normal"],
        )
    )
    elementos.append(Spacer(1, 14))

    elementos.append(Paragraph("<b>Datos del cliente</b>", estilos["Heading4"]))
    elementos.append(Paragraph(f"Nombre: {escape(str(cliente_nombre))}", estilos["Normal"]))
    elementos.append(Paragraph(f"Documento: {escape(str(cliente_documento))}", estilos["Normal"]))
    elementos.append(Paragraph(f"Dirección: {escape(str(cliente_direccion))}", estilos["Normal"]))
    elementos.append(Paragraph(f"Teléfono: {escape(str(cliente_telefono))}", estilos["Normal"]))
    elementos.append(Spacer(1, 16))

    datos_tabla = [["Producto/Servicio", "Cantidad", "Precio unitario", "Subtotal"]]
    for nombre, cantidad, precio, subtotal_linea in detalles:
        datos_tabla.append(
            [nombre, str(cantidad), formatear_moneda(precio), formatear_moneda(subtotal_linea)]
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

    if subtotal is not None:
        elementos.append(Paragraph(f"Subtotal: {formatear_moneda(subtotal)}", estilos["Normal"]))
    if impuestos is not None:
        elementos.append(Paragraph(f"Impuestos: {formatear_moneda(impuestos)}", estilos["Normal"]))
    elementos.append(Paragraph(f"<b>Total: {formatear_moneda(total)}</b>", estilos["Heading3"]))
    if metodo_pago:
        elementos.append(Paragraph(f"Método de pago: {escape(metodo_pago)}", estilos["Normal"]))
    if estado:
        elementos.append(Paragraph(f"Estado: {escape(estado)}", estilos["Normal"]))
    elementos.append(Spacer(1, 24))
    elementos.append(
        Paragraph(
            f"Documento generado el {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            estilos["Italic"],
        )
    )

    doc.build(elementos)
    return buffer.getvalue()