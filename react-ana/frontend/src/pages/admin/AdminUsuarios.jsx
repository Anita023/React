import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerUsuarios,
  actualizarUsuario,
  cambiarEstadoUsuario,
  eliminarUsuario,
} from "../../lib/api";

const ROLES = ["cliente", "empleado", "administrador"];

export default function AdminUsuarios({ esAdmin = true }) {
  const { token, usuario: usuarioActual } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarUsuarios() {
    setCargando(true);
    try {
      const datos = await obtenerUsuarios(token);
      setUsuarios(datos.usuarios);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarCambioRol(id, nuevoRol) {
    setMensaje("");
    setError("");
    try {
      await actualizarUsuario(token, id, { rol: nuevoRol });
      setMensaje("Rol actualizado correctamente");
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarCambioEstado(usuario) {
    setMensaje("");
    setError("");
    const nuevoEstado = usuario.estado === "activo" ? "inactivo" : "activo";
    try {
      await cambiarEstadoUsuario(token, usuario.id, nuevoEstado);
      setMensaje(`Usuario marcado como ${nuevoEstado}`);
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  async function manejarEliminar(id) {
    if (
      !window.confirm(
        "¿Eliminar este usuario permanentemente? Se recomienda usar 'Desactivar' en su lugar."
      )
    ) {
      return;
    }

    setMensaje("");
    setError("");
    try {
      await eliminarUsuario(token, id);
      setMensaje("Usuario eliminado");
      cargarUsuarios();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gestión de usuarios</h2>

      {mensaje && <p className="text-green-600 mb-4">{mensaje}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {cargando ? (
        <p>Cargando usuarios...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Correo</th>
                <th className="py-2 pr-4">Rol</th>
                <th className="py-2 pr-4">Estado</th>
                {esAdmin && <th className="py-2 pr-4">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const esUsuarioActual = usuario.id === usuarioActual?.id;

                return (
                  <tr key={usuario.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">
                      {usuario.nombre
                        ? `${usuario.nombre} ${usuario.apellido}`
                        : "—"}
                    </td>
                    <td className="py-2 pr-4">{usuario.correo}</td>
                    <td className="py-2 pr-4">
                      {esAdmin ? (
                        <select
                          value={usuario.rol}
                          disabled={esUsuarioActual}
                          onChange={(e) =>
                            manejarCambioRol(usuario.id, e.target.value)
                          }
                          className="border rounded px-2 py-1 disabled:bg-gray-100"
                        >
                          {ROLES.map((rol) => (
                            <option key={rol} value={rol}>
                              {rol}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="capitalize">{usuario.rol}</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          usuario.estado === "activo"
                            ? "text-green-600 font-medium"
                            : "text-gray-400 font-medium"
                        }
                      >
                        {usuario.estado}
                      </span>
                    </td>
                    {esAdmin && (
                      <td className="py-2 pr-4 space-x-2">
                        <button
                          onClick={() => manejarCambioEstado(usuario)}
                          disabled={esUsuarioActual}
                          className="text-amber-600 hover:underline disabled:text-gray-300"
                        >
                          {usuario.estado === "activo" ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          onClick={() => manejarEliminar(usuario.id)}
                          disabled={esUsuarioActual}
                          className="text-red-600 hover:underline disabled:text-gray-300"
                        >
                          Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}