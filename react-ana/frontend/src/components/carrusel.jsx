import { useState, useEffect, useRef, useCallback } from "react";
import { sabores } from "../data/sabores";

const INTERVALO = 4500;

function Carrusel() {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const touchX = useRef(null);

  const siguiente = useCallback(() => {
    setActual((prev) => (prev + 1) % sabores.length);
  }, []);

  const anterior = useCallback(() => {
    setActual((prev) => (prev - 1 + sabores.length) % sabores.length);
  }, []);

  useEffect(() => {
    if (pausado) return;

    const intervalo = setInterval(siguiente, INTERVALO);
    return () => clearInterval(intervalo);
  }, [pausado, siguiente]);

  const manejarTeclado = (evento) => {
    if (evento.key === "ArrowRight") siguiente();
    if (evento.key === "ArrowLeft") anterior();
  };

  const manejarTouchStart = (evento) => {
    touchX.current = evento.touches[0].clientX;
  };

  const manejarTouchEnd = (evento) => {
    if (touchX.current === null) return;

    const delta = evento.changedTouches[0].clientX - touchX.current;

    if (delta > 50) anterior();
    else if (delta < -50) siguiente();

    touchX.current = null;
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-cream-soft outline-none focus-visible:outline-2 focus-visible:outline-caramel"
      role="region"
      aria-roledescription="carrusel"
      aria-label="Sabores destacados"
      tabIndex={0}
      onKeyDown={manejarTeclado}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onTouchStart={manejarTouchStart}
      onTouchEnd={manejarTouchEnd}
    >
      {/* Textura de fondo: manchas suaves de color, quietas, sin distraer */}
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-strawberry/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-caramel/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 py-14 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-10 lg:py-24">
        {/* Columna de texto */}
        <div className="order-2 lg:order-1">
          {/* Progreso: barras finas en vez de puntos genéricos */}
          <div className="mb-6 flex gap-2" aria-hidden="true">
            {sabores.map((item, index) => (
              <button
                key={item.id}
                onClick={() => setActual(index)}
                aria-label={`Mostrar ${item.titulo}`}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  actual === index
                    ? "w-10 bg-strawberry"
                    : "w-4 bg-choco/20 hover:bg-choco/40"
                }`}
              />
            ))}
          </div>

          <h2
            key={actual}
            className="mb-4 max-w-md animate-[carruselAparecer_0.7s_ease] font-display text-4xl font-semibold leading-[1.05] text-choco sm:text-5xl lg:text-6xl motion-reduce:animate-none"
          >
            {sabores[actual].titulo}
          </h2>

          <p className="mb-8 max-w-sm text-base leading-relaxed text-choco/70 sm:text-lg" aria-live="polite">
            {sabores[actual].descripcion}
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={anterior}
              aria-label="Sabor anterior"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-choco/15 text-lg text-choco transition-colors hover:border-strawberry hover:text-strawberry"
            >
              ❮
            </button>
            <button
              onClick={siguiente}
              aria-label="Sabor siguiente"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-choco/15 text-lg text-choco transition-colors hover:border-strawberry hover:text-strawberry"
            >
              ❯
            </button>
          </div>
        </div>

        {/* Columna de imagen: la fotografía como protagonista, sin oscurecerla */}
        <div className="order-1 lg:order-2">
          <div className="relative mx-auto aspect-square w-full max-w-sm lg:max-w-none">
            <div
              className="absolute inset-4 rounded-[62%_38%_53%_47%/55%_47%_53%_45%] bg-caramel/20 blur-2xl"
              aria-hidden="true"
            />
            <img
              key={actual}
              src={sabores[actual].imagen}
              alt={sabores[actual].titulo}
              className="relative h-full w-full animate-[carruselAparecer_0.7s_ease] rounded-[62%_38%_53%_47%/55%_47%_53%_45%] object-cover shadow-soft motion-reduce:animate-none"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Carrusel;