import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  listarVentas,
  crearVenta,
  actualizarEstadoVenta,
  generarFacturaDesdeVenta,
  obtenerUsuarios,
  obtenerProductosAdmin,
  obtenerServiciosAdmin,
  descargarReporteVentasPDF,
  descargarReporteVentasExcel,
  descargarBlob,
} from "../../lib/api";
import Paginacion, { paginar } from "../../components/Admin/Paginacion";

function numeroAPrecio(numero) {
  return "$" + Number(numero).toLocaleString("es-CO");
}

const ITEM_VACIO = { tipoItem: "producto", id: "", cantidad: 1 };

const ESTILOS_ESTADO = {
  pendiente: "bg-caramel-soft text-caramel-deep",
  completada: "bg-pistachio-soft text-pistachio-deep",
  anulada: "bg-strawberry-soft text-strawberry-deep",
};

export default function AdminVentas() {
  const { token } = useAuth();

  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const [filtros, setFiltros] = useState({
    fecha_inicio: "",
    fecha_fin: "",
    cliente_id: "",
    estado: "",
  });

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteIdForm, setClienteIdForm] = useState("");
  const [descuento, setDescuento] = useState("0");
  const [impuestos, setImpuestos] = useState("0");
  const [items, setItems] = useState([{ ...ITEM_VACIO }]);
  const [enviando, setEnviando] = useState(false);

  const [fechaReporte, setFechaReporte] = useState(() => new Date().toISOString().slice(0, 10));
  const [descargandoReporte, setDescargandoReporte] = useState(false);

  async function cargarVentas() {
    setCargando(true);
    setError("");
    try {
      const filtrosLimpios = Object.fromEntries(
        Object.entries(filtros).filter(([, v]) => v !== "")
      );
      const datos = await listarVentas(token, filtrosLimpios);
      setVentas(datos.ventas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarVentas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros]);

  const totalPaginas = Math.max(1, Math.ceil(ventas.length / 10));
  const ventasPaginadas = useMemo(() => paginar(ventas, paginaActual), [ventas, paginaActual]);

  useEffect(() => {
    Promise.all([
      obtenerUsuarios(token).catch(() => ({ usuarios: [] })),
      obtenerProductosAdmin(token).catch(() => ({ productos: [] })),
      obtenerServiciosAdmin(token).catch(() => ({ servicios: [] })),
    ]).then(([usuariosData, productosData, serviciosData]) => {
      setClientes(usuariosData.usuarios.filter((u) => u.rol === "cliente" && u.cliente_id));
      setProductos(productosData.productos);
      setServicios(serviciosData.servicios);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mapaClientes = useMemo(() => {
    const mapa = {};
    clientes.forEach((c) => {
      mapa[c.cliente_id] = `${c.nombre} ${c.apellido || ""}`.trim();
    });
    return mapa;
  }, [clientes]);

  function manejarCambioFiltro(e) {
    setFiltros((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function agregarItem() {
    setItems((prev) => [...prev, { ...ITEM_VACIO }]);
  }

  function quitarItem(indice) {
    setItems((prev) => prev.filter((_, i) => i !== indice));
  }

  function actualizarItem(indice, campo, valor) {
    setItems((prev) =>
      prev.map((item, i) => (i === indice ? { ...item, [campo]: valor } : item))
    );
  }

  function limpiarFormulario() {
    setClienteIdForm("");
    setDescuento("0");
    setImpuestos("0");
    setItems([{ ...ITEM_VACIO }]);
    setMostrarFormulario(false);
  }

  async function manejarCrearVenta(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!clienteIdForm) {
      setError("Selecciona un cliente");
      return;
    }
    if (items.some((it) => !it.id)) {
      setError("Selecciona un producto o servicio en cada item");
      return;
    }

    const itemsFormateados = items.map((it) => ({
      producto_id: it.tipoItem === "producto" ? Number(it.id) : null,
      servicio_id: it.tipoItem === "servicio" ? Number(it.id) : null,
      cantidad: Number(it.cantidad) || 1,
    }));

    setEnviando(true);
    try {
      await crearVenta(token, {
        cliente_id: Number(clienteIdForm),
        descuento: Number(descuento) || 0,
        impuestos: Number(impuestos) || 0,
        items: itemsFormateados,
      });
      setMensaje("Venta registrada correctamente");
      limpiarFormulario();
      cargarVentas();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function manejarGenerarFactura(venta) {
    setError("");
    setMensaje("");
    try {
      const factura = await generarFacturaDesdeVenta(token, venta.id);
      setMensaje(`Factura ${factura.numero_factura} generada correctamente`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarAnular(venta) {
    if (!window.confirm(`¿Anular la venta #${venta.id}? Esta acción no se puede deshacer.`)) return;
    try {
      await actualizarEstadoVenta(token, venta.id, "anulada");
      cargarVentas();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarDescargarReporte(formato) {
    setDescargandoReporte(true);
    setError("");
    try {
      const blob =
        formato === "pdf"
          ? await descargarReporteVentasPDF(token, fechaReporte)
          : await descargarReporteVentasExcel(token, fechaReporte);
      const extension = formato === "pdf" ? "pdf" : "xlsx";
      descargarBlob(blob, `reporte_ventas_${fechaReporte}.${extension}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDescargandoReporte(false);
    }
  }

  return (
    <div>
      {/* Sección: reporte diario */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-border-soft bg-white p-4 shadow-soft">
        <div>
          <label className="mb-1 block text-xs font-medium text-choco-soft">
            Reporte diario de ventas
          </label>
          <input
            type="date"
            value={fechaReporte}
            onChange={(e) => setFechaReporte(e.target.value)}
            className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={() => manejarDescargarReporte("pdf")}
          disabled={descargandoReporte}
          className="rounded-lg bg-strawberry-deep px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {descargandoReporte ? "Generando..." : "Descargar PDF"}
        </button>
        <button
          onClick={() => manejarDescargarReporte("excel")}
          disabled={descargandoReporte}
          className="rounded-lg border border-border-soft px-4 py-2 text-sm font-semibold text-choco disabled:opacity-60"
        >
          {descargandoReporte ? "Generando..." : "Descargar Excel"}
        </button>
      </div>

      {/* Filtros del historial */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Desde
            </label>
            <input
              type="date"
              name="fecha_inicio"
              value={filtros.fecha_inicio}
              onChange={manejarCambioFiltro}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Hasta
            </label>
            <input
              type="date"
              name="fecha_fin"
              value={filtros.fecha_fin}
              onChange={manejarCambioFiltro}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Cliente
            </label>
            <select
              name="cliente_id"
              value={filtros.cliente_id}
              onChange={manejarCambioFiltro}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {clientes.map((c) => (
                <option key={c.cliente_id} value={c.cliente_id}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Estado
            </label>
            <select
              name="estado"
              value={filtros.estado}
              onChange={manejarCambioFiltro}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setMostrarFormulario((prev) => !prev)}
          className="whitespace-nowrap rounded-full bg-strawberry-deep px-4 py-2 text-sm font-semibold text-white shadow-sm"
        >
          {mostrarFormulario ? "Cancelar" : "+ Nueva venta"}
        </button>
      </div>

      {mensaje && <p className="mb-4 text-sm font-semibold text-pistachio-deep">{mensaje}</p>}
      {error && <p className="mb-4 text-sm text-strawberry-deep">{error}</p>}

      {/* Formulario de venta manual */}
      {mostrarFormulario && (
        <form
          onSubmit={manejarCrearVenta}
          className="mb-6 space-y-4 rounded-xl border border-border-soft bg-white p-5 shadow-soft"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Cliente
            </label>
            <select
              value={clienteIdForm}
              onChange={(e) => setClienteIdForm(e.target.value)}
              required
              className="w-full max-w-sm rounded-lg border border-border-soft px-3 py-2 text-sm"
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.cliente_id} value={c.cliente_id}>
                  {c.nombre} {c.apellido} — {c.correo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-choco-soft">
              Productos / servicios
            </label>
            {items.map((item, indice) => (
              <div key={indice} className="flex flex-wrap items-center gap-2">
                <select
                  value={item.tipoItem}
                  onChange={(e) => actualizarItem(indice, "tipoItem", e.target.value)}
                  className="rounded-lg border border-border-soft px-2 py-1.5 text-sm"
                >
                  <option value="producto">Producto</option>
                  <option value="servicio">Servicio</option>
                </select>

                <select
                  value={item.id}
                  onChange={(e) => actualizarItem(indice, "id", e.target.value)}
                  required
                  className="min-w-[180px] flex-1 rounded-lg border border-border-soft px-2 py-1.5 text-sm"
                >
                  <option value="">Selecciona...</option>
                  {(item.tipoItem === "producto" ? productos : servicios).map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nombre} — {numeroAPrecio(op.precio)}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.cantidad}
                  onChange={(e) => actualizarItem(indice, "cantidad", e.target.value)}
                  className="w-20 rounded-lg border border-border-soft px-2 py-1.5 text-sm"
                />

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => quitarItem(indice)}
                    className="text-xs text-strawberry-deep hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={agregarItem}
              className="text-xs font-semibold text-strawberry-deep hover:underline"
            >
              + Agregar otro item
            </button>
          </div>

          <div className="flex gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-choco-soft">
                Descuento
              </label>
              <input
                type="number"
                min="0"
                value={descuento}
                onChange={(e) => setDescuento(e.target.value)}
                className="w-32 rounded-lg border border-border-soft px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-choco-soft">
                Impuestos
              </label>
              <input
                type="number"
                min="0"
                value={impuestos}
                onChange={(e) => setImpuestos(e.target.value)}
                className="w-32 rounded-lg border border-border-soft px-3 py-2 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-strawberry-deep hover:bg-strawberry px-4 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
          >
            {enviando ? "Guardando..." : "Registrar venta"}
          </button>
        </form>
      )}

      {/* Tabla del historial */}
      <div className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-soft">
        {cargando ? (
          <p className="p-6 text-sm text-choco-soft">Cargando...</p>
        ) : ventas.length === 0 ? (
          <p className="p-6 text-sm text-choco-soft">
            No hay ventas con estos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-strawberry-soft bg-strawberry-soft text-left text-xs uppercase tracking-wide text-strawberry-deep/70">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasPaginadas.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border-soft last:border-0 hover:bg-cream/40"
                  >
                    <td className="px-4 py-3 text-choco-soft">
                      {v.creado_en &&
                        new Date(v.creado_en).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                    </td>
                    <td className="px-4 py-3 font-medium text-choco">
                      {v.cliente_nombre || mapaClientes[v.cliente_id] || `Cliente #${v.cliente_id}`}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-choco-soft">
                      {v.detalles?.map((d) => `${d.nombre_item} x${d.cantidad}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 font-semibold text-choco">
                      {numeroAPrecio(v.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILOS_ESTADO[v.estado] || ""}`}
                      >
                        {v.estado}
                      </span>
                    </td>
                    <td className="space-x-3 px-4 py-3">
                      {v.estado !== "anulada" && (
                        <button
                          onClick={() => manejarGenerarFactura(v)}
                          className="text-skyblue-deep hover:underline"
                        >
                          Generar factura
                        </button>
                      )}
                      {v.estado !== "anulada" && (
                        <button
                          onClick={() => manejarAnular(v)}
                          className="text-strawberry-deep hover:underline"
                        >
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Paginacion
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onCambiarPagina={setPaginaActual}
        />
      </div>
    </div>
  );
}