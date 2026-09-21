import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

SMTP_HOST = os.getenv("BREVO_SMTP_HOST", "smtp-relay.brevo.com")
SMTP_PORT = int(os.getenv("BREVO_SMTP_PORT", "587"))
SMTP_USER = os.getenv("BREVO_SMTP_USER")
SMTP_KEY = os.getenv("BREVO_SMTP_KEY")
EMAIL_FROM = os.getenv("EMAIL_FROM", "no-reply@sweetice.com")


def _enviar(correo_destino: str, asunto: str, texto_plano: str, html: str, etiqueta_dev: str) -> None:
    """
    Función interna compartida por todos los correos: arma el mensaje
    multipart (texto plano + HTML) y lo envía por Brevo SMTP.

    Si BREVO_SMTP_USER / BREVO_SMTP_KEY no están configurados (por ejemplo
    en desarrollo local), no falla la petición: solo imprime en consola
    para que puedas seguir probando sin credenciales reales.
    """
    if not SMTP_USER or not SMTP_KEY:
        print(f"[DEV] {etiqueta_dev} para {correo_destino} (correo no enviado, faltan credenciales SMTP)")
        return

    mensaje = MIMEMultipart("alternative")
    mensaje["Subject"] = asunto
    mensaje["From"] = f"Sweet Ice <{EMAIL_FROM}>"
    mensaje["To"] = correo_destino

    mensaje.attach(MIMEText(texto_plano, "plain", "utf-8"))
    mensaje.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as servidor:
            servidor.starttls()
            servidor.login(SMTP_USER, SMTP_KEY)
            servidor.sendmail(EMAIL_FROM, [correo_destino], mensaje.as_string())
    except Exception as error:
        # Un fallo de correo nunca debe tumbar el flujo principal (registro,
        # respuesta de PQR, etc.); lo dejamos registrado para depurar.
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
    asunto = f"Respuesta a tu solicitud: {asunto_pqr} - Sweet Ice"

    texto_plano = (
        f"Hola {nombre},\n\n"
        f"Tu solicitud \"{asunto_pqr}\" ha sido {etiqueta_estado.lower()}.\n\n"
        f"Respuesta de Sweet Ice:\n{respuesta}\n\n"
        f"Puedes ver el detalle completo en tu panel de cliente, sección PQR.\n\n"
        f"— Sweet Ice"
    )

    contenido = f"""\
        <p style="margin:0 0 4px 0; color:#5A3E2B; font-size:20px; font-weight:bold;">
          Hola {nombre},
        </p>
        <p style="margin:0 0 20px 0; color:#8A6A55; font-size:15px; line-height:1.6;">
          Tu solicitud <strong>"{asunto_pqr}"</strong> ha sido marcada como
          <strong>{etiqueta_estado.lower()}</strong>.
        </p>

        <div style="background-color:#FCE8DD; border-radius:16px; padding:18px 20px; margin:0 0 20px 0;">
          <p style="margin:0 0 6px 0; color:#B5461F; font-size:12px; font-weight:bold; text-transform:uppercase; letter-spacing:1px;">
            Respuesta de Sweet Ice
          </p>
          <p style="margin:0; color:#5A3E2B; font-size:14px; line-height:1.6;">
            {respuesta}
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