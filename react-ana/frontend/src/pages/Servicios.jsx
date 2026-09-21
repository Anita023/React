import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { obtenerServicios, agregarServicioAlCarrito } from "../lib/api";

function formatearPrecio(precio) {
  const numero = Number(precio);
  return numero > 0
    ? numero.toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      })
    : "Sin costo adicional";
}

export default function Servicios() {
  const { estaLogueado, token } = useAuth();
  const navigate = useNavigate();

  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ultimoAgregado, setUltimoAgregado] = useState(null);

  useEffect(() => {
    obtenerServicios()
      .then((datos) => setServicios(datos.servicios))
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  const ordenarServicio = async (servicio) => {
    if (!estaLogueado) {
      navigate("/login");
      return;
    }

    try {
      await agregarServicioAlCarrito(token, servicio.id, 1);
      setUltimoAgregado(servicio.id);
      setTimeout(() => setUltimoAgregado(null), 1200);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <Header />

      <main className="bg-cream">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 pb-10 pt-24 text-center sm:px-10">
          <span className="rounded-full bg-strawberry-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-strawberry-deep">
            NUESTROS SERVICIOS
          </span>
          <h1 className="text-4xl font-semibold">Nuestros Servicios</h1>
          <p className="text-lg text-choco-soft">
            Además de nuestros helados, ofrecemos estos servicios adicionales.
          </p>

          {!estaLogueado && (
            <p className="rounded-2xl border border-caramel-soft bg-caramel-soft/40 px-4 py-2 text-sm font-semibold text-caramel-deep">
              Inicia sesión para agregar servicios a tu carrito 🍦
            </p>
          )}
        </section>

        {cargando && (
          <p className="pb-16 text-center text-choco-soft">Cargando servicios…</p>
        )}

        {error && (
          <p className="mx-auto max-w-md pb-16 text-center text-sm font-semibold text-strawberry-deep">
            {error}
          </p>
        )}

        {!cargando && !error && servicios.length === 0 && (
          <p className="pb-16 text-center text-choco-soft">
            Por ahora no hay servicios disponibles.
          </p>
        )}

        {!cargando && !error && servicios.length > 0 && (
          <section className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 pb-20 sm:grid-cols-2 sm:px-10 lg:grid-cols-3 lg:px-16">
            {servicios.map((servicio) => (
              <article
                key={servicio.id}
                className="flex flex-col rounded-3xl border border-border-soft bg-white p-7 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
              >
                <h2 className="mb-2 text-xl font-semibold text-choco-deep">
                  {servicio.nombre}
                </h2>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-choco-soft">
                  {servicio.descripcion}
                </p>
                <strong className="mb-4 block text-lg text-strawberry-deep">
                  {formatearPrecio(servicio.precio)}
                </strong>

                <button
                  onClick={() => ordenarServicio(servicio)}
                  className={`w-full rounded-full py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 ${
                    ultimoAgregado === servicio.id
                      ? "bg-pistachio-deep"
                      : "bg-caramel hover:bg-caramel-deep"
                  }`}
                >
                  {ultimoAgregado === servicio.id ? "✓ Agregado" : "Ordenar"}
                </button>
              </article>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}