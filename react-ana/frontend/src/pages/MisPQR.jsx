import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { crearPQR, misPQR } from "../lib/api";

const OPCIONES_TIPO = [
  { value: "peticion", etiqueta: "Petición" },
  { value: "queja", etiqueta: "Queja" },
  { value: "reclamo", etiqueta: "Reclamo" },
  { value: "sugerencia", etiqueta: "Sugerencia" },
];

const ESTILOS_ESTADO = {
  pendiente: "bg-cream text-caramel-deep",
  en_proceso: "bg-skyblue-soft text-skyblue-deep",
  respondida: "bg-pistachio-soft text-pistachio-deep",
  cerrada: "bg-border-soft text-choco-soft",
};

const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  respondida: "Respondida",
  cerrada: "Cerrada",
};

const FORMULARIO_VACIO = { tipo: "peticion", asunto: "", descripcion: "" };

export default function MisPQR() {
  const { token } = useAuth();

  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function cargarLista() {
    setCargando(true);
    misPQR(token)
      .then((datos) => setLista(datos.pqr))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function manejarCambio(e) {
    const { name, value } = e.target;
    setFormulario((prev) => ({ ...prev, [name]: value }));
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setError("");
    setMensaje("");
    setEnviando(true);
    try {
      await crearPQR(token, formulario);
      setMensaje("Tu solicitud fue registrada. Te responderemos pronto.");
      setFormulario(FORMULARIO_VACIO);
      setMostrarFormulario(false);
      cargarLista();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-choco-soft">
          Registra peticiones, quejas, reclamos o sugerencias, y consulta su estado aquí.
        </p>
        <button
          onClick={() => setMostrarFormulario((prev) => !prev)}
          className={
            mostrarFormulario
              ? "whitespace-nowrap rounded-full border border-border-soft bg-white px-5 py-2.5 text-sm font-bold text-choco shadow-sm transition-all hover:bg-cream-soft"
              : "whitespace-nowrap rounded-full bg-strawberry-deep hover:bg-strawberry px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          }
        >
          {mostrarFormulario ? "Cancelar" : "+ Nueva solicitud"}
        </button>
      </div>

      {mensaje && <p className="mb-4 text-sm font-semibold text-pistachio-deep">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-strawberry-deep">{error}</p>}

      {mostrarFormulario && (
        <form
          onSubmit={manejarEnvio}
          className="mb-6 grid gap-3 rounded-2xl border border-border-soft bg-white p-6 shadow-lift sm:grid-cols-2"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Tipo
            </label>
            <select
              name="tipo"
              value={formulario.tipo}
              onChange={manejarCambio}
              className="w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
            >
              {OPCIONES_TIPO.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Asunto
            </label>
            <input
              name="asunto"
              value={formulario.asunto}
              onChange={manejarCambio}
              placeholder="Resumen breve"
              required
              minLength={3}
              className="w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={manejarCambio}
              placeholder="Cuéntanos con detalle qué pasó"
              required
              minLength={5}
              rows={4}
              className="w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-strawberry-deep hover:bg-strawberry px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {cargando && <p className="text-sm text-choco-soft">Cargando tus solicitudes...</p>}

        {!cargando && lista.length === 0 && (
          <div className="rounded-xl border border-dashed border-border-soft bg-white p-8 text-center">
            <p className="text-sm text-choco-soft">
              No has registrado ninguna PQR todavía.
            </p>
          </div>
        )}

        {lista.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border-soft border-l-4 border-l-strawberry bg-white p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="mr-2 rounded-full bg-strawberry-soft px-2.5 py-0.5 text-xs font-bold capitalize text-strawberry-deep">
                  {item.tipo}
                </span>
                <span className="font-semibold text-choco">{item.asunto}</span>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-bold ${ESTILOS_ESTADO[item.estado] || ""}`}
              >
                {ETIQUETAS_ESTADO[item.estado] || item.estado}
              </span>
            </div>

            <p className="text-sm text-choco-soft">{item.descripcion}</p>

            {item.respuesta && (
              <div className="mt-3 rounded-xl bg-pistachio-soft/60 p-3">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-pistachio-deep">
                  💬 Respuesta de Sweet Ice
                </p>
                <p className="text-sm text-choco">{item.respuesta}</p>
              </div>
            )}

            <p className="mt-3 text-xs text-choco-soft">
              {item.creado_en &&
                new Date(item.creado_en).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}