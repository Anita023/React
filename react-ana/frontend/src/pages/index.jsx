import Header from "../components/Header";
import Carrusel from "../components/carrusel";
import Footer from "../components/Footer";

const DESTACADOS = [
  {
    emoji: "🍫",
    nombre: "Chocolate",
    descripcion: "Cremoso y delicioso.",
    fondo: "bg-caramel-soft",
  },
  {
    emoji: "🍓",
    nombre: "Fresa",
    descripcion: "Fresco y natural.",
    fondo: "bg-strawberry-soft",
  },
  {
    emoji: "🍦",
    nombre: "Vainilla",
    descripcion: "Un clásico irresistible.",
    fondo: "bg-pistachio-soft",
  },
];

function Inicio() {
  return (
    <div>
      <Header />
      <Carrusel />

      {/* Bienvenida */}
      <section className="bg-cream-soft px-6 py-20 sm:px-10 sm:py-24 lg:px-16 xl:px-24 2xl:px-32">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 md:grid-cols-2 xl:gap-20">
          <div className="text-center md:text-left">
            <span className="mb-4 inline-block rounded-full bg-strawberry-soft px-4 py-1 text-xs font-extrabold tracking-[0.2em] text-strawberry-deep">
              BIENVENIDOS A SWEET ICE
            </span>

            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              El sabor que convierte cada momento en especial
            </h1>

            <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-choco-soft md:mx-0">
              Descubre nuestros deliciosos helados artesanales, preparados
              con ingredientes de calidad y mucho amor.
            </p>
          </div>

          <div className="relative mx-auto hidden h-72 w-72 items-center justify-center md:flex">
            {/* Blob de fondo */}
            <div
              className="absolute inset-0 -rotate-3 bg-pistachio-soft"
              style={{ borderRadius: "var(--radius-blob)" }}
              aria-hidden="true"
            />

            {/* Ilustración de barquillo con 3 bolas, hecha solo con CSS */}
            <div className="relative flex flex-col items-center" aria-hidden="true">
              <div className="z-30 h-16 w-16 rounded-full bg-strawberry shadow-soft" />
              <div className="z-20 -mt-7 h-[4.5rem] w-[4.5rem] rounded-full bg-vanilla shadow-soft" />
              <div className="z-10 -mt-8 h-20 w-20 rounded-full bg-pistachio shadow-soft" />
              <div
                className="-mt-3 h-24 w-16 bg-caramel"
                style={{
                  clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Destacados */}
      <section className="bg-cream px-6 py-20 text-center sm:px-10 sm:py-24 lg:px-16 xl:px-24 2xl:px-32">
        <h2 className="mb-12 text-3xl font-semibold sm:text-4xl">
          Nuestros favoritos
        </h2>

        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-3 xl:gap-12">
          {DESTACADOS.map((producto) => (
            <div
              key={producto.nombre}
              className="rounded-3xl border border-border-soft bg-white p-8 shadow-soft transition-all duration-300 hover:-translate-y-2 hover:shadow-lift"
            >
              <span
                className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-3xl ${producto.fondo}`}
              >
                {producto.emoji}
              </span>
              <h3 className="mb-1 text-xl font-semibold">{producto.nombre}</h3>
              <p className="text-choco-soft">{producto.descripcion}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default Inicio;