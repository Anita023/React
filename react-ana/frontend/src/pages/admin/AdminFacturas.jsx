import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { listarFacturas, descargarFacturaPDF, descargarBlob } from "../../lib/api";

function numeroAPrecio(numero) {
  return "$" + Number(numero).toLocaleString("es-CO");
}

const ESTILOS_ESTADO = {
  emitida: "bg-pistachio-soft text-pistachio-deep",
  anulada: "bg-strawberry-soft text-strawberry-deep",
};

export default function AdminFacturas() {
  const { token } = useAuth();

  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [descargandoId, setDescargandoId] = useState(null);

  const [filtros, setFiltros] = useState({
    numero_factura: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  async function cargarFacturas() {
    setCargando(true);
    setError("");
    try {
      const filtrosLimpios = Object.fromEntries(
        Object.entries(filtros).filter(([, v]) => v !== "")
      );
      const datos = await listarFacturas(token, filtrosLimpios);
      setFacturas(datos.facturas);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarFacturas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  function manejarCambioFiltro(e) {
    setFiltros((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function manejarDescargar(factura) {
    setDescargandoId(factura.id);
    setError("");
    try {
      const blob = await descargarFacturaPDF(token, factura.id);
      descargarBlob(blob, `${factura.numero_factura}.pdf`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDescargandoId(null);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-choco-soft">
            N° de factura
          </label>
          <input
            type="text"
            name="numero_factura"
            value={filtros.numero_factura}
            onChange={manejarCambioFiltro}
            placeholder="FAC-000001"
            className="rounded-lg border border-border-soft px-3 py-1.5 text-sm"
          />
        </div>
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
      </div>

      {error && <p className="mb-4 text-sm text-strawberry-deep">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border-soft bg-white shadow-soft">
        {cargando ? (
          <p className="p-6 text-sm text-choco-soft">Cargando...</p>
        ) : facturas.length === 0 ? (
          <p className="p-6 text-sm text-choco-soft">
            No hay facturas con estos filtros.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-strawberry-soft bg-strawberry-soft text-left text-xs uppercase tracking-wide text-strawberry-deep/70">
                  <th className="px-4 py-3">N° Factura</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr
                    key={f.id}
                    className="border-b border-border-soft last:border-0 hover:bg-cream/40"
                  >
                    <td className="px-4 py-3 font-medium text-choco">
                      {f.numero_factura}
                    </td>
                    <td className="px-4 py-3 text-choco-soft">
                      {f.cliente_nombre}
                    </td>
                    <td className="px-4 py-3 text-choco-soft">
                      {f.creado_en &&
                        new Date(f.creado_en).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-choco">
                      {numeroAPrecio(f.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ESTILOS_ESTADO[f.estado] || ""}`}
                      >
                        {f.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => manejarDescargar(f)}
                        disabled={descargandoId === f.id}
                        className="text-skyblue-deep hover:underline disabled:opacity-60"
                      >
                        {descargandoId === f.id ? "Descargando..." : "Descargar PDF"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}