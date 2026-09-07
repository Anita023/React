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
    throw new Error(datos.mensaje || "Ocurrió un error inesperado");
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