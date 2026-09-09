import { useState } from "react";
import { Link } from "react-router-dom";

/**
 * Shell de dashboard con sidebar fijo + encabezado, reutilizado por
 * AdminPanel (rol administrador) y EmpleadoPanel (rol empleado).
 *
 * secciones: [{ id, etiqueta, icono }]
 */
export default function DashboardLayout({
  marca = "Sweet Ice",
  rolEtiqueta = "Administrador",
  nombreUsuario,
  secciones,
  seccionActiva,
  onCambiarSeccion,
  breadcrumb,
  tituloPagina,
  onCerrarSesion,
  children,
}) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const seccionActual = secciones.find((s) => s.id === seccionActiva);

  return (
    <div className="min-h-screen bg-[--color-vanilla] md:flex">
      {/* Botón para abrir el menú en móvil */}
      <div className="flex items-center justify-between border-b border-[--color-border-soft] bg-[--color-choco] px-4 py-3 text-cream md:hidden">
        <span className="font-display text-lg font-semibold text-[--color-cream]">
          {marca}
        </span>
        <button
          onClick={() => setMenuMovilAbierto((v) => !v)}
          className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-[--color-cream]"
          aria-label="Abrir menú"
        >
          ☰ Menú
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          menuMovilAbierto ? "block" : "hidden"
        } shrink-0 bg-[--color-choco] text-[--color-cream-soft] md:block md:w-64`}
      >
        <div className="flex h-full flex-col md:sticky md:top-0 md:h-screen">
          <div className="hidden items-center gap-3 px-6 py-6 md:flex">
            <img
              src="/src/assets/img/logo.jpeg"
              alt="Sweet Ice"
              className="h-10 w-10 rounded-full object-cover ring-2 ring-[--color-strawberry]"
            />
            <div>
              <p className="font-display text-lg font-semibold text-[--color-cream]">
                {marca}
              </p>
              <p className="text-xs uppercase tracking-wide text-[--color-cream-soft]/70">
                Panel {rolEtiqueta}
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {secciones.map((seccion) => (
              <button
                key={seccion.id}
                onClick={() => {
                  onCambiarSeccion(seccion.id);
                  setMenuMovilAbierto(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition ${
                  seccionActiva === seccion.id
                    ? "bg-[--color-strawberry] text-[--color-choco]"
                    : "text-[--color-cream-soft] hover:bg-white/10"
                }`}
              >
                <span className="text-base leading-none">{seccion.icono}</span>
                {seccion.etiqueta}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Contenido */}
      <div className="min-w-0 flex-1">
        <header className="relative z-20 flex flex-col gap-1 border-b border-[--color-border-soft] bg-white px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[--color-caramel-deep]">
              {breadcrumb || marca}
            </p>
            <h1 className="font-display text-2xl font-semibold text-[--color-choco]">
              {tituloPagina || seccionActual?.etiqueta}
            </h1>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-2 rounded-full bg-[--color-cream] px-3 py-1.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[--color-strawberry] text-sm font-semibold text-white">
                {(nombreUsuario || "?").charAt(0).toUpperCase()}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-[--color-choco]">
                  {nombreUsuario}
                </p>
                <p className="text-xs text-[--color-choco-soft]">{rolEtiqueta}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-l border-[--color-border-soft] pl-3">
              <Link
                to="/"
                className="flex items-center gap-1.5 rounded-full border border-[--color-border-soft] px-3 py-1.5 text-sm font-semibold text-[--color-choco-soft] transition hover:bg-[--color-cream] hover:text-[--color-choco]"
              >
                <span className="text-base leading-none">↩</span>
                Volver al inicio
              </Link>
              <button
                onClick={onCerrarSesion}
                className="flex items-center gap-1.5 rounded-full border border-[#ffe4e6] bg-[#fff1f2] px-3 py-1.5 text-sm font-semibold text-[--color-strawberry-deep] transition hover:bg-[#ffe4e6]"
              >
                <span className="text-base leading-none">⏻</span>
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}