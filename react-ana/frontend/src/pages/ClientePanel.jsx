import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { misPedidos, obtenerPerfil } from "../lib/api";

const ETIQUETAS_DOCUMENTO = {
  CC: "Cédula de ciudadanía",
  TI: "Tarjeta de identidad",
  CE: "Cédula de extranjería",
  PA: "Pasaporte",
};

export default function ClientePanel() {
  const { token, usuario } = useAuth();

  const [perfil, setPerfil] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([obtenerPerfil(token), misPedidos(token)])
      .then(([datosPerfil, datosPedidos]) => {
        setPerfil(datosPerfil.usuario);
        setPedidos(datosPedidos.pedidos);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [token]);

  // Mientras carga el perfil completo, usamos lo que ya hay en la sesión
  const nombre = perfil?.nombre ?? usuario?.nombre;
  const apellido = perfil?.apellido ?? usuario?.apellido;

  return (
    <section className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-1">Mi cuenta</h1>
      <p className="text-gray-500 mb-6">
        Bienvenido, {nombre || usuario?.correo}
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-3">Mis datos</h2>

        {cargando ? (
          <p className="text-sm text-gray-500">Cargando tus datos...</p>
        ) : (
          <dl className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Nombre</dt>
              <dd>{nombre} {apellido}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Correo</dt>
              <dd>{usuario?.correo}</dd>
            </div>
            {perfil?.tipo_documento && (
              <div>
                <dt className="text-gray-500">Documento</dt>
                <dd>
                  {ETIQUETAS_DOCUMENTO[perfil.tipo_documento] || perfil.tipo_documento}
                  {" "}#{perfil.numero_documento}
                </dd>
              </div>
            )}
            {perfil?.telefono && (
              <div>
                <dt className="text-gray-500">Teléfono</dt>
                <dd>{perfil.telefono}</dd>
              </div>
            )}
            {perfil?.direccion && (
              <div className="sm:col-span-2">
                <dt className="text-gray-500">Dirección</dt>
                <dd>{perfil.direccion}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-3">Mis pedidos</h2>

      {cargando && <p>Cargando tus pedidos...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!cargando && !error && pedidos.length === 0 && (
        <p className="text-gray-500">Todavía no has hecho ningún pedido.</p>
      )}

      <div className="space-y-3">
        {pedidos.map((pedido) => (
          <div
            key={pedido.id}
            className="flex justify-between items-center border border-gray-200 rounded-lg px-4 py-3"
          >
            <div>
              <p className="font-medium">Pedido #{pedido.id}</p>
              <p className="text-sm text-gray-500">
                {new Date(pedido.creado_en).toLocaleDateString("es-CO")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">
                  ${Number(pedido.total).toLocaleString("es-CO")}
                </p>
                <span className="text-sm capitalize text-pink-600">{pedido.estado}</span>
              </div>
              <Link
                to={`/factura/${pedido.id}`}
                className="text-sm font-bold text-caramel-deep hover:underline"
              >
                Ver factura
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}