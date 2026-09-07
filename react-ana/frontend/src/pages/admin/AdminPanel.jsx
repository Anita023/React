import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminPedidos from "./AdminPedidos";
import AdminProductos from "./AdminProductos";
import AdminServicios from "./AdminServicios";
import AdminUsuarios from "./AdminUsuarios";

const PESTAÑAS = [
  { id: "pedidos", etiqueta: "Pedidos" },
  { id: "productos", etiqueta: "Productos" },
  { id: "servicios", etiqueta: "Servicios" },
  { id: "usuarios", etiqueta: "Usuarios" },
];

export default function AdminPanel() {
  const { usuario } = useAuth();
  const [pestañaActiva, setPestañaActiva] = useState("pedidos");

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1">Panel de Administrador</h1>
      <p className="text-gray-500 mb-6">
        Bienvenido, {usuario?.nombre || usuario?.correo}
      </p>

      <div className="flex flex-col gap-6 md:flex-row">
        {/* Menú lateral */}
        <nav className="flex shrink-0 gap-2 overflow-x-auto border-b border-gray-200 pb-2 md:w-48 md:flex-col md:gap-1 md:overflow-visible md:border-b-0 md:border-r md:pb-0 md:pr-4">
          {PESTAÑAS.map((pestaña) => (
            <button
              key={pestaña.id}
              onClick={() => setPestañaActiva(pestaña.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-left font-medium transition ${
                pestañaActiva === pestaña.id
                  ? "bg-pink-50 text-pink-600 md:border-l-4 md:border-pink-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              {pestaña.etiqueta}
            </button>
          ))}
        </nav>

        {/* Contenido */}
        <div className="min-w-0 flex-1">
          {pestañaActiva === "pedidos" && <AdminPedidos />}
          {pestañaActiva === "productos" && <AdminProductos />}
          {pestañaActiva === "servicios" && <AdminServicios />}
          {pestañaActiva === "usuarios" && <AdminUsuarios />}
        </div>
      </div>
    </section>
  );
}