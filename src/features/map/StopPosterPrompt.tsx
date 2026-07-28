type Props = {
  open: boolean
  onYes: () => void
  onNo: () => void
}

export function StopPosterPrompt({ open, onYes, onNo }: Props) {
  if (!open) return null
  return (
    <div className="sheet-backdrop" role="presentation" onClick={onNo}>
      <div
        className="sheet"
        role="dialog"
        aria-label="Cartel"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>¿Dejaste un cartel?</h2>
        <p className="muted">Estuviste parado más de 1 minuto.</p>
        <div className="stack">
          <button type="button" className="btn btn-primary btn-block" onClick={onYes}>
            Sí, guardar acá
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onNo}>
            No
          </button>
        </div>
      </div>
    </div>
  )
}
