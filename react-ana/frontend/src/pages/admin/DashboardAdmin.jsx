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
import { obtenerDashboardAdmin, obtenerDashboardVentas } from "../../lib/api";

const TARJETAS_CONFIG = [
  { clave: "total_usuarios", etiqueta: "Usuarios", icono: "👤", color: "sky" },
  { clave: "total_productos", etiqueta: "Productos", icono: "🍦", color: "rose" },
  { clave: "total_servicios", etiqueta: "Servicios", icono: "🎉", color: "amber" },
  { clave: "total_ventas", etiqueta: "Ventas", icono: "🧾", color: "emerald" },
  { clave: "total_facturado", etiqueta: "Facturado", icono: "💰", color: "violet", esMoneda: true },
  { clave: "pqr_pendientes", etiqueta: "PQR pendientes", icono: "📨", color: "orange" },
];

const ESTILOS_COLOR = {
  sky: "bg-[#e0f2fe] text-[#0369a1]",
  rose: "bg-[#ffe4e6] text-[#be123c]",
  amber: "bg-[#fef3c7] text-[#b45309]",
  emerald: "bg-[#d1fae5] text-[#047857]",
  violet: "bg-[#ede9fe] text-[#6d28d9]",
  orange: "bg-[#ffedd5] text-[#c2410c]",
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

  // El empleado ve el comportamiento de ventas, pero no indicadores
  // administrativos sensibles como total de usuarios o facturación consolidada.
  const tarjetasVisibles =
    rol === "administrador"
      ? TARJETAS_CONFIG
      : TARJETAS_CONFIG.filter((t) => !["total_usuarios", "total_facturado"].includes(t.clave));

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const promesaVentas = obtenerDashboardVentas(token, {
        agrupacion,
        fecha_inicio: fechaInicio || undefined,
        fecha_fin: fechaFin || undefined,
      });

      if (rol === "administrador") {
        const [admin, ventas] = await Promise.all([obtenerDashboardAdmin(token), promesaVentas]);
        setIndicadores(admin);
        setSerieVentas(
          ventas.serie.map((item) => ({
            periodo: item.periodo,
            Ventas: item.cantidad_ventas,
            Total: item.total,
          }))
        );
      } else {
        // El empleado no tiene acceso a /dashboard/admin (solo administrador),
        // así que solo consumimos la serie de ventas.
        const ventas = await promesaVentas;
        setIndicadores({
          total_productos: null,
          total_servicios: null,
          total_ventas: ventas.cantidad_ventas_periodo,
          pqr_pendientes: null,
        });
        setSerieVentas(
          ventas.serie.map((item) => ({
            periodo: item.periodo,
            Ventas: item.cantidad_ventas,
            Total: item.total,
          }))
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [token, agrupacion, fechaInicio, fechaFin, rol]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <p className="text-sm text-[--color-choco-soft]">
          Indicadores generales y comportamiento de ventas.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-[--color-choco-soft]">
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="rounded-lg border border-[--color-border-soft] px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[--color-choco-soft]">
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="rounded-lg border border-[--color-border-soft] px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-[--color-choco-soft]">
              Agrupar por
            </label>
            <select
              value={agrupacion}
              onChange={(e) => setAgrupacion(e.target.value)}
              className="rounded-lg border border-[--color-border-soft] px-3 py-1.5 text-sm"
            >
              <option value="dia">Día</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
            </select>
          </div>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-[--color-strawberry-deep]">{error}</p>}

      {/* Cards de indicadores */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {tarjetasVisibles.map((cfg) => (
          <div
            key={cfg.clave}
            className="rounded-xl border border-[--color-border-soft] bg-white p-5 shadow-[--shadow-soft]"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full text-xl ${ESTILOS_COLOR[cfg.color]}`}
            >
              {cfg.icono}
            </div>
            <p className="font-display text-2xl font-semibold text-[--color-choco]">
              {cargando || !indicadores
                ? "…"
                : cfg.esMoneda
                ? numeroAPrecio(indicadores[cfg.clave])
                : indicadores[cfg.clave]}
            </p>
            <p className="text-sm text-[--color-choco-soft]">{cfg.etiqueta}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[--color-border-soft] bg-white p-5 shadow-[--shadow-soft]">
          <h3 className="mb-4 text-sm font-semibold text-[--color-choco]">
            Cantidad de ventas por periodo
          </h3>
          {cargando ? (
            <p className="text-sm text-[--color-choco-soft]">Cargando…</p>
          ) : serieVentas.length === 0 ? (
            <p className="text-sm text-[--color-choco-soft]">
              No hay ventas registradas en este rango de fechas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={serieVentas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Ventas" fill="#db2777" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-[--color-border-soft] bg-white p-5 shadow-[--shadow-soft]">
          <h3 className="mb-4 text-sm font-semibold text-[--color-choco]">
            Total vendido por periodo
          </h3>
          {cargando ? (
            <p className="text-sm text-[--color-choco-soft]">Cargando…</p>
          ) : serieVentas.length === 0 ? (
            <p className="text-sm text-[--color-choco-soft]">
              No hay ventas registradas en este rango de fechas.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={serieVentas}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v.toLocaleString("es-CO")}`} />
                <Tooltip formatter={(value) => numeroAPrecio(value)} />
                <Legend />
                <Line type="monotone" dataKey="Total" stroke="#db2777" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}