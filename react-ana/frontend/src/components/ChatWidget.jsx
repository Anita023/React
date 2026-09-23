import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { enviarMensajeChat } from "../lib/api";

const MENSAJE_BIENVENIDA = {
  rol: "asistente",
  contenido:
    "¡Hola! 🍦 Soy el asistente de Sweet Ice. Puedo ayudarte con información sobre productos, servicios, cómo hacer un pedido, o si quieres registrar una petición, queja o reclamo. ¿En qué te ayudo?",
};

/** Ícono de robot con helado, dibujado en SVG (sin depender de ningún
 * archivo de imagen externo). `size` controla el tamaño en px. */
function RobotHeladoIcon({ size = 30 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Antena */}
      <line x1="32" y1="14" x2="32" y2="6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />

      {/* Helado en la punta de la antena (cono + bola) */}
      <circle cx="32" cy="4" r="4.5" fill="#fbcfe8" />
      <path d="M28.5 5 L35.5 5 L32 10 Z" fill="#deb887" />

      {/* Cabeza del robot */}
      <rect x="12" y="14" width="40" height="32" rx="10" fill="#fff" />
      <rect x="12" y="14" width="40" height="32" rx="10" stroke="#db2777" strokeWidth="2" />

      {/* Ojos */}
      <circle cx="24" cy="30" r="4" fill="#db2777" />
      <circle cx="40" cy="30" r="4" fill="#db2777" />
      <circle cx="25.3" cy="28.7" r="1.1" fill="#fff" />
      <circle cx="41.3" cy="28.7" r="1.1" fill="#fff" />

      {/* Sonrisa */}
      <path
        d="M22 37 Q32 44 42 37"
        stroke="#db2777"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Mejillas */}
      <circle cx="17" cy="34" r="2.4" fill="#fbcfe8" />
      <circle cx="47" cy="34" r="2.4" fill="#fbcfe8" />

      {/* Antenitas laterales tipo orejas */}
      <rect x="8" y="24" width="4" height="10" rx="2" fill="#db2777" />
      <rect x="52" y="24" width="4" height="10" rx="2" fill="#db2777" />
    </svg>
  );
}

export default function ChatWidget() {
  const { token } = useAuth();

  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([MENSAJE_BIENVENIDA]);
  const [conversacionId, setConversacionId] = useState(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const finDeMensajesRef = useRef(null);

  useEffect(() => {
    if (abierto) {
      finDeMensajesRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, abierto]);

  async function manejarEnvio(e) {
    e.preventDefault();
    const mensajeUsuario = texto.trim();
    if (!mensajeUsuario || enviando) return;

    setMensajes((prev) => [...prev, { rol: "usuario", contenido: mensajeUsuario }]);
    setTexto("");
    setEnviando(true);
    setError("");

    try {
      const datos = await enviarMensajeChat(mensajeUsuario, conversacionId, token);
      setConversacionId(datos.conversacion_id);
      setMensajes((prev) => [...prev, { rol: "asistente", contenido: datos.respuesta }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      {/* Botón flotante para abrir/cerrar — apilado sobre el de WhatsApp */}
      <button
        onClick={() => setAbierto((prev) => !prev)}
        aria-label={abierto ? "Cerrar chat" : "Abrir chat de ayuda"}
        className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#db2777] text-2xl text-white shadow-lift ring-4 ring-white/40 transition-all hover:-translate-y-0.5 sm:bottom-28 sm:right-8"
      >
        {abierto ? "✕" : <RobotHeladoIcon size={32} />}
      </button>

      {abierto && (
        <div className="fixed bottom-[184px] right-6 z-40 flex h-[480px] w-[340px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-[#f1e4d8] bg-white shadow-2xl sm:right-8">
          {/* Encabezado */}
          <div className="flex items-center gap-2 bg-[#db2777] px-4 py-3 text-white">
            <RobotHeladoIcon size={26} />
            <div>
              <p className="text-sm font-semibold leading-tight">Sweet Ice</p>
              <p className="text-xs leading-tight text-white/80">Asistente virtual</p>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#fff8f0] p-4">
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.rol === "usuario" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.rol === "usuario"
                      ? "bg-[#db2777] text-white"
                      : "bg-white text-[#3f2a1d] shadow-sm"
                  }`}
                >
                  {m.contenido}
                </div>
              </div>
            ))}

            {enviando && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-3.5 py-2 text-sm text-[#8a7361] shadow-sm">
                  Escribiendo...
                </div>
              </div>
            )}

            {error && (
              <p className="text-center text-xs font-semibold text-[#be123c]">{error}</p>
            )}

            <div ref={finDeMensajesRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={manejarEnvio}
            className="flex items-center gap-2 border-t border-[#f1e4d8] bg-white p-3"
          >
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu mensaje..."
              disabled={enviando}
              className="flex-1 rounded-full border border-[#f1e4d8] px-4 py-2 text-sm text-[#3f2a1d] outline-none focus:border-[#db2777]"
            />
            <button
              type="submit"
              disabled={enviando || !texto.trim()}
              aria-label="Enviar mensaje"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#db2777] text-white disabled:opacity-50"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}