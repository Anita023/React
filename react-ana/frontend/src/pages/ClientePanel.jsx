import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/Admin/DashboardLayout";
import { misPedidos, obtenerPerfil, actualizarUsuario } from "../lib/api";
import DashboardCliente from "./DashboardCliente";
import MisPQR from "./MisPQR";

const ETIQUETAS_DOCUMENTO = {
  CC: "Cédula de ciudadanía",
  TI: "Tarjeta de identidad",
  CE: "Cédula de extranjería",
  PA: "Pasaporte",
};

const ESTILOS_ESTADO = {
  pendiente: "bg-cream text-caramel-deep",
  en_proceso: "bg-skyblue-soft text-skyblue-deep",
  entregado: "bg-pistachio-soft text-pistachio-deep",
  cancelado: "bg-strawberry-soft text-strawberry-deep",
};

const SECCIONES = [
  { id: "dashboard", etiqueta: "Dashboard", icono: "📊" },
  { id: "pedidos", etiqueta: "Mis pedidos", icono: "🧾" },
  { id: "pqr", etiqueta: "PQR", icono: "📨" },
  { id: "datos", etiqueta: "Mis datos", icono: "👤" },
];

export default function ClientePanel() {
  const { token, usuario, cerrarSesion } = useAuth();

  const [seccionActiva, setSeccionActiva] = useState("dashboard");
  const [perfil, setPerfil] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

  const [editandoDatos, setEditandoDatos] = useState(false);
  const [formularioDatos, setFormularioDatos] = useState(null);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState("");
  const [mensajeDatos, setMensajeDatos] = useState("");

  useEffect(() => {
    Promise.all([obtenerPerfil(token), misPedidos(token)])
      .then(([datosPerfil, datosPedidos]) => {
        setPerfil(datosPerfil.usuario);
        setPedidos(datosPedidos.pedidos);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [token]);

  // Mientras carga el perfil completo, usamos lo que ya hay en la sesión
  const nombre = perfil?.nombre ?? usuario?.nombre;
  const apellido = perfil?.apellido ?? usuario?.apellido;

  function iniciarEdicionDatos() {
    setFormularioDatos({
      nombre: nombre || "",
      apellido: apellido || "",
      correo: usuario?.correo || "",
      telefono: perfil?.telefono || "",
      direccion: perfil?.direccion || "",
    });
    setErrorDatos("");
    setMensajeDatos("");
    setEditandoDatos(true);
  }

  function cancelarEdicionDatos() {
    setEditandoDatos(false);
    setFormularioDatos(null);
    setErrorDatos("");
  }

  function manejarCambioDatos(e) {
    const { name, value } = e.target;
    setFormularioDatos((prev) => ({ ...prev, [name]: value }));
  }

  async function guardarDatos(e) {
    e.preventDefault();
    if (!perfil?.id) return;

    setGuardandoDatos(true);
    setErrorDatos("");
    setMensajeDatos("");

    try {
      const datosActualizados = await actualizarUsuario(token, perfil.id, formularioDatos);
      setPerfil((prev) => ({ ...prev, ...(datosActualizados.usuario || formularioDatos) }));
      setMensajeDatos("Tus datos se actualizaron correctamente.");
      setEditandoDatos(false);
    } catch (err) {
      setErrorDatos(err.message);
    } finally {
      setGuardandoDatos(false);
    }
  }

  return (
    <DashboardLayout
      rolEtiqueta="Cliente"
      nombreUsuario={nombre || usuario?.correo}
      secciones={SECCIONES}
      seccionActiva={seccionActiva}
      onCambiarSeccion={setSeccionActiva}
      breadcrumb="Sweet Ice"
      tituloPagina={SECCIONES.find((s) => s.id === seccionActiva)?.etiqueta}
      onCerrarSesion={cerrarSesion}
    >
      {error && <p className="mb-4 text-sm text-strawberry-deep">{error}</p>}

      {seccionActiva === "dashboard" && <DashboardCliente />}

      {seccionActiva === "pqr" && <MisPQR />}

      {seccionActiva === "datos" && (
        <div className="overflow-hidden rounded-3xl border border-border-soft bg-white shadow-lift">
          <div className="flex items-center justify-between bg-strawberry-soft px-7 py-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-strawberry-deep hover:bg-strawberry font-display text-xl font-bold text-white shadow-soft">
                {(nombre || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-choco">
                  {nombre} {apellido}
                </h2>
                <p className="text-sm text-choco-soft">Cliente Sweet Ice</p>
              </div>
            </div>

            {!cargando && !editandoDatos && (
              <button
                onClick={iniciarEdicionDatos}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-strawberry-deep hover:bg-strawberry px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                ✎ Editar
              </button>
            )}
          </div>

          <div className="p-7">
            {mensajeDatos && (
              <p className="mb-5 rounded-xl bg-pistachio-soft px-4 py-2.5 text-sm font-semibold text-pistachio-deep">
                ✓ {mensajeDatos}
              </p>
            )}

            {cargando ? (
              <p className="text-sm text-choco-soft">Cargando tus datos...</p>
            ) : editandoDatos ? (
              <form onSubmit={guardarDatos} className="grid gap-5 text-sm sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-strawberry-deep">
                    Nombre
                  </label>
                  <input
                    name="nombre"
                    value={formularioDatos.nombre}
                    onChange={manejarCambioDatos}
                    required
                    minLength={2}
                    className="w-full rounded-xl border border-border-soft bg-cream/40 px-4 py-2.5 text-sm text-choco transition-colors focus:border-strawberry-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-strawberry-soft"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-strawberry-deep">
                    Apellido
                  </label>
                  <input
                    name="apellido"
                    value={formularioDatos.apellido}
                    onChange={manejarCambioDatos}
                    required
                    minLength={2}
                    className="w-full rounded-xl border border-border-soft bg-cream/40 px-4 py-2.5 text-sm text-choco transition-colors focus:border-strawberry-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-strawberry-soft"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-strawberry-deep">
                    Correo
                  </label>
                  <input
                    type="email"
                    name="correo"
                    value={formularioDatos.correo}
                    onChange={manejarCambioDatos}
                    required
                    className="w-full rounded-xl border border-border-soft bg-cream/40 px-4 py-2.5 text-sm text-choco transition-colors focus:border-strawberry-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-strawberry-soft"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-strawberry-deep">
                    Teléfono
                  </label>
                  <input
                    name="telefono"
                    value={formularioDatos.telefono}
                    onChange={manejarCambioDatos}
                    className="w-full rounded-xl border border-border-soft bg-cream/40 px-4 py-2.5 text-sm text-choco transition-colors focus:border-strawberry-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-strawberry-soft"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-strawberry-deep">
                    Dirección
                  </label>
                  <input
                    name="direccion"
                    value={formularioDatos.direccion}
                    onChange={manejarCambioDatos}
                    className="w-full rounded-xl border border-border-soft bg-cream/40 px-4 py-2.5 text-sm text-choco transition-colors focus:border-strawberry-deep focus:bg-white focus:outline-none focus:ring-2 focus:ring-strawberry-soft"
                  />
                </div>

                {errorDatos && (
                  <p className="rounded-xl bg-strawberry-soft px-4 py-2.5 text-sm font-semibold text-strawberry-deep sm:col-span-2">
                    {errorDatos}
                  </p>
                )}

                <div className="flex gap-3 pt-2 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={guardandoDatos}
                    className="rounded-full bg-strawberry-deep hover:bg-strawberry px-6 py-3 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {guardandoDatos ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelarEdicionDatos}
                    className="rounded-full border border-border-soft bg-white px-6 py-3 text-sm font-semibold text-choco transition-colors hover:bg-cream-soft"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <dl className="grid gap-5 text-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-cream/50 p-4">
                  <dt className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-choco-soft">
                    👤 Nombre
                  </dt>
                  <dd className="font-semibold text-choco">
                    {nombre} {apellido}
                  </dd>
                </div>
                <div className="rounded-2xl bg-cream/50 p-4">
                  <dt className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-choco-soft">
                    ✉️ Correo
                  </dt>
                  <dd className="font-semibold text-choco">{usuario?.correo}</dd>
                </div>
                {perfil?.tipo_documento && (
                  <div className="rounded-2xl bg-cream/50 p-4">
                    <dt className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-choco-soft">
                      🪪 Documento
                    </dt>
                    <dd className="font-semibold text-choco">
                      {ETIQUETAS_DOCUMENTO[perfil.tipo_documento] || perfil.tipo_documento}{" "}
                      #{perfil.numero_documento}
                    </dd>
                  </div>
                )}
                {perfil?.telefono && (
                  <div className="rounded-2xl bg-cream/50 p-4">
                    <dt className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-choco-soft">
                      📞 Teléfono
                    </dt>
                    <dd className="font-semibold text-choco">{perfil.telefono}</dd>
                  </div>
                )}
                {perfil?.direccion && (
                  <div className="rounded-2xl bg-cream/50 p-4 sm:col-span-2">
                    <dt className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-choco-soft">
                      📍 Dirección
                    </dt>
                    <dd className="font-semibold text-choco">{perfil.direccion}</dd>
                  </div>
                )}
            </dl>
          )}
          </div>
        </div>
      )}

      {seccionActiva === "pedidos" && (
        <div className="space-y-3">
          {cargando && (
            <p className="text-sm text-choco-soft">Cargando tus pedidos...</p>
          )}

          {!cargando && pedidos.length === 0 && (
            <div className="rounded-xl border border-dashed border-border-soft bg-white p-8 text-center">
              <p className="text-sm text-choco-soft">
                Todavía no has hecho ningún pedido.
              </p>
              <Link
                to="/"
                className="mt-3 inline-block text-sm font-semibold text-skyblue-deep hover:underline"
              >
                Ver el menú →
              </Link>
            </div>
          )}

          {pedidos.map((pedido) => {
            const expandido = pedidoExpandido === pedido.id;
            return (
              <div
                key={pedido.id}
                className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-soft transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() => setPedidoExpandido(expandido ? null : pedido.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={expandido}
                >
                  <div>
                    <p className="font-medium text-choco">Pedido #{pedido.id}</p>
                    <p className="text-sm text-choco-soft">
                      {new Date(pedido.creado_en).toLocaleDateString("es-CO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        ESTILOS_ESTADO[pedido.estado] || "bg-cream"
                      }`}
                    >
                      {pedido.estado}
                    </span>
                    <p className="font-display text-base font-semibold text-choco">
                      ${Number(pedido.total).toLocaleString("es-CO")}
                    </p>
                    <span
                      className={`text-choco-soft transition-transform duration-200 ${
                        expandido ? "rotate-180" : ""
                      }`}
                    >
                      ⌄
                    </span>
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-200 ease-out ${
                    expandido ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex items-center justify-between border-t border-border-soft bg-cream/40 px-5 py-3">
                      <p className="text-sm text-choco-soft">
                        Consulta el detalle completo y descarga tu comprobante.
                      </p>
                      <Link
                        to={`/factura/${pedido.id}`}
                        className="whitespace-nowrap text-sm font-semibold text-skyblue-deep hover:underline"
                      >
                        Ver factura →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}