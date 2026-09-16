import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { obtenerDashboardCliente } from "../lib/api";

function numeroAPrecio(numero) {
  return "$" + Number(numero).toLocaleString("es-CO");
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return "Aún no tienes compras";
  return new Date(fechaIso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

const TARJETAS_CONFIG = [
  { clave: "total_compras", etiqueta: "Compras realizadas", icono: "🛍️", color: "sky" },
  { clave: "total_gastado", etiqueta: "Total gastado", icono: "💳", color: "rose", esMoneda: true },
  { clave: "pqr_pendientes", etiqueta: "PQR pendientes", icono: "📨", color: "amber" },
];

const ESTILOS_COLOR = {
  sky: "bg-[#e0f2fe] text-[#0369a1]",
  rose: "bg-[#ffe4e6] text-[#be123c]",
  amber: "bg-[#fef3c7] text-[#b45309]",
};

export default function DashboardCliente() {
  const { token } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerDashboardCliente(token)
      .then(setDatos)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [token]);

  return (
    <div>
      <p className="mb-6 text-sm text-choco-soft">Tu actividad en Sweet Ice.</p>

      {error && <p className="mb-4 text-sm font-semibold text-strawberry-deep">{error}</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TARJETAS_CONFIG.map((cfg) => (
          <div
            key={cfg.clave}
            className="rounded-2xl border border-border-soft bg-white p-5 shadow-soft"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full text-xl ${ESTILOS_COLOR[cfg.color]}`}
            >
              {cfg.icono}
            </div>
            <p className="font-display text-2xl font-semibold text-choco">
              {cargando || !datos ? "…" : cfg.esMoneda ? numeroAPrecio(datos[cfg.clave]) : datos[cfg.clave]}
            </p>
            <p className="text-sm text-choco-soft">{cfg.etiqueta}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border-soft bg-white p-5 shadow-soft">
        <p className="text-sm text-choco-soft">Última compra</p>
        <p className="mt-1 font-display text-lg font-semibold text-choco">
          {cargando || !datos ? "…" : formatearFecha(datos.ultima_compra)}
        </p>
      </div>
    </div>
  );
}