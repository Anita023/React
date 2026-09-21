import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/Admin/DashboardLayout";
import AdminPedidos from "./admin/AdminPedidos";
import AdminProductos from "./admin/AdminProductos";
import AdminServicios from "./admin/AdminServicios";
import AdminUsuarios from "./admin/AdminUsuarios";
import DashboardAdmin from "./admin/DashboardAdmin";
import AdminPQR from "./admin/AdminPQR";
import AdminVentas from "./admin/AdminVentas";
import AdminFacturas from "./admin/AdminFacturas";

const SECCIONES = [
  { id: "dashboard", etiqueta: "Dashboard", icono: "📊" },
  { id: "pedidos", etiqueta: "Pedidos", icono: "🧾" },
  { id: "ventas", etiqueta: "Ventas", icono: "💵" },
  { id: "facturas", etiqueta: "Facturas", icono: "📄" },
  { id: "productos", etiqueta: "Productos", icono: "🍦" },
  { id: "servicios", etiqueta: "Servicios", icono: "🎉" },
  { id: "usuarios", etiqueta: "Usuarios", icono: "👤" },
  { id: "pqr", etiqueta: "PQR", icono: "📨" },
];

export default function EmpleadoPanel() {
  const { usuario, cerrarSesion } = useAuth();
  const [seccionActiva, setSeccionActiva] = useState("dashboard");

  return (
    <DashboardLayout
      rolEtiqueta="Empleado"
      nombreUsuario={usuario?.nombre || usuario?.correo}
      secciones={SECCIONES}
      seccionActiva={seccionActiva}
      onCambiarSeccion={setSeccionActiva}
      breadcrumb="Sweet Ice"
      tituloPagina={SECCIONES.find((s) => s.id === seccionActiva)?.etiqueta}
      onCerrarSesion={cerrarSesion}
    >
      {seccionActiva === "dashboard" && <DashboardAdmin rol="empleado" />}
      {seccionActiva === "pedidos" && <AdminPedidos />}
      {seccionActiva === "productos" && <AdminProductos esAdmin={false} />}
      {seccionActiva === "servicios" && <AdminServicios esAdmin={false} />}
      {seccionActiva === "usuarios" && <AdminUsuarios esAdmin={false} />}
      {seccionActiva === "pqr" && <AdminPQR />}
      {seccionActiva === "ventas" && <AdminVentas />}
      {seccionActiva === "facturas" && <AdminFacturas />}
    </DashboardLayout>
  );
}