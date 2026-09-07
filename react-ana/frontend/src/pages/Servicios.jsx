import { useEffect, useState } from "react";
import { obtenerServicios } from "../lib/api";

function formatearPrecio(precio) {
  const numero = Number(precio);
  return numero > 0
    ? numero.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
    : "Sin costo adicional";
}

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerServicios()
      .then((datos) => setServicios(datos.servicios))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-2 text-center">Nuestros Servicios</h1>
      <p className="text-center text-gray-500 mb-8">
        Además de nuestros helados, ofrecemos estos servicios adicionales.
      </p>

      {cargando && <p className="text-center py-10">Cargando servicios...</p>}
      {error && <p className="text-center py-10 text-red-600">{error}</p>}

      {!cargando && !error && servicios.length === 0 && (
        <p className="text-center py-10 text-gray-500">
          Por ahora no hay servicios disponibles.
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {servicios.map((servicio) => (
          <div
            key={servicio.id}
            className="rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition"
          >
            <h2 className="text-xl font-semibold mb-2">{servicio.nombre}</h2>
            <p className="text-gray-600 mb-4">{servicio.descripcion}</p>
            <p className="font-bold text-pink-600">{formatearPrecio(servicio.precio)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}