import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerUsuarios,
  obtenerProductosAdmin,
  obtenerServiciosAdmin,
  listarTodosLosPedidos,
} from "../../lib/api";

const TARJETAS_VACIAS = [
  { etiqueta: "Usuarios", valor: "—", icono: "👤", color: "sky" },
  { etiqueta: "Productos", valor: "—", icono: "🍦", color: "rose" },
  { etiqueta: "Servicios", valor: "—", icono: "🎉", color: "amber" },
  { etiqueta: "Pedidos", valor: "—", icono: "🧾", color: "emerald" },
];

const ESTILOS_COLOR = {
  sky: "bg-skyblue-soft text-skyblue-deep",
  rose: "bg-strawberry-soft text-strawberry-deep",
  amber: "bg-caramel-soft text-caramel-deep",
  emerald: "bg-pistachio-soft text-pistachio-deep",
};

const ACCIONES_RAPIDAS = [
  {
    id: "pedidos",
    etiqueta: "Agregar pedido",
    icono: "🧾",
    clases: "border-pistachio-soft bg-pistachio-soft text-pistachio-deep hover:bg-pistachio-soft",
  },
  {
    id: "servicios",
    etiqueta: "Agregar servicio",
    icono: "🎉",
    clases: "border-caramel-soft bg-caramel-soft text-caramel-deep hover:bg-caramel-soft",
  },
  {
    id: "productos",
    etiqueta: "Agregar producto",
    icono: "🍦",
    clases: "border-strawberry-soft bg-strawberry-soft text-strawberry-deep hover:bg-strawberry-soft",
  },
  {
    id: "usuarios",
    etiqueta: "Agregar usuario",
    icono: "👤",
    clases: "border-skyblue-soft bg-skyblue-soft text-skyblue-deep hover:bg-skyblue-soft",
  },
];

export default function AdminResumen({ onAccionRapida }) {
  const { token } = useAuth();
  const [tarjetas, setTarjetas] = useState(TARJETAS_VACIAS);
  const [pedidosPendientes, setPedidosPendientes] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarResumen() {
      try {
        const [usuarios, productos, servicios, pedidos] = await Promise.all([
          obtenerUsuarios(token).catch(() => ({ usuarios: [] })),
          obtenerProductosAdmin(token).catch(() => ({ productos: [] })),
          obtenerServiciosAdmin(token).catch(() => ({ servicios: [] })),
          listarTodosLosPedidos(token).catch(() => ({ pedidos: [] })),
        ]);

        setTarjetas([
          { etiqueta: "Usuarios", valor: usuarios.usuarios.length, icono: "👤", color: "sky" },
          { etiqueta: "Productos", valor: productos.productos.length, icono: "🍦", color: "rose" },
          { etiqueta: "Servicios", valor: servicios.servicios.length, icono: "🎉", color: "amber" },
          { etiqueta: "Pedidos", valor: pedidos.pedidos.length, icono: "🧾", color: "emerald" },
        ]);
        setPedidosPendientes(
          pedidos.pedidos.filter((p) => p.estado === "pendiente").length
        );
      } finally {
        setCargando(false);
      }
    }

    cargarResumen();
  }, [token]);

  return (
    <div>
      <p className="mb-6 text-sm text-choco-soft">
        Vista rápida del estado actual de Sweet Ice.
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tarjetas.map((tarjeta) => (
          <div
            key={tarjeta.etiqueta}
            className="rounded-xl border border-border-soft bg-white p-5 shadow-soft"
          >
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full text-xl ${
                ESTILOS_COLOR[tarjeta.color]
              }`}
            >
              {tarjeta.icono}
            </div>
            <p className="font-display text-3xl font-semibold text-choco">
              {cargando ? "…" : tarjeta.valor}
            </p>
            <p className="text-sm text-choco-soft">{tarjeta.etiqueta}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-choco-soft">
          Acciones rápidas
        </p>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {ACCIONES_RAPIDAS.map((accion) => (
            <button
              key={accion.id}
              onClick={() => onAccionRapida?.(accion.id)}
              className={`flex items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold shadow-sm transition ${accion.clases}`}
            >
              <span className="text-xl leading-none">{accion.icono}</span>
              <span>+ {accion.etiqueta}</span>
            </button>
          ))}
        </div>
      </div>

      {!cargando && pedidosPendientes !== null && (
        <div
          className={`mt-6 rounded-xl border p-4 text-sm ${
            pedidosPendientes > 0
              ? "border-caramel-soft bg-caramel-soft text-caramel-deep"
              : "border-pistachio-soft bg-pistachio-soft text-pistachio-deep"
          }`}
        >
          {pedidosPendientes > 0 ? (
            <>
              Tienes <strong>{pedidosPendientes}</strong>{" "}
              {pedidosPendientes === 1 ? "pedido pendiente" : "pedidos pendientes"} por
              gestionar.
            </>
          ) : (
            "No hay pedidos pendientes por el momento."
          )}
        </div>
      )}
    </div>
  );
}