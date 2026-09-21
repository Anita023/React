import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PanelToolbar from "../../components/Admin/PanelToolbar";
import PanelModal from "../../components/Admin/PanelModal";
import {
  listarTodosLosPedidos,
  actualizarEstadoPedido,
  crearPedidoManual,
  obtenerProductosAdmin,
} from "../../lib/api";

const ESTADOS = ["pendiente", "en_proceso", "entregado", "cancelado"];

const OPCIONES_ESTADO = [
  { value: "todos", etiqueta: "Todos los estados" },
  ...ESTADOS.map((estado) => ({ value: estado, etiqueta: estado })),
];

const ESTILOS_ESTADO = {
  pendiente: "bg-cream text-caramel-deep",
  en_proceso: "bg-skyblue-soft text-skyblue-deep",
  entregado: "bg-pistachio-soft text-pistachio-deep",
  cancelado: "bg-strawberry-soft text-strawberry-deep",
};

let contadorLinea = 0;
function lineaVacia() {
  contadorLinea += 1;
  return { clave: contadorLinea, producto_id: "", cantidad: 1, tocada: false };
}

export default function AdminPedidos({
  abrirCrearInicial = false,
  onConsumirCrearInicial,
}) {
  const { token } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [productos, setProductos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [correoCliente, setCorreoCliente] = useState("");
  const [lineas, setLineas] = useState([lineaVacia()]);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [correoTocado, setCorreoTocado] = useState(false);

  const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const errorCorreo = correoCliente.trim()
    ? REGEX_CORREO.test(correoCliente.trim())
      ? ""
      : "Ingresa un correo válido"
    : "El correo del cliente es obligatorio";

  async function cargarPedidos() {
    setCargando(true);
    try {
      const datos = await listarTodosLosPedidos(token);
      setPedidos(datos.pedidos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (abrirCrearInicial) {
      abrirFormulario();
      onConsumirCrearInicial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abrirCrearInicial]);

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return pedidos.filter((pedido) => {
      const nombreCliente = pedido.nombre
        ? `${pedido.nombre} ${pedido.apellido || ""}`
        : pedido.correo;
      const coincideTexto =
        !texto ||
        nombreCliente.toLowerCase().includes(texto) ||
        String(pedido.id).includes(texto);
      const coincideEstado =
        filtroEstado === "todos" || pedido.estado === filtroEstado;
      return coincideTexto && coincideEstado;
    });
  }, [pedidos, busqueda, filtroEstado]);

  async function manejarCambioEstado(id, nuevoEstado) {
    setMensaje("");
    setError("");
    try {
      const datos = await actualizarEstadoPedido(token, id, nuevoEstado);
      setMensaje(
        datos?.venta_id
          ? `Estado actualizado y venta #${datos.venta_id} registrada`
          : "Estado del pedido actualizado"
      );
      if (datos?.aviso) setError(datos.aviso);
      cargarPedidos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function abrirFormulario() {
    setCorreoCliente("");
    setCorreoTocado(false);
    setLineas([lineaVacia()]);
    setErrorFormulario("");
    setMostrarFormulario(true);
    if (productos.length === 0) {
      try {
        const datos = await obtenerProductosAdmin(token);
        setProductos(datos.productos.filter((p) => p.disponible));
      } catch (err) {
        setErrorFormulario(err.message);
      }
    }
  }

  function cerrarFormulario() {
    setMostrarFormulario(false);
  }

  function actualizarLinea(clave, campo, valor) {
    setLineas((prev) =>
      prev.map((linea) =>
        linea.clave === clave ? { ...linea, [campo]: valor, tocada: true } : linea
      )
    );
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, lineaVacia()]);
  }

  function quitarLinea(clave) {
    setLineas((prev) =>
      prev.length > 1 ? prev.filter((linea) => linea.clave !== clave) : prev
    );
  }

  const totalEstimado = useMemo(() => {
    return lineas.reduce((suma, linea) => {
      const producto = productos.find(
        (p) => String(p.id) === String(linea.producto_id)
      );
      if (!producto) return suma;
      return suma + Number(producto.precio) * Number(linea.cantidad || 0);
    }, 0);
  }, [lineas, productos]);

  function errorLinea(linea) {
    if (!linea.producto_id) return "Selecciona un producto";
    if (!linea.cantidad || Number(linea.cantidad) < 1) return "Cantidad mínima: 1";
    return "";
  }

  const lineasValidas = lineas.every((linea) => !errorLinea(linea));
  const formularioValido = !errorCorreo && lineasValidas;

  async function manejarEnvioFormulario(e) {
    e.preventDefault();
    setErrorFormulario("");
    setCorreoTocado(true);

    if (!formularioValido) {
      setErrorFormulario("Revisa los campos marcados en rojo.");
      setLineas((prev) => prev.map((linea) => ({ ...linea, tocada: true })));
      return;
    }

    const items = lineas.map((linea) => ({
      producto_id: Number(linea.producto_id),
      cantidad: Number(linea.cantidad),
    }));

    setEnviando(true);
    try {
      await crearPedidoManual(token, { correo_cliente: correoCliente, items });
      setMensaje("Pedido creado correctamente");
      cerrarFormulario();
      cargarPedidos();
    } catch (err) {
      setErrorFormulario(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <PanelToolbar
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        placeholderBusqueda="Buscar por cliente o # de pedido..."
        filtro={filtroEstado}
        onCambiarFiltro={setFiltroEstado}
        opcionesFiltro={OPCIONES_ESTADO}
        textoAccion="Agregar pedido"
        onAccion={abrirFormulario}
      />

      {mensaje && <p className="mb-4 text-sm text-pistachio-deep">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-strawberry-deep">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-soft">
        {cargando ? (
          <p className="p-6 text-sm text-choco-soft">Cargando pedidos...</p>
        ) : pedidosFiltrados.length === 0 ? (
          <p className="p-6 text-sm text-choco-soft">
            {pedidos.length === 0
              ? "Todavía no hay pedidos registrados."
              : "No se encontraron pedidos con esos filtros."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-pistachio-soft bg-pistachio-soft text-left text-xs uppercase tracking-wide text-pistachio-deep/70">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Factura</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((pedido) => (
                  <tr
                    key={pedido.id}
                    className="border-b border-border-soft last:border-0 hover:bg-cream/40"
                  >
                    <td className="px-4 py-3 text-choco-soft">{pedido.id}</td>
                    <td className="px-4 py-3 font-medium text-choco">
                      {pedido.nombre ? `${pedido.nombre} ${pedido.apellido}` : pedido.correo}
                    </td>
                    <td className="px-4 py-3 text-choco-soft">
                      ${Number(pedido.total).toLocaleString("es-CO")}
                    </td>
                    <td className="px-4 py-3 text-choco-soft">
                      {new Date(pedido.creado_en).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={pedido.estado}
                        onChange={(e) => manejarCambioEstado(pedido.id, e.target.value)}
                        className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${
                          ESTILOS_ESTADO[pedido.estado] || "bg-cream"
                        }`}
                      >
                        {ESTADOS.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/factura/${pedido.id}`}
                        className="text-skyblue-deep hover:underline"
                      >
                        Ver factura
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PanelModal
        abierto={mostrarFormulario}
        titulo="Agregar pedido"
        subtitulo="Regístralo a nombre de un cliente ya existente."
        onCerrar={cerrarFormulario}
      >
        <form onSubmit={manejarEnvioFormulario} className="grid gap-4">
          {/* Tarjeta: cliente */}
          <div className="rounded-xl border border-skyblue-soft bg-skyblue-soft/60 p-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-skyblue-deep/70">
              Cliente
            </label>
            <input
              type="email"
              value={correoCliente}
              onChange={(e) => setCorreoCliente(e.target.value)}
              onBlur={() => setCorreoTocado(true)}
              placeholder="correo@cliente.com"
              className={`w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none ${
                correoTocado && errorCorreo
                  ? "border-strawberry-deep focus:border-strawberry-deep"
                  : "border-skyblue-soft focus:border-skyblue"
              }`}
            />
            {correoTocado && errorCorreo && (
              <p className="mt-1 text-xs text-strawberry-deep">{errorCorreo}</p>
            )}
          </div>

          {/* Tarjeta: productos */}
          <div className="rounded-xl border border-strawberry-soft bg-strawberry-soft/50 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-strawberry-deep/70">
              Productos
            </label>

            <div className="space-y-2">
              {lineas.map((linea) => {
                const mensajeErrorLinea = errorLinea(linea);
                const mostrarError = linea.tocada && mensajeErrorLinea;
                return (
                  <div key={linea.clave}>
                    <div
                      className={`flex gap-2 rounded-lg border bg-white p-2 shadow-sm ${
                        mostrarError ? "border-strawberry-deep" : "border-strawberry-soft"
                      }`}
                    >
                      <select
                        value={linea.producto_id}
                        onChange={(e) =>
                          actualizarLinea(linea.clave, "producto_id", e.target.value)
                        }
                        className="flex-1 rounded-lg border border-border-soft px-3 py-2 text-sm focus:border-strawberry focus:outline-none"
                      >
                        <option value="">Selecciona un producto...</option>
                        {productos.map((producto) => (
                          <option key={producto.id} value={producto.id}>
                            {producto.nombre} — $
                            {Number(producto.precio).toLocaleString("es-CO")}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={linea.cantidad}
                        onChange={(e) =>
                          actualizarLinea(linea.clave, "cantidad", e.target.value)
                        }
                        className="w-16 rounded-lg border border-border-soft px-2 py-2 text-center text-sm focus:border-strawberry focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => quitarLinea(linea.clave)}
                        disabled={lineas.length === 1}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-strawberry transition hover:bg-strawberry-soft disabled:opacity-30"
                        aria-label="Quitar producto"
                      >
                        ✕
                      </button>
                    </div>
                    {mostrarError && (
                      <p className="mt-1 text-xs text-strawberry-deep">
                        {mensajeErrorLinea}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={agregarLinea}
              className="mt-3 w-full rounded-lg border border-dashed border-strawberry-soft py-2 text-sm font-semibold text-strawberry-deep transition hover:bg-strawberry-soft/60"
            >
              + Agregar otro producto
            </button>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-xl bg-strawberry-soft px-4 py-3">
            <span className="text-sm font-medium text-choco-soft">
              Total estimado
            </span>
            <span className="font-display text-xl font-semibold text-choco">
              ${totalEstimado.toLocaleString("es-CO")}
            </span>
          </div>

          {errorFormulario && (
            <p className="text-sm text-strawberry-deep">{errorFormulario}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={enviando || (correoTocado && !formularioValido)}
              className="rounded-lg bg-strawberry-deep hover:bg-strawberry px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:opacity-60"
            >
              {enviando ? "Creando..." : "Crear pedido"}
            </button>
            <button
              type="button"
              onClick={cerrarFormulario}
              className="rounded-lg border border-border-soft px-4 py-2 text-sm hover:bg-cream"
            >
              Cancelar
            </button>
          </div>
        </form>
      </PanelModal>
    </div>
  );
}