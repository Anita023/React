import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerDashboardAdmin,
  obtenerDashboardEmpleado,
  obtenerDashboardVentas,
  obtenerProductosAdmin,
  obtenerServiciosAdmin,
  obtenerUsuarios,
} from "../../lib/api";

const TARJETAS_CONFIG = [
  { clave: "total_usuarios", etiqueta: "Usuarios", icono: "👤", color: "sky" },
  { clave: "total_productos", etiqueta: "Productos", icono: "🍦", color: "rose" },
  { clave: "total_servicios", etiqueta: "Servicios", icono: "🎉", color: "amber" },
  { clave: "total_ventas", etiqueta: "Ventas", icono: "🧾", color: "emerald" },
  { clave: "total_facturado", etiqueta: "Facturado", icono: "💰", color: "violet", esMoneda: true },
  { clave: "pqr_total", etiqueta: "PQR recibidas", icono: "📥", color: "sky" },
  { clave: "pqr_pendientes", etiqueta: "PQR pendientes", icono: "📨", color: "orange" },
];

// Indicadores que solo ve el administrador. El backend tampoco los envía al
// empleado (GET /api/dashboard/empleado), así que esto es solo presentación.
const TARJETAS_SOLO_ADMIN = ["total_usuarios", "total_facturado", "pqr_total"];

const ESTILOS_COLOR = {
  sky: "bg-skyblue-soft text-skyblue-deep",
  rose: "bg-strawberry-soft text-strawberry-deep",
  amber: "bg-caramel-soft text-caramel-deep",
  emerald: "bg-pistachio-soft text-pistachio-deep",
  violet: "bg-skyblue-soft text-skyblue-deep",
  orange: "bg-strawberry-soft text-strawberry-deep",
};

function numeroAPrecio(numero) {
  return "$" + Number(numero).toLocaleString("es-CO");
}

export default function DashboardAdmin({ rol = "administrador" }) {
  const { token } = useAuth();

  const [indicadores, setIndicadores] = useState(null);
  const [serieVentas, setSerieVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [agrupacion, setAgrupacion] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [productoId, setProductoId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [estadoVenta, setEstadoVenta] = useState("");
  const [clienteId, setClienteId] = useState("");

  const [productos, setProductos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    Promise.all([
      obtenerProductosAdmin(token).catch(() => ({ productos: [] })),
      obtenerServiciosAdmin(token).catch(() => ({ servicios: [] })),
      obtenerUsuarios(token).catch(() => ({ usuarios: [] })),
    ]).then(([productosData, serviciosData, usuariosData]) => {
      setProductos(productosData.productos);
      setServicios(serviciosData.servicios);
      setClientes(usuariosData.usuarios.filter((u) => u.rol === "cliente" && u.cliente_id));
    });
  }, [token]);

  // El empleado ve el comportamiento de ventas, pero no indicadores
  // administrativos sensibles como total de usuarios o facturación consolidada.
  const tarjetasVisibles =
    rol === "administrador"
      ? TARJETAS_CONFIG
      : TARJETAS_CONFIG.filter((t) => !TARJETAS_SOLO_ADMIN.includes(t.clave));

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const promesaVentas = obtenerDashboardVentas(token, {
        agrupacion,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
        producto_id: productoId || undefined,
        servicio_id: servicioId || undefined,
        estado: estadoVenta || undefined,
        cliente_id: clienteId || undefined,
      });

      // Cada rol consume su propio endpoint de indicadores: el administrador
      // recibe todos, el empleado solo los operativos.
      const promesaIndicadores =
        rol === "administrador" ? obtenerDashboardAdmin(token) : obtenerDashboardEmpleado(token);

      const [resumen, ventas] = await Promise.all([promesaIndicadores, promesaVentas]);

      setIndicadores(resumen);
      setSerieVentas(
        ventas.serie.map((item) => ({
          periodo: item.periodo,
          Ventas: item.cantidad_ventas,
          Total: item.total,
        }))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [token, agrupacion, fechaInicio, fechaFin, rol, productoId, servicioId, estadoVenta, clienteId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-choco-soft">
          Indicadores generales y comportamiento de ventas.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Agrupar por
            </label>
            <select
              value={agrupacion}
              onChange={(e) => setAgrupacion(e.target.value)}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            >
              <option value="dia">Día</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Producto
            </label>
            <select
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Servicio
            </label>
            <select
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Estado
            </label>
            <select
              value={estadoVenta}
              onChange={(e) => setEstadoVenta(e.target.value)}
              className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="completada">Completada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-choco-soft">
              Cliente
            </label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
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
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-strawberry-deep">{error}</p>}

      {/* Cards de indicadores */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetasVisibles.map((cfg) => (
          <div
            key={cfg.clave}
            className="rounded-xl border border-border-soft bg-white p-5 shadow-soft"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full text-xl ${ESTILOS_COLOR[cfg.color]}`}
            >
              {cfg.icono}
            </div>
            <p className="font-display text-2xl font-semibold text-choco">
              {cargando || !indicadores
                ? "…"
                : cfg.esMoneda
                ? numeroAPrecio(indicadores[cfg.clave] ?? 0)
                : indicadores[cfg.clave] ?? 0}
            </p>
            <p className="text-sm text-choco-soft">{cfg.etiqueta}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border-soft bg-white p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-choco">
            Cantidad de ventas por periodo
          </h3>
          {cargando ? (
            <p className="text-sm text-choco-soft">Cargando…</p>
          ) : serieVentas.length === 0 ? (
            <p className="text-sm text-choco-soft">
              No hay ventas registradas en este rango de fechas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={serieVentas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ecddd3" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Ventas" fill="#d67f8f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-border-soft bg-white p-5 shadow-soft">
          <h3 className="mb-4 text-sm font-semibold text-choco">
            Total vendido por periodo
          </h3>
          {cargando ? (
            <p className="text-sm text-choco-soft">Cargando…</p>
          ) : serieVentas.length === 0 ? (
            <p className="text-sm text-choco-soft">
              No hay ventas registradas en este rango de fechas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={serieVentas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ecddd3" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v.toLocaleString("es-CO")}`} />
                <Tooltip formatter={(value) => numeroAPrecio(value)} />
                <Legend />
                <Line type="monotone" dataKey="Total" stroke="#d67f8f" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}