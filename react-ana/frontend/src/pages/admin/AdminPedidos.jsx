import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { listarTodosLosPedidos, actualizarEstadoPedido } from "../../lib/api";

const ESTADOS = ["pendiente", "en_proceso", "entregado", "cancelado"];

export default function AdminPedidos() {
  const { token } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function cargarPedidos() {
    setCargando(true);
    try {
      const datos = await listarTodosLosPedidos(token);
      setPedidos(datos.pedidos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarCambioEstado(id, nuevoEstado) {
    setMensaje("");
    setError("");
    try {
      await actualizarEstadoPedido(token, id, nuevoEstado);
      setMensaje("Estado del pedido actualizado");
      cargarPedidos();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Gestión de pedidos</h2>

      {mensaje && <p className="text-green-600 mb-4">{mensaje}</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {cargando ? (
        <p>Cargando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <p className="text-gray-500">Todavía no hay pedidos registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b border-gray-200">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Factura</th>
              </tr>
            </thead>
            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{pedido.id}</td>
                  <td className="py-2 pr-4">
                    {pedido.nombre ? `${pedido.nombre} ${pedido.apellido}` : pedido.correo}
                  </td>
                  <td className="py-2 pr-4">
                    ${Number(pedido.total).toLocaleString("es-CO")}
                  </td>
                  <td className="py-2 pr-4">
                    {new Date(pedido.creado_en).toLocaleDateString("es-CO")}
                  </td>
                  <td className="py-2 pr-4">
                    <select
                      value={pedido.estado}
                      onChange={(e) => manejarCambioEstado(pedido.id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {ESTADOS.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 pr-4">
                    <Link
                      to={`/factura/${pedido.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Ver factura
                    </Link>
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