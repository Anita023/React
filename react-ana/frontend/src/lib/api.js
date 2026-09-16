// Cliente centralizado para hablar con el backend de Sweet Ice.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Petición genérica con manejo de token JSON y captura de errores.
 */
async function peticion(ruta, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let respuesta;

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(
      "No se pudo conectar con el servidor. ¿Está corriendo el backend (npm start)?"
    );
  }

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    let mensaje = datos.mensaje;

    // FastAPI no manda "mensaje": manda "detail", como string o como lista
    // de errores de validación (cada uno con su "msg" y su "loc").
    if (!mensaje && datos.detail) {
      if (typeof datos.detail === "string") {
        mensaje = datos.detail;
      } else if (Array.isArray(datos.detail)) {
        mensaje = datos.detail
          .map((d) => {
            const campo = Array.isArray(d.loc) ? d.loc.at(-1) : null;
            return campo ? `${campo}: ${d.msg}` : d.msg;
          })
          .join(" | ");
      }
    }

    throw new Error(mensaje || "Ocurrió un error inesperado");
  }

  return datos;
}

// ===================== Autenticación / Perfil =====================

export function registrarUsuario(datos) {
  return peticion("/registro", {
    method: "POST",
    body: datos,
  });
}

export function iniciarSesion(datos) {
  return peticion("/login", {
    method: "POST",
    body: datos,
  });
}

export function obtenerPerfil(token) {
  return peticion("/perfil", { token });
}

export function obtenerPerfilUsuario(token) {
  return obtenerPerfil(token);
}

// ===================== Recuperación de contraseña =====================

// 1. Solicitar código de recuperación
export function solicitarRecuperacion(correo) {
  return peticion("/recuperar-password", {
    method: "POST",
    body: { correo },
  });
}

// 2. Verificar código de 6 dígitos
export function verificarCodigoRecuperacion({ correo, codigo }) {
  return peticion("/verificar-codigo", {
    method: "POST",
    body: { correo, codigo },
  });
}

// 3. Cambiar contraseña usando el código
export function cambiarPasswordRecuperacion({
  correo,
  codigo,
  nuevaPassword,
}) {
  return peticion("/cambiar-password", {
    method: "POST",
    body: {
      correo,
      codigo,
      nuevaPassword,
    },
  });
}

// Alias de compatibilidad
export function restablecerPassword(datos) {
  return cambiarPasswordRecuperacion(datos);
}

// ===================== Productos (público) =====================

export function obtenerProductos() {
  return peticion("/productos");
}

export function obtenerProductoPorId(id) {
  return peticion(`/productos/${id}`);
}

// ===================== Productos (administrador) =====================

export function obtenerProductosAdmin(token) {
  return peticion("/productos/admin/todos", { token });
}

export function crearProducto(token, datos) {
  return peticion("/productos", { method: "POST", token, body: datos });
}

export function actualizarProducto(token, id, datos) {
  return peticion(`/productos/${id}`, { method: "PUT", token, body: datos });
}

export function eliminarProducto(token, id) {
  return peticion(`/productos/${id}`, { method: "DELETE", token });
}

// ===================== Servicios (público) =====================

export function obtenerServicios() {
  return peticion("/servicios");
}

// ===================== Servicios (administrador) =====================

export function obtenerServiciosAdmin(token) {
  return peticion("/servicios/admin/todos", { token });
}

export function crearServicio(token, datos) {
  return peticion("/servicios", { method: "POST", token, body: datos });
}

export function actualizarServicio(token, id, datos) {
  return peticion(`/servicios/${id}`, { method: "PUT", token, body: datos });
}

export function eliminarServicio(token, id) {
  return peticion(`/servicios/${id}`, { method: "DELETE", token });
}

// ===================== Usuarios (administrador) =====================

export function obtenerUsuarios(token) {
  return peticion("/usuarios", { token });
}

export function crearUsuario(token, datos) {
  return peticion("/usuarios", { method: "POST", token, body: datos });
}

export function obtenerUsuarioPorId(token, id) {
  return peticion(`/usuarios/${id}`, { token });
}

export function actualizarUsuario(token, id, datos) {
  return peticion(`/usuarios/${id}`, { method: "PUT", token, body: datos });
}

export function cambiarEstadoUsuario(token, id, estado) {
  return peticion(`/usuarios/${id}/estado`, {
    method: "PATCH",
    token,
    body: { estado },
  });
}

export function eliminarUsuario(token, id) {
  return peticion(`/usuarios/${id}`, { method: "DELETE", token });
}

// ===================== Carrito =====================

export function obtenerCarrito(token) {
  return peticion("/carrito", { token });
}

export function agregarAlCarrito(token, productoId, cantidad = 1) {
  return peticion("/carrito", {
    method: "POST",
    token,
    body: { productoId, cantidad },
  });
}

export function actualizarCantidadCarrito(token, itemId, cantidad) {
  return peticion(`/carrito/${itemId}`, {
    method: "PUT",
    token,
    body: { cantidad },
  });
}

export function eliminarDelCarrito(token, itemId) {
  return peticion(`/carrito/${itemId}`, { method: "DELETE", token });
}

export function vaciarCarrito(token) {
  return peticion("/carrito", { method: "DELETE", token });
}

// ===================== Pedidos =====================

export function crearPedidoDesdeCarrito(token, metodoPago = "efectivo") {
  return peticion("/pedidos", {
    method: "POST",
    token,
    body: { metodo_pago: metodoPago },
  });
}

export function crearPedidoManual(token, datos) {
  return peticion("/pedidos/manual", { method: "POST", token, body: datos });
}

export function misPedidos(token) {
  return peticion("/pedidos/mios", { token });
}

export function listarTodosLosPedidos(token) {
  return peticion("/pedidos", { token });
}

export function obtenerDetallePedido(token, id) {
  return peticion(`/pedidos/${id}`, { token });
}

export function actualizarEstadoPedido(token, id, estado) {
  return peticion(`/pedidos/${id}/estado`, {
    method: "PATCH",
    token,
    body: { estado },
  });
}

// ===================== Dashboard =====================

export function obtenerDashboardAdmin(token) {
  return peticion("/dashboard/admin", { token });
}

export function obtenerDashboardVentas(token, filtros = {}) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  const query = params ? `?${params}` : "";
  return peticion(`/dashboard/ventas${query}`, { token });
}

export function obtenerDashboardCliente(token) {
  return peticion("/dashboard/cliente", { token });
}

// ===================== Ventas =====================

export function crearVenta(token, datos) {
  return peticion("/ventas", { method: "POST", token, body: datos });
}

export function crearVentaDesdePedido(token, pedidoId) {
  return peticion(`/ventas/desde-pedido/${pedidoId}`, { method: "POST", token });
}

export function listarVentas(token, filtros = {}) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  const query = params ? `?${params}` : "";
  return peticion(`/ventas${query}`, { token });
}

export function obtenerVenta(token, id) {
  return peticion(`/ventas/${id}`, { token });
}

export function actualizarEstadoVenta(token, id, estado) {
  return peticion(`/ventas/${id}/estado`, { method: "PATCH", token, body: { estado } });
}

// ===================== Facturas =====================

export function generarFacturaDesdeVenta(token, ventaId) {
  return peticion(`/facturas/desde-venta/${ventaId}`, { method: "POST", token });
}

export function listarFacturas(token, filtros = {}) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  const query = params ? `?${params}` : "";
  return peticion(`/facturas${query}`, { token });
}

export function obtenerFactura(token, id) {
  return peticion(`/facturas/${id}`, { token });
}

// Estas dos descargan un archivo binario (PDF/Excel), no pasan por la
// función `peticion()` porque esa espera siempre una respuesta JSON.
export async function descargarReporteVentasPDF(token, fecha) {
  const respuesta = await fetch(`${API_URL}/reportes/ventas/diario/pdf?fecha=${fecha}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!respuesta.ok) throw new Error("No se pudo descargar el reporte en PDF");
  return respuesta.blob();
}

export async function descargarReporteVentasExcel(token, fecha) {
  const respuesta = await fetch(`${API_URL}/reportes/ventas/diario/excel?fecha=${fecha}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!respuesta.ok) throw new Error("No se pudo descargar el reporte en Excel");
  return respuesta.blob();
}

export async function descargarFacturaPDF(token, facturaId) {
  const respuesta = await fetch(`${API_URL}/facturas/${facturaId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!respuesta.ok) throw new Error("No se pudo descargar la factura");
  return respuesta.blob();
}

// Helper para disparar la descarga de un blob con un nombre de archivo dado.
export function descargarBlob(blob, nombreArchivo) {
  const url = window.URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
}

// ===================== PQR =====================

export function crearPQR(token, datos) {
  return peticion("/pqr", { method: "POST", token, body: datos });
}

export function misPQR(token) {
  return peticion("/pqr/mias", { token });
}

export function listarPQR(token, filtros = {}) {
  const params = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  const query = params ? `?${params}` : "";
  return peticion(`/pqr${query}`, { token });
}

export function obtenerPQR(token, id) {
  return peticion(`/pqr/${id}`, { token });
}

export function cambiarEstadoPQR(token, id, estado) {
  return peticion(`/pqr/${id}/estado`, { method: "PATCH", token, body: { estado } });
}

export function responderPQR(token, id, respuesta, estado = "respondida") {
  return peticion(`/pqr/${id}/responder`, {
    method: "PATCH",
    token,
    body: { respuesta, estado },
  });
}

// ===================== Chatbot =====================

// El chat funciona con o sin sesión iniciada. Si hay token, lo mandamos para
// que el backend asocie la conversación al usuario; si no, se maneja anónimo.
export async function enviarMensajeChat(mensaje, conversacionId, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      mensaje,
      conversacion_id: conversacionId || undefined,
    }),
  });

  const datos = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    throw new Error(datos.detail || "No se pudo enviar el mensaje");
  }

  return datos; // { conversacion_id, respuesta }
}