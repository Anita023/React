export default function ConfirmModal({
  abierto,
  titulo = "¿Estás seguro?",
  mensaje,
  textoConfirmar = "Aceptar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
  peligroso = true,
}) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onClick={onCancelar}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[--color-border-soft] bg-white p-6 shadow-xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="confirm-modal-title"
          className="text-lg font-semibold text-[--color-choco]"
        >
          {titulo}
        </h3>
        <p className="mt-2 text-sm text-[--color-choco-soft]">{mensaje}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg border border-[--color-border-soft] px-4 py-2 text-sm font-medium text-[--color-choco] hover:bg-[--color-cream]"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
              peligroso
                ? "bg-gradient-to-r from-[#f43f5e] to-[#db2777] hover:from-[#e11d48] hover:to-[#be185d]"
                : "bg-gradient-to-r from-[#0ea5e9] to-[#0369a1] hover:from-[#0284c7] hover:to-[#075985]"
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}