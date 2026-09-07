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

      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-11 sm:px-10 md:flex-row md:justify-between">
        <div className="flex-1">
          <h2 className="font-display text-2xl font-bold text-white">
            🍦 Sweet Ice
          </h2>
          <p className="mt-3 leading-relaxed text-white/85">
            Los mejores helados artesanales para disfrutar cada momento.
          </p>
        </div>

        <div className="flex-1">
          <h3 className="mb-3 text-lg font-bold text-vanilla">Contacto</h3>
          <p className="my-1.5 text-white/85">📍 Copacabana - Antioquia</p>
          <p className="my-1.5 text-white/85">📞 300 000 0000</p>
          <p className="my-1.5 text-white/85">✉️ sweetice@gmail.com</p>
        </div>

        <div className="flex-1">
          <h3 className="mb-3 text-lg font-bold text-vanilla">Horarios</h3>
          <p className="my-1.5 text-white/85">Lunes - Viernes</p>
          <p className="my-1.5 text-white/85">10:00 AM - 8:00 PM</p>
          <p className="my-1.5 text-white/85">Sábados y Domingos</p>
          <p className="my-1.5 text-white/85">10:00 AM - 9:00 PM</p>
        </div>
      </div>

      <div className="border-t border-white/15 px-6 py-5 text-center">
        <p className="text-sm text-white/65">
          © 2026 Sweet Ice. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
