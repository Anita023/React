import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listarPQR, responderPQR, cambiarEstadoPQR } from "../../lib/api";

const ESTILOS_ESTADO = {
  pendiente: "bg-caramel-soft text-caramel-deep",
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

const OPCIONES_ESTADO_FILTRO = [
  { value: "", etiqueta: "Todos los estados" },
  { value: "pendiente", etiqueta: "Pendiente" },
  { value: "en_proceso", etiqueta: "En proceso" },
  { value: "respondida", etiqueta: "Respondida" },
  { value: "cerrada", etiqueta: "Cerrada" },
];

export default function AdminPQR() {
  const { token } = useAuth();

  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [pqrEnRespuesta, setPqrEnRespuesta] = useState(null);
  const [textoRespuesta, setTextoRespuesta] = useState("");
  const [estadoRespuesta, setEstadoRespuesta] = useState("respondida");
  const [enviando, setEnviando] = useState(false);

  function cargarLista() {
    setCargando(true);
    listarPQR(token, { estado: filtroEstado || undefined })
      .then((datos) => setLista(datos.pqr))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarLista();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroEstado]);

  function abrirRespuesta(item) {
    setPqrEnRespuesta(item);
    setTextoRespuesta(item.respuesta || "");
    setEstadoRespuesta("respondida");
    setMensaje("");
  }

  async function marcarEnProceso(item) {
    try {
      await cambiarEstadoPQR(token, item.id, "en_proceso");
      cargarLista();
    } catch (err) {
      setError(err.message);
    }
  }

  async function enviarRespuesta(e) {
    e.preventDefault();
    if (!pqrEnRespuesta) return;
    setEnviando(true);
    setError("");
    try {
      await responderPQR(token, pqrEnRespuesta.id, textoRespuesta, estadoRespuesta);
      setMensaje("Respuesta guardada correctamente");
      setPqrEnRespuesta(null);
      cargarLista();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-choco-soft">
          Gestiona las peticiones, quejas, reclamos y sugerencias de los clientes.
        </p>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border border-border-soft px-3 py-2 text-sm"
        >
          {OPCIONES_ESTADO_FILTRO.map((op) => (
            <option key={op.value} value={op.value}>
              {op.etiqueta}
            </option>
          ))}
        </select>
      </div>

      {mensaje && <p className="mb-4 text-sm font-semibold text-pistachio-deep">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-strawberry-deep">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-soft">
        {cargando ? (
          <p className="p-6 text-sm text-choco-soft">Cargando...</p>
        ) : lista.length === 0 ? (
          <p className="p-6 text-sm text-choco-soft">
            No hay PQR con este filtro.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-strawberry-soft bg-strawberry-soft text-left text-xs uppercase tracking-wide text-strawberry-deep/70">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Asunto</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border-soft last:border-0 hover:bg-cream/40"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-choco">{item.usuario_nombre}</p>
                      <p className="text-xs text-choco-soft">{item.usuario_correo}</p>
                    </td>
                    <td className="px-4 py-3 capitalize text-choco-soft">{item.tipo}</td>
                    <td className="max-w-xs px-4 py-3 text-choco">{item.asunto}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILOS_ESTADO[item.estado] || ""}`}
                      >
                        {ETIQUETAS_ESTADO[item.estado] || item.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-choco-soft">
                      {item.creado_en &&
                        new Date(item.creado_en).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                        })}
                    </td>
                    <td className="space-x-3 px-4 py-3">
                      {item.estado === "pendiente" && (
                        <button
                          onClick={() => marcarEnProceso(item)}
                          className="text-skyblue-deep hover:underline"
                        >
                          Marcar en proceso
                        </button>
                      )}
                      <button
                        onClick={() => abrirRespuesta(item)}
                        className="text-strawberry-deep hover:underline"
                      >
                        {item.respuesta ? "Ver / editar" : "Responder"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Panel modal simple para responder */}
      {pqrEnRespuesta && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-choco/45 p-4"
          onClick={() => setPqrEnRespuesta(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-1 font-display text-lg font-semibold text-choco">
              {pqrEnRespuesta.asunto}
            </h3>
            <p className="mb-4 text-sm text-choco-soft">
              {pqrEnRespuesta.usuario_nombre} · {pqrEnRespuesta.usuario_correo}
            </p>
            <p className="mb-4 rounded-lg bg-cream/60 p-3 text-sm text-choco">
              {pqrEnRespuesta.descripcion}
            </p>

            <form onSubmit={enviarRespuesta} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-choco-soft">
                  Respuesta
                </label>
                <textarea
                  value={textoRespuesta}
                  onChange={(e) => setTextoRespuesta(e.target.value)}
                  required
                  minLength={3}
                  rows={4}
                  className="w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-choco-soft">
                  Estado final
                </label>
                <select
                  value={estadoRespuesta}
                  onChange={(e) => setEstadoRespuesta(e.target.value)}
                  className="w-full rounded-lg border border-border-soft px-3 py-2 text-sm"
                >
                  <option value="respondida">Respondida</option>
                  <option value="cerrada">Cerrada</option>
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-lg bg-strawberry-deep hover:bg-strawberry px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                >
                  {enviando ? "Guardando..." : "Guardar respuesta"}
                </button>
                <button
                  type="button"
                  onClick={() => setPqrEnRespuesta(null)}
                  className="rounded-lg border border-border-soft px-4 py-2 text-sm hover:bg-cream"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}