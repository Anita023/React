import io
import os
from datetime import datetime
from typing import Optional, Sequence, Tuple
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.graphics.shapes import Drawing, Circle, Polygon
from reportlab.platypus import Image, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

# --- Datos fijos del negocio (ficticios, ajústalos cuando tengas los reales) ---
NOMBRE_NEGOCIO = "Sweet Ice"
NIT_NEGOCIO = "NIT: 900.123.456-7"
DIRECCION_NEGOCIO = "Cra 45 #12 - 34, Medellín, Antioquia"
TELEFONO_NEGOCIO = "Tel: (604) 444-5566"

# --- IVA ---
IVA_PORCENTAJE = 0.19

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

# Ruta al logo real del negocio. Vive en backend/app/assets/logo.jpeg,
# es decir, un nivel arriba de este archivo (app/utils_factura_pdf.py -> app/assets/logo.jpeg).
RUTA_LOGO = os.path.join(os.path.dirname(__file__), "assets", "img", "logo.jpeg")


def formatear_moneda(valor) -> str:
    """12000 -> $12.000 (mismo formato es-CO que usa el frontend)."""
    return "$" + f"{float(valor):,.0f}".replace(",", ".")


def _logo_helado() -> Drawing:
    """Logo de respaldo dibujado en vectores: un cono de helado. Solo se usa
    si el archivo de logo real (RUTA_LOGO) no se encuentra, así el PDF nunca
    se rompe por falta de la imagen."""
    d = Drawing(40, 46)
    # Cono (triángulo color caramelo)
    d.add(Polygon(points=[8, 4, 32, 4, 20, -2], fillColor=colors.HexColor("#deb887"), strokeColor=None))
    d.add(Polygon(points=[10, 4, 30, 4, 20, 26], fillColor=colors.HexColor("#deb887"), strokeColor=None))
    # Bolas de helado (fresa y vainilla)
    d.add(Circle(20, 30, 10, fillColor=colors.HexColor("#f9a8d4"), strokeColor=None))
    d.add(Circle(14, 34, 8, fillColor=colors.HexColor("#fff1f2"), strokeColor=None))
    d.add(Circle(26, 34, 8, fillColor=colors.HexColor("#f9a8d4"), strokeColor=None))
    # Cereza
    d.add(Circle(20, 43, 3, fillColor=colors.HexColor("#db2777"), strokeColor=None))
    return d


def _obtener_logo():
    """Devuelve el logo real de Sweet Ice si el archivo existe en RUTA_LOGO;
    si no, cae de vuelta al ícono vectorial genérico para que el PDF nunca falle."""
    if os.path.isfile(RUTA_LOGO):
        try:
            return Image(RUTA_LOGO, width=46, height=46)
        except Exception as error:
            print(f"[ERROR cargando logo en factura PDF] {error}")
    return _logo_helado()


def construir_pdf_factura(
    *,
    titulo: str,
    fecha: Optional[datetime],
    cliente_nombre: str,
    cliente_documento: str,
    cliente_direccion: str,
    cliente_telefono: str,
    detalles: Sequence[Tuple[str, int, float, float]],  # (nombre, cantidad, precio_unit, subtotal)
    total=None,
    subtotal=None,
    impuestos=None,
    descuento=0,
    estado: Optional[str] = None,
    metodo_pago: Optional[str] = None,
) -> bytes:
    """Arma el PDF de una factura y devuelve los bytes. No toca la base de
    datos: recibe datos sueltos, así sirve tanto para una Factura (admin)
    como para un Pedido (correo al cliente).

    El IVA (19%) se calcula automáticamente sobre el subtotal cuando no
    se pasa un valor explícito de `impuestos`. Si `total` no se pasa,
    también se calcula como subtotal - descuento + impuestos.
    """
    subtotal = float(subtotal) if subtotal is not None else sum(s for _, _, _, s in detalles)

    if impuestos is None:
        impuestos = round(subtotal * IVA_PORCENTAJE, 2)
    else:
        impuestos = float(impuestos)

    descuento = float(descuento or 0)

    if total is None:
        total = subtotal - descuento + impuestos
    else:
        total = float(total)

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

    # --- Encabezado: logo + nombre + datos del negocio ---
    encabezado_negocio = [
        Paragraph(f"<b>{NOMBRE_NEGOCIO}</b>", estilos["Title"]),
        Paragraph(NIT_NEGOCIO, estilos["Normal"]),
        Paragraph(DIRECCION_NEGOCIO, estilos["Normal"]),
        Paragraph(TELEFONO_NEGOCIO, estilos["Normal"]),
    ]
    tabla_encabezado = Table(
        [[_obtener_logo(), encabezado_negocio]],
        colWidths=[55, 400],
    )
    tabla_encabezado.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (0, 0), 0),
            ]
        )
    )
    elementos.append(tabla_encabezado)
    elementos.append(Spacer(1, 10))

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

    elementos.append(Paragraph(f"Subtotal: {formatear_moneda(subtotal)}", estilos["Normal"]))
    if descuento:
        elementos.append(Paragraph(f"Descuento: -{formatear_moneda(descuento)}", estilos["Normal"]))
    elementos.append(
        Paragraph(f"IVA ({int(IVA_PORCENTAJE * 100)}%): {formatear_moneda(impuestos)}", estilos["Normal"])
    )
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