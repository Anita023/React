import base64
import os

import requests

from html import escape

from .utils_factura_pdf import (
    ETIQUETAS_ESTADO_PEDIDO,
    ETIQUETAS_METODO_PAGO,
    construir_pdf_factura,
    formatear_moneda,
)

# --- Configuración de la API HTTP de Brevo (NO usa SMTP) ---------------------
# Railway bloquea las conexiones SMTP salientes (puertos 25/465/587) en el
# plan gratuito, así que enviamos los correos a través de la API HTTPS de
# Brevo (puerto 443), que sí funciona sin restricciones.
BREVO_API_KEY = os.getenv("BREVO_API_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@sweetice.com")
BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def _enviar(
    correo_destino: str,
    asunto: str,
    texto_plano: str,
    html: str,
    etiqueta_dev: str,
    adjuntos=None,  # lista opcional de (nombre_archivo, bytes_pdf)
) -> None:
    """
    Función interna compartida por todos los correos: arma el payload JSON
    (texto plano + HTML, y adjuntos PDF en base64 si los hay) y lo envía
    mediante la API HTTP de Brevo (https://api.brevo.com/v3/smtp/email).

    Si BREVO_API_KEY no está configurada (por ejemplo en desarrollo local),
    no falla la petición: solo imprime en consola para que puedas seguir
    probando sin credenciales reales.
    """
    if not BREVO_API_KEY:
        print(f"[DEV] {etiqueta_dev} para {correo_destino} (correo no enviado, falta BREVO_API_KEY)")
        return

    payload = {
        "sender": {"name": "Sweet Ice", "email": EMAIL_FROM},
        "to": [{"email": correo_destino}],
        "subject": asunto,
        "htmlContent": html,
        "textContent": texto_plano,
    }

    if adjuntos:
        payload["attachment"] = [
            {
                "name": nombre_archivo,
                "content": base64.b64encode(contenido).decode("utf-8"),
            }
            for nombre_archivo, contenido in adjuntos
        ]

    headers = {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
    }

    try:
        respuesta = requests.post(BREVO_API_URL, json=payload, headers=headers, timeout=15)
        if respuesta.status_code >= 400:
            print(
                f"[ERROR envío de correo] {etiqueta_dev} a {correo_destino}: "
                f"HTTP {respuesta.status_code} - {respuesta.text}"
            )
    except Exception as error:
        # Un fallo de correo nunca debe tumbar el flujo principal (registro,
        # pedido, respuesta de PQR, etc.); lo dejamos registrado para depurar.
        print(f"[ERROR envío de correo] {etiqueta_dev} a {correo_destino}: {error}")


# ---------------------------------------------------------------------------
# Envoltura HTML compartida (mismo encabezado/pie de marca en todos los
# correos), para no repetir el diseño en cada función.
# ---------------------------------------------------------------------------
def _envoltura_html(contenido_html: str) -> str:
    return f"""\
<!DOCTYPE html>
<html lang="es">
  <body style="margin:0; padding:0; background-color:#FBF1E3; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FBF1E3; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="max-width:480px; background-color:#FFFFFF; border-radius:24px; overflow:hidden; box-shadow:0 8px 24px rgba(90,60,40,0.12);">

            <!-- Encabezado -->
            <tr>
              <td style="background-color:#8B5E3C; padding:32px 24px; text-align:center;">
                <div style="font-size:34px; line-height:1;">🍦</div>
                <div style="color:#FDEEDC; font-size:12px; font-weight:bold; letter-spacing:3px; margin-top:10px;">
                  SWEET ICE
                </div>
              </td>
            </tr>

            <!-- Cuerpo (contenido específico de cada correo) -->
            <tr>
              <td style="padding:32px 28px; font-family: Arial, Helvetica, sans-serif;">
                {contenido_html}
              </td>
            </tr>

            <!-- Pie -->
            <tr>
              <td style="background-color:#FBF1E3; padding:18px; text-align:center;">
                <span style="color:#B0A296; font-size:12px;">
                  © Sweet Ice — Crepería y Helados Artesanales
                </span>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


# ---------------------------------------------------------------------------
# CÓDIGO DE RECUPERACIÓN DE CONTRASEÑA
# ---------------------------------------------------------------------------
def enviar_codigo_recuperacion(correo_destino: str, nombre: str, codigo: str) -> None:
    asunto = "Tu código de recuperación - Sweet Ice"

    texto_plano = (
        f"Hola {nombre},\n\n"
        f"Tu código de recuperación de contraseña es: {codigo}\n"
        f"Este código vence en 10 minutos.\n\n"
        f"Si tú no solicitaste este cambio, ignora este correo.\n\n"
        f"— Sweet Ice"
    )

    contenido = f"""\
        <p style="margin:0 0 4px 0; color:#5A3E2B; font-size:20px; font-weight:bold;">
          Hola {nombre},
        </p>
        <p style="margin:0 0 24px 0; color:#8A6A55; font-size:15px; line-height:1.5;">
          Recibimos una solicitud para restablecer tu contraseña. Usa este código para continuar:
        </p>

        <div style="text-align:center; margin:0 0 24px 0;">
          <span style="display:inline-block; background-color:#FCE8DD; color:#B5461F;
                       font-size:32px; font-weight:bold; letter-spacing:8px;
                       padding:16px 28px; border-radius:16px;">
            {codigo}
          </span>
        </div>

        <p style="margin:0 0 8px 0; color:#8A6A55; font-size:14px; text-align:center;">
          Este código vence en <strong>10 minutos</strong>.
        </p>

        <hr style="border:none; border-top:1px solid #F0E2D0; margin:28px 0;" />

        <p style="margin:0; color:#B0A296; font-size:12px; line-height:1.5; text-align:center;">
          Si tú no solicitaste este cambio, puedes ignorar este correo con tranquilidad —
          tu cuenta sigue segura.
        </p>
    """

    _enviar(correo_destino, asunto, texto_plano, _envoltura_html(contenido), f"Código de recuperación ({codigo})")


# ---------------------------------------------------------------------------
# BIENVENIDA AL REGISTRARSE
# ---------------------------------------------------------------------------
def enviar_bienvenida(correo_destino: str, nombre: str) -> None:
    asunto = "¡Bienvenido a Sweet Ice! 🍦"

    texto_plano = (
        f"Hola {nombre},\n\n"
        f"¡Gracias por registrarte en Sweet Ice! Tu cuenta ya está activa y lista para usar.\n"
        f"Ya puedes explorar nuestros sabores, agregar productos y servicios a tu carrito, "
        f"y hacer seguimiento a tus pedidos desde tu panel de cliente.\n\n"
        f"¡Nos encanta tenerte por aquí!\n\n"
        f"— Sweet Ice"
    )

    contenido = f"""\
        <p style="margin:0 0 4px 0; color:#5A3E2B; font-size:20px; font-weight:bold;">
          ¡Hola {nombre}!
        </p>
        <p style="margin:0 0 20px 0; color:#8A6A55; font-size:15px; line-height:1.6;">
          Gracias por registrarte en <strong>Sweet Ice</strong> 🍦 Tu cuenta ya está activa
          y lista para usar.
        </p>

        <div style="text-align:center; margin:0 0 24px 0;">
          <span style="display:inline-block; background-color:#FCE8DD; color:#B5461F;
                       font-size:15px; font-weight:bold;
                       padding:14px 26px; border-radius:999px;">
            ¡Cuenta creada con éxito! 🎉
          </span>
        </div>

        <p style="margin:0 0 8px 0; color:#8A6A55; font-size:14px; line-height:1.6; text-align:center;">
          Ya puedes explorar nuestros sabores, agregar productos y servicios a tu carrito,
          y hacer seguimiento a tus pedidos desde tu panel de cliente.
        </p>

        <hr style="border:none; border-top:1px solid #F0E2D0; margin:28px 0;" />

        <p style="margin:0; color:#B0A296; font-size:12px; line-height:1.5; text-align:center;">
          ¡Nos encanta tenerte por aquí!
        </p>
    """

    _enviar(correo_destino, asunto, texto_plano, _envoltura_html(contenido), "Correo de bienvenida")


# ---------------------------------------------------------------------------
# RESPUESTA A UN PQR (petición, queja, reclamo o sugerencia)
# ---------------------------------------------------------------------------
def enviar_respuesta_pqr(correo_destino: str, nombre: str, asunto_pqr: str, respuesta: str, estado: str) -> None:
    etiqueta_estado = "Respondida" if estado == "respondida" else "Cerrada"
    # Sin saltos de línea: el asunto también va en el encabezado del correo.
    asunto_pqr = " ".join(asunto_pqr.split())
    asunto = f"Respuesta a tu solicitud: {asunto_pqr} - Sweet Ice"

    # Lo que escribe el cliente (asunto) o el empleado (respuesta) se escapa
    # antes de meterlo en el HTML, y los saltos de línea se conservan.
    nombre_html = escape(nombre)
    asunto_pqr_html = escape(asunto_pqr)
    respuesta_html = escape(respuesta).replace("\n", "<br>")

    texto_plano = (
        f"Hola {nombre},\n\n"
        f"Tu solicitud \"{asunto_pqr}\" ha sido {etiqueta_estado.lower()}.\n\n"
        f"Respuesta de Sweet Ice:\n{respuesta}\n\n"
        f"Puedes ver el detalle completo en tu panel de cliente, sección PQR.\n\n"
        f"— Sweet Ice"
    )

    contenido = f"""\
        <p style="margin:0 0 4px 0; color:#5A3E2B; font-size:20px; font-weight:bold;">
          Hola {nombre_html},
        </p>
        <p style="margin:0 0 20px 0; color:#8A6A55; font-size:15px; line-height:1.6;">
          Tu solicitud <strong>"{asunto_pqr_html}"</strong> ha sido marcada como
          <strong>{etiqueta_estado.lower()}</strong>.
        </p>

        <div style="background-color:#FCE8DD; border-radius:16px; padding:18px 20px; margin:0 0 20px 0;">
          <p style="margin:0 0 6px 0; color:#B5461F; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">
            Respuesta de Sweet Ice
          </p>
          <p style="margin:0; color:#5A3E2B; font-size:14px; line-height:1.6;">
            {respuesta_html}
          </p>
        </div>

        <p style="margin:0 0 8px 0; color:#8A6A55; font-size:13px; line-height:1.5; text-align:center;">
          Puedes ver el detalle completo en tu panel de cliente, sección PQR.
        </p>

        <hr style="border:none; border-top:1px solid #F0E2D0; margin:28px 0;" />

        <p style="margin:0; color:#B0A296; font-size:12px; line-height:1.5; text-align:center;">
          Gracias por ayudarnos a mejorar.
        </p>
    """

    _enviar(correo_destino, asunto, texto_plano, _envoltura_html(contenido), f"Respuesta PQR ({estado})")


# ---------------------------------------------------------------------------
# FACTURA DE UN PEDIDO (con PDF adjunto)
# ---------------------------------------------------------------------------
def enviar_factura_pedido(correo_destino: str, datos: dict) -> None:
    """`datos` es un dict con valores simples (armado en routes/pedidos.py),
    no objetos de SQLAlchemy, porque esto corre en segundo plano cuando la
    sesión de base de datos ya se cerró."""
    numero = datos["id"]
    nombre = datos["cliente_nombre"]
    fecha = datos["fecha"]
    fecha_txt = fecha.strftime("%d/%m/%Y %H:%M") if fecha else "N/A"
    metodo = ETIQUETAS_METODO_PAGO.get(datos["metodo_pago"], datos["metodo_pago"])
    estado = ETIQUETAS_ESTADO_PEDIDO.get(datos["estado"], datos["estado"])
    detalles = datos["detalles"]

    asunto = f"Tu factura del pedido #{numero} - Sweet Ice"

    # El PDF se genera aquí; si algo falla, el correo sale igual sin adjunto.
    adjuntos = []
    try:
        pdf = construir_pdf_factura(
            titulo=f"Factura - Pedido #{numero}",
            fecha=fecha,
            cliente_nombre=nombre,
            cliente_documento=datos["cliente_documento"],
            cliente_direccion=datos["cliente_direccion"],
            cliente_telefono=datos["cliente_telefono"],
            detalles=[(d["nombre"], d["cantidad"], d["precio"], d["precio"] * d["cantidad"]) for d in detalles],
            total=datos["total"],
            estado=estado,
            metodo_pago=metodo,
        )
        adjuntos.append((f"Factura-Pedido-{numero}.pdf", pdf))
        nota_adjunto = "Adjuntamos tu factura en PDF."
    except Exception as error:
        print(f"[ERROR generando PDF de factura] pedido {numero}: {error}")
        nota_adjunto = "Puedes ver tu factura en tu panel de cliente."

    lineas_texto = "\n".join(
        f"- {d['nombre']} x{d['cantidad']}: {formatear_moneda(d['precio'] * d['cantidad'])}"
        for d in detalles
    )
    texto_plano = (
        f"Hola {nombre},\n\n"
        f"¡Gracias por tu pedido en Sweet Ice! Aquí está el resumen del pedido #{numero} "
        f"({fecha_txt}):\n\n"
        f"{lineas_texto}\n\n"
        f"Total: {formatear_moneda(datos['total'])}\n"
        f"Método de pago: {metodo}\n"
        f"Estado: {estado}\n\n"
        f"{nota_adjunto}\n\n"
        f"— Sweet Ice"
    )

    filas = "".join(
        f"""\
          <tr>
            <td style="padding:8px 0; color:#5A3E2B; font-size:14px; border-bottom:1px solid #F0E2D0;">{escape(d['nombre'])}</td>
            <td style="padding:8px 0; color:#5A3E2B; font-size:14px; border-bottom:1px solid #F0E2D0; text-align:center;">{d['cantidad']}</td>
            <td style="padding:8px 0; color:#5A3E2B; font-size:14px; border-bottom:1px solid #F0E2D0; text-align:right;">{formatear_moneda(d['precio'] * d['cantidad'])}</td>
          </tr>"""
        for d in detalles
    )

    contenido = f"""\
        <p style="margin:0 0 4px 0; color:#5A3E2B; font-size:20px; font-weight:bold;">
          ¡Gracias por tu pedido, {escape(nombre)}!
        </p>
        <p style="margin:0 0 20px 0; color:#8A6A55; font-size:15px; line-height:1.6;">
          Recibimos tu <strong>pedido #{numero}</strong> el {fecha_txt}. {nota_adjunto}
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0;">
          <tr>
            <td style="padding:0 0 6px 0; color:#B0A296; font-size:12px; font-weight:bold;">PRODUCTO / SERVICIO</td>
            <td style="padding:0 0 6px 0; color:#B0A296; font-size:12px; font-weight:bold; text-align:center;">CANT.</td>
            <td style="padding:0 0 6px 0; color:#B0A296; font-size:12px; font-weight:bold; text-align:right;">SUBTOTAL</td>
          </tr>
{filas}
        </table>

        <div style="background-color:#FCE8DD; border-radius:16px; padding:16px 20px; margin:0 0 20px 0; text-align:right;">
          <span style="color:#8A6A55; font-size:13px;">Total</span><br />
          <span style="color:#B5461F; font-size:26px; font-weight:bold;">{formatear_moneda(datos['total'])}</span>
        </div>

        <p style="margin:0; color:#8A6A55; font-size:13px; line-height:1.6; text-align:center;">
          Método de pago: <strong>{metodo}</strong> &nbsp;·&nbsp; Estado: <strong>{estado}</strong>
        </p>

        <hr style="border:none; border-top:1px solid #F0E2D0; margin:28px 0;" />

        <p style="margin:0; color:#B0A296; font-size:12px; line-height:1.5; text-align:center;">
          ¡Gracias por elegir Sweet Ice! 🍦
        </p>
    """

    _enviar(
        correo_destino,
        asunto,
        texto_plano,
        _envoltura_html(contenido),
        f"Factura del pedido #{numero}",
        adjuntos=adjuntos,
    )