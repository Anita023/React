import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerServiciosAdmin,
  crearServicio,
  actualizarServicio,
  eliminarServicio,
} from "../../lib/api";

const FORMULARIO_VACIO = { nombre: "", descripcion: "", precio: "" };

export default function AdminServicios({ esAdmin = true }) {
  const { token } = useAuth();

  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [editandoId, setEditandoId] = useState(null);

  async function cargarServicios() {
    setCargando(true);
    try {
      const datos = await obtenerServiciosAdmin(token);
      setServicios(datos.servicios);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarServicios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function manejarCambio(e) {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  }

  function iniciarEdicion(servicio) {
    setEditandoId(servicio.id);
    setFormulario({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precio: servicio.precio,
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
        await actualizarServicio(token, editandoId, formulario);
        setMensaje("Servicio actualizado correctamente");
      } else {
        await crearServicio(token, formulario);
        setMensaje("Servicio creado correctamente");
      }

      cancelarEdicion();
      cargarServicios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function alternarDisponibilidad(servicio) {
    try {
      await actualizarServicio(token, servicio.id, {
        disponible: servicio.disponible ? 0 : 1,
      });
      cargarServicios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminar(id) {
    if (!window.confirm("¿Eliminar este servicio?")) return;

    try {
      await eliminarServicio(token, id);
      setMensaje("Servicio eliminado");
      cargarServicios();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gestión de servicios</h2>

      <form
        onSubmit={manejarEnvio}
        className="grid gap-3 sm:grid-cols-2 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-8"
      >
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
          placeholder="Precio (0 si no tiene costo adicional)"
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
            {editandoId ? "Guardar cambios" : "Agregar servicio"}
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
        <p>Cargando servicios...</p>
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
              {servicios.map((servicio) => (
                <tr key={servicio.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{servicio.nombre}</td>
                  <td className="py-2 pr-4">
                    {Number(servicio.precio) > 0
                      ? `$${Number(servicio.precio).toLocaleString("es-CO")}`
                      : "Sin costo"}
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        servicio.disponible
                          ? "text-green-600 font-medium"
                          : "text-gray-400 font-medium"
                      }
                    >
                      {servicio.disponible ? "Disponible" : "No disponible"}
                    </span>
                  </td>
                  <td className="py-2 pr-4 space-x-2">
                    <button
                      onClick={() => iniciarEdicion(servicio)}
                      className="text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    {esAdmin && (
                      <>
                        <button
                          onClick={() => alternarDisponibilidad(servicio)}
                          className="text-amber-600 hover:underline"
                        >
                          {servicio.disponible ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => manejarEliminar(servicio.id)}
                          className="text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
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