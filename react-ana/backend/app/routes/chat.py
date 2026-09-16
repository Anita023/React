import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from google import genai
from google.genai import types
from sqlalchemy.orm import Session, joinedload

from ..auth import decodificar_token
from ..database import get_db
from ..models import Conversacion, Mensaje, Usuario
from ..schemas import ChatMensajeCreate

router = APIRouter(prefix="/api/chat", tags=["Chatbot"])

_cliente_gemini: Optional[genai.Client] = None


def _obtener_cliente_gemini() -> genai.Client:
    """Crea el cliente de Gemini de forma perezosa, para dar un error claro
    si falta la API key en vez de romper el arranque del servidor."""
    global _cliente_gemini
    if _cliente_gemini is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="GEMINI_API_KEY no está configurada en el servidor",
            )
        _cliente_gemini = genai.Client(api_key=api_key)
    return _cliente_gemini


SYSTEM_PROMPT = """Eres el asistente virtual de Sweet Ice, una heladería y pastelería \
que vende por su sitio web.

Tu trabajo es:
- Ayudar a los clientes con preguntas frecuentes sobre productos, servicios y precios.
- Orientarlos sobre cómo hacer un pedido en el sitio (agregar al carrito, iniciar sesión, pagar).
- Dar información general de la tienda (horarios, formas de pago, etc. si el cliente pregunta, \
  aclarando que no tienes datos exactos si no los conoces).
- Si el cliente tiene una queja, reclamo, petición o sugerencia, orienta a que puede registrarla \
  en la sección "PQR" de su cuenta, y explica brevemente que ahí podrá ver el estado y la respuesta.

Reglas:
- Responde siempre en español, de forma breve, cálida y cercana (máximo 4-5 líneas).
- Nunca inventes precios, promociones o políticas que no te hayan dado explícitamente.
- Si no sabes algo con certeza, dilo honestamente y sugiere contactar al equipo o revisar el sitio.
"""


def _usuario_desde_token(request: Request, db: Session) -> Optional[Usuario]:
    """Autenticación opcional: si viene un Bearer token válido, identifica al
    usuario; si no viene o es inválido, el chat sigue funcionando como anónimo."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1]
    try:
        payload = decodificar_token(token)
        correo = payload.get("sub")
        if not correo:
            return None
        return db.query(Usuario).filter(Usuario.correo == correo).first()
    except Exception:
        return None


@router.post("")
def enviar_mensaje(
    datos: ChatMensajeCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    usuario_actual = _usuario_desde_token(request, db)

    if datos.conversacion_id:
        conversacion = (
            db.query(Conversacion)
            .options(joinedload(Conversacion.mensajes))
            .filter(Conversacion.id == datos.conversacion_id)
            .first()
        )
        if not conversacion:
            raise HTTPException(status_code=404, detail="Conversación no encontrada")
    else:
        conversacion = Conversacion(usuario_id=usuario_actual.id if usuario_actual else None)
        db.add(conversacion)
        db.commit()
        db.refresh(conversacion)

    mensaje_usuario = Mensaje(
        conversacion_id=conversacion.id, rol="usuario", contenido=datos.mensaje
    )
    db.add(mensaje_usuario)
    db.commit()

    historial = (
        db.query(Mensaje)
        .filter(Mensaje.conversacion_id == conversacion.id)
        .order_by(Mensaje.creado_en)
        .all()
    )

    # Gemini usa "user" y "model" como roles (no "assistant" como OpenAI).
    contenidos = [
        types.Content(
            role=("user" if m.rol == "usuario" else "model"),
            parts=[types.Part(text=m.contenido)],
        )
        for m in historial
    ]

    try:
        cliente = _obtener_cliente_gemini()
        respuesta = cliente.models.generate_content(
            model="gemini-3.6-flash",
            contents=contenidos,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                max_output_tokens=400,
                temperature=0.6,
                thinking_config=types.ThinkingConfig(thinking_budget=0),
            ),
        )
        texto_respuesta = respuesta.text
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Error al conectar con el servicio de IA: {str(e)}"
        )

    mensaje_asistente = Mensaje(
        conversacion_id=conversacion.id, rol="asistente", contenido=texto_respuesta
    )
    db.add(mensaje_asistente)
    db.commit()

    return {
        "conversacion_id": conversacion.id,
        "respuesta": texto_respuesta,
    }


@router.get("/conversaciones/{id_conversacion}")
def obtener_conversacion(id_conversacion: int, db: Session = Depends(get_db)):
    conversacion = (
        db.query(Conversacion)
        .options(joinedload(Conversacion.mensajes))
        .filter(Conversacion.id == id_conversacion)
        .first()
    )
    if not conversacion:
        raise HTTPException(status_code=404, detail="Conversación no encontrada")

    return {
        "id": conversacion.id,
        "mensajes": [
            {"rol": m.rol, "contenido": m.contenido, "creado_en": m.creado_en}
            for m in conversacion.mensajes
        ],
    }