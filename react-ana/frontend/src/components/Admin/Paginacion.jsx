/**
 * Controles de paginación reutilizables para las tablas del panel admin.
 * No pide datos nuevos al backend: solo controla qué "página" del arreglo
 * ya cargado se muestra. Úsalo junto con el hook usarPaginacion() de abajo.
 */
export default function Paginacion({ paginaActual, totalPaginas, onCambiarPagina }) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border-soft px-4 py-3 text-sm text-choco-soft">
      <button
        onClick={() => onCambiarPagina(paginaActual - 1)}
        disabled={paginaActual === 1}
        className="rounded-lg border border-border-soft px-3 py-1.5 hover:bg-cream disabled:opacity-40"
      >
        Anterior
      </button>

      <span>
        Página <span className="font-semibold text-choco">{paginaActual}</span> de {totalPaginas}
      </span>

      <button
        onClick={() => onCambiarPagina(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className="rounded-lg border border-border-soft px-3 py-1.5 hover:bg-cream disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

export const ITEMS_POR_PAGINA = 10;

/** Recorta un arreglo ya filtrado a la página pedida. */
export function paginar(items, paginaActual, itemsPorPagina = ITEMS_POR_PAGINA) {
  const inicio = (paginaActual - 1) * itemsPorPagina;
  return items.slice(inicio, inicio + itemsPorPagina);
}