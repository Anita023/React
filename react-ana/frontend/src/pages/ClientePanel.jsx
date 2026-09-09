import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { misPedidos, obtenerPerfil } from "../lib/api";

const ETIQUETAS_DOCUMENTO = {
  CC: "Cédula de ciudadanía",
  TI: "Tarjeta de identidad",
  CE: "Cédula de extranjería",
  PA: "Pasaporte",
};

const ESTILOS_ESTADO = {
  pendiente: "bg-[--color-cream] text-[--color-caramel-deep]",
  en_proceso: "bg-[--color-skyblue-soft] text-[--color-skyblue-deep]",
  entregado: "bg-[--color-pistachio-soft] text-[--color-pistachio-deep]",
  cancelado: "bg-[--color-strawberry-soft] text-[--color-strawberry-deep]",
};

const PESTANAS = [
  { id: "pedidos", etiqueta: "Mis pedidos" },
  { id: "datos", etiqueta: "Mis datos" },
];

export default function ClientePanel() {
  const { token, usuario } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pestanaActiva, setPestanaActiva] = useState("pedidos");
  const [pedidoExpandido, setPedidoExpandido] = useState(null);

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

  const resumenPedidos = useMemo(() => {
    const total = pedidos.length;
    const enCurso = pedidos.filter(
      (p) => p.estado === "pendiente" || p.estado === "en_proceso"
    ).length;
    const gastado = pedidos
      .filter((p) => p.estado !== "cancelado")
      .reduce((suma, p) => suma + Number(p.total || 0), 0);
    return { total, enCurso, gastado };
  }, [pedidos]);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[--color-caramel-deep]">
            Sweet Ice
          </p>
          <h1 className="font-display text-3xl font-semibold text-[--color-choco]">
            Hola, {nombre || usuario?.correo}
          </h1>
        </div>
        <Link
          to="/"
          className="text-sm font-semibold text-[--color-skyblue-deep] hover:underline"
        >
          ↩ Volver a la tienda
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-[--color-border-soft] bg-white p-4 text-center shadow-[--shadow-soft]">
          <p className="font-display text-2xl font-semibold text-[--color-choco]">
            {cargando ? "…" : resumenPedidos.total}
          </p>
          <p className="text-xs text-[--color-choco-soft]">Pedidos</p>
        </div>
        <div className="rounded-xl border border-[--color-border-soft] bg-white p-4 text-center shadow-[--shadow-soft]">
          <p className="font-display text-2xl font-semibold text-[--color-choco]">
            {cargando ? "…" : resumenPedidos.enCurso}
          </p>
          <p className="text-xs text-[--color-choco-soft]">En curso</p>
        </div>
        <div className="rounded-xl border border-[--color-border-soft] bg-white p-4 text-center shadow-[--shadow-soft]">
          <p className="font-display text-2xl font-semibold text-[--color-choco]">
            {cargando ? "…" : `$${resumenPedidos.gastado.toLocaleString("es-CO")}`}
          </p>
          <p className="text-xs text-[--color-choco-soft]">Total comprado</p>
        </div>
      </div>

      {/* Pestañas con indicador deslizante */}
      <div className="relative mb-6 grid grid-cols-2 rounded-full bg-[--color-cream] p-1">
        <span
          className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white shadow-[--shadow-soft] transition-transform duration-300 ease-out"
          style={{
            transform:
              pestanaActiva === "datos" ? "translateX(calc(100% + 8px))" : "translateX(0)",
          }}
        />
        {PESTANAS.map((pestana) => (
          <button
            key={pestana.id}
            onClick={() => setPestanaActiva(pestana.id)}
            className={`relative z-10 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              pestanaActiva === pestana.id
                ? "text-[--color-choco]"
                : "text-[--color-choco-soft]"
            }`}
          >
            {pestana.etiqueta}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-[--color-strawberry-deep]">{error}</p>}

      {pestanaActiva === "datos" && (
        <div className="animate-[fadeSlideIn_.2s_ease-out] rounded-xl border border-[--color-border-soft] bg-white p-6 shadow-[--shadow-soft]">
          <h2 className="mb-4 font-display text-lg font-semibold text-[--color-choco]">
            Mis datos
          </h2>

          {cargando ? (
            <p className="text-sm text-[--color-choco-soft]">Cargando tus datos...</p>
          ) : (
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[--color-choco-soft]">Nombre</dt>
                <dd className="font-medium text-[--color-choco]">
                  {nombre} {apellido}
                </dd>
              </div>
              <div>
                <dt className="text-[--color-choco-soft]">Correo</dt>
                <dd className="font-medium text-[--color-choco]">{usuario?.correo}</dd>
              </div>
              {perfil?.tipo_documento && (
                <div>
                  <dt className="text-[--color-choco-soft]">Documento</dt>
                  <dd className="font-medium text-[--color-choco]">
                    {ETIQUETAS_DOCUMENTO[perfil.tipo_documento] || perfil.tipo_documento}{" "}
                    #{perfil.numero_documento}
                  </dd>
                </div>
              )}
              {perfil?.telefono && (
                <div>
                  <dt className="text-[--color-choco-soft]">Teléfono</dt>
                  <dd className="font-medium text-[--color-choco]">{perfil.telefono}</dd>
                </div>
              )}
              {perfil?.direccion && (
                <div className="sm:col-span-2">
                  <dt className="text-[--color-choco-soft]">Dirección</dt>
                  <dd className="font-medium text-[--color-choco]">{perfil.direccion}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}

      {pestanaActiva === "pedidos" && (
        <div className="animate-[fadeSlideIn_.2s_ease-out] space-y-3">
          {cargando && (
            <p className="text-sm text-[--color-choco-soft]">Cargando tus pedidos...</p>
          )}

          {!cargando && pedidos.length === 0 && (
            <div className="rounded-xl border border-dashed border-[--color-border-soft] bg-white p-8 text-center">
              <p className="text-sm text-[--color-choco-soft]">
                Todavía no has hecho ningún pedido.
              </p>
              <Link
                to="/"
                className="mt-3 inline-block text-sm font-semibold text-[--color-skyblue-deep] hover:underline"
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
                className="overflow-hidden rounded-xl border border-[--color-border-soft] bg-white shadow-[--shadow-soft] transition-shadow hover:shadow-md"
              >
                <button
                  onClick={() =>
                    setPedidoExpandido(expandido ? null : pedido.id)
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={expandido}
                >
                  <div>
                    <p className="font-medium text-[--color-choco]">
                      Pedido #{pedido.id}
                    </p>
                    <p className="text-sm text-[--color-choco-soft]">
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
                        ESTILOS_ESTADO[pedido.estado] || "bg-[--color-cream]"
                      }`}
                    >
                      {pedido.estado}
                    </span>
                    <p className="font-display text-base font-semibold text-[--color-choco]">
                      ${Number(pedido.total).toLocaleString("es-CO")}
                    </p>
                    <span
                      className={`text-[--color-choco-soft] transition-transform duration-200 ${
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
                    <div className="flex items-center justify-between border-t border-[--color-border-soft] bg-[--color-cream]/40 px-5 py-3">
                      <p className="text-sm text-[--color-choco-soft]">
                        Consulta el detalle completo y descarga tu comprobante.
                      </p>
                      <Link
                        to={`/factura/${pedido.id}`}
                        className="whitespace-nowrap text-sm font-semibold text-[--color-skyblue-deep] hover:underline"
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

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px) }
          to { opacity: 1; transform: translateY(0) }
        }
      `}</style>
    </section>
  );
}
