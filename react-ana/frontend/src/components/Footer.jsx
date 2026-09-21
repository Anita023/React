function Footer() {
  return (
    <footer className="relative bg-choco pt-16 text-white">
      {/* Borde superior tipo "goteo" de helado */}
      <div
        className="absolute -top-6 left-0 h-6 w-full bg-choco"
        style={{
          clipPath:
            "polygon(0% 0%, 100% 0%, 100% 40%, 92% 100%, 84% 40%, 76% 100%, 68% 40%, 60% 100%, 52% 40%, 44% 100%, 36% 40%, 28% 100%, 20% 40%, 12% 100%, 4% 40%, 0% 100%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 pb-14 sm:px-10 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-bold text-white">
            <span aria-hidden="true">🍦</span> Sweet Ice
          </h2>
          <p className="mt-3 max-w-xs leading-relaxed text-white/75">
            Los mejores helados artesanales para disfrutar cada momento.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-base font-bold uppercase tracking-wide text-strawberry">
            Contacto
          </h3>
          <p className="my-1.5 flex items-center gap-2 text-white/85">
            <span aria-hidden="true">📍</span> Copacabana - Antioquia
          </p>
          <a
            href="tel:+573000000000"
            className="my-1.5 flex items-center gap-2 text-white/85 transition-colors hover:text-strawberry"
          >
            <span aria-hidden="true">📞</span> 300 000 0000
          </a>
          <a
            href="mailto:sweetice@gmail.com"
            className="my-1.5 flex items-center gap-2 text-white/85 transition-colors hover:text-strawberry"
          >
            <span aria-hidden="true">✉️</span> sweetice@gmail.com
          </a>
        </div>

        <div>
          <h3 className="mb-3 text-base font-bold uppercase tracking-wide text-strawberry">
            Horarios
          </h3>
          <p className="my-1.5 text-white/85">Lunes - Viernes</p>
          <p className="my-1.5 text-white/60">10:00 AM - 8:00 PM</p>
          <p className="my-1.5 text-white/85">Sábados y Domingos</p>
          <p className="my-1.5 text-white/60">10:00 AM - 9:00 PM</p>
        </div>
      </div>

      <div className="border-t border-white/15 px-6 py-5 text-center">
        <p className="text-sm text-white/60">
          © 2026 Sweet Ice. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;