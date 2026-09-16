import { Routes, Route, useLocation } from "react-router-dom";

import Inicio from "./pages/index";
import Productos from "./pages/Productos";
import Servicios from "./pages/Servicios";
import QuienesSomos from "./pages/QuienesSomos";
import Contacto from "./pages/Contacto";
import Login from "./pages/Login";
import Carrito from "./pages/Carrito";
import RestablecerPassword from "./pages/RestablecerPassword";
import Factura from "./pages/Factura";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminPanel from "./pages/admin/AdminPanel";
import EmpleadoPanel from "./pages/EmpleadoPanel";
import ClientePanel from "./pages/ClientePanel";

// Widgets flotantes (chat de IA y WhatsApp)
import ChatWidget from "./components/ChatWidget";
import WhatsAppButton from "./components/WhatsAppButton";

// Rutas donde NO deben verse los widgets flotantes (paneles internos,
// no son parte de la vitrina pública de la tienda).
const RUTAS_SIN_WIDGETS = ["/admin", "/empleado", "/mi-cuenta"];

function App() {
  const { pathname } = useLocation();

  const ocultarWidgets = RUTAS_SIN_WIDGETS.some((ruta) => pathname.startsWith(ruta));

  return (
    <>
      <Routes>
        {/* Página principal */}
        <Route path="/" element={<Inicio />} />

        {/* Inicio de sesión (incluye registro y recuperar contraseña en modal) */}
        <Route path="/login" element={<Login />} />

        {/* Enlace que llega por correo para definir la nueva contraseña */}
        <Route path="/restablecer-password" element={<RestablecerPassword />} />

        {/* Otras páginas */}
        <Route path="/productos" element={<Productos />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/quienes-somos" element={<QuienesSomos />} />
        <Route path="/contacto" element={<Contacto />} />

        {/* Panel de administrador: solo rol "administrador" */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute rolesPermitidos={["administrador"]}>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Panel de empleado: administrador y empleado pueden entrar */}
        <Route
          path="/empleado"
          element={
            <ProtectedRoute rolesPermitidos={["administrador", "empleado"]}>
              <EmpleadoPanel />
            </ProtectedRoute>
          }
        />

        {/* Panel de cliente: cualquier usuario logueado */}
        <Route
          path="/mi-cuenta"
          element={
            <ProtectedRoute>
              <ClientePanel />
            </ProtectedRoute>
          }
        />

        {/* Carrito: cualquier usuario logueado */}
        <Route
          path="/carrito"
          element={
            <ProtectedRoute>
              <Carrito />
            </ProtectedRoute>
          }
        />

        {/* Factura de un pedido: cualquier usuario logueado */}
        <Route
          path="/factura/:id"
          element={
            <ProtectedRoute>
              <Factura />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Widgets flotantes: en toda la tienda pública, excepto dentro de los paneles */}
      {!ocultarWidgets && (
        <>
          <ChatWidget />
          <WhatsAppButton numero="573001234567" />
        </>
      )}
    </>
  );
}

export default App;