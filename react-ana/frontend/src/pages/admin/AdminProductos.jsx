import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerProductosAdmin,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
} from "../../lib/api";

const FORMULARIO_VACIO = {
  slug: "",
  nombre: "",
  descripcion: "",
  precio: "",
  imagen_url: "",
};

export default function AdminProductos() {
  const { token } = useAuth();

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editandoId, setEditandoId] = useState(null);

  async function cargarProductos() {
    setCargando(true);
    try {
      const datos = await obtenerProductosAdmin(token);
      setProductos(datos.productos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarProductos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function manejarCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  }

  function iniciarEdicion(producto) {
    setEditandoId(producto.id);
    setFormulario({
      slug: producto.slug,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen_url: producto.imagen_url || "",
    });
    setMensaje("");
    setError("");
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setMensaje("");
    setError("");

    try {
      if (editandoId) {
        await actualizarProducto(token, editandoId, formulario);
        setMensaje("Producto actualizado correctamente");
      } else {
        await crearProducto(token, formulario);
        setMensaje("Producto creado correctamente");
      }

      cancelarEdicion();
      cargarProductos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function alternarDisponibilidad(producto) {
    try {
      await actualizarProducto(token, producto.id, {
        disponible: producto.disponible ? 0 : 1,
      });
      cargarProductos();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminar(id) {
    if (!window.confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      await eliminarProducto(token, id);
      setMensaje("Producto eliminado");
      cargarProductos();
    } catch (err) {
      // Si ya tiene pedidos asociados, el backend devuelve un mensaje claro
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gestión de productos</h2>

      <form
        onSubmit={manejarEnvio}
        className="grid gap-3 sm:grid-cols-2 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8"
      >
        <input
          name="slug"
          value={formulario.slug}
          onChange={manejarCambio}
          placeholder="slug (ej: chocolate)"
          required
          disabled={Boolean(editandoId)}
          className="border rounded px-3 py-2 disabled:bg-gray-100"
        />
        <input
          name="nombre"
          value={formulario.nombre}
          onChange={manejarCambio}
          placeholder="Nombre"
          required
          className="border rounded px-3 py-2"
        />
        <input
          name="precio"
          type="number"
          min="0"
          value={formulario.precio}
          onChange={manejarCambio}
          placeholder="Precio"
          required
          className="border rounded px-3 py-2"
        />
        <input
          name="imagen_url"
          value={formulario.imagen_url}
          onChange={manejarCambio}
          placeholder="URL de imagen (opcional)"
          className="border rounded px-3 py-2"
        />
        <textarea
          name="descripcion"
          value={formulario.descripcion}
          onChange={manejarCambio}
          placeholder="Descripción"
          required
          className="border rounded px-3 py-2 sm:col-span-2"
        />

        <div className="sm:col-span-2 flex gap-3">
          <button
            type="submit"
            className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
          >
            {editandoId ? "Guardar cambios" : "Agregar producto"}
          </button>
          {editandoId && (
            <button
              type="button"
              onClick={cancelarEdicion}
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {mensaje && <p className="text-green-600 mb-4">{mensaje}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {cargando ? (
        <p>Cargando productos...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Precio</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{producto.nombre}</td>
                  <td className="py-2 pr-4">
                    ${Number(producto.precio).toLocaleString("es-CO")}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        producto.disponible
                          ? "text-green-600 font-medium"
                          : "text-gray-400 font-medium"
                      }
                    >
                      {producto.disponible ? "Disponible" : "No disponible"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 space-x-2">
                    <button
                      onClick={() => iniciarEdicion(producto)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => alternarDisponibilidad(producto)}
                      className="text-amber-600 hover:underline"
                    >
                      {producto.disponible ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => manejarEliminar(producto.id)}
                      className="text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}