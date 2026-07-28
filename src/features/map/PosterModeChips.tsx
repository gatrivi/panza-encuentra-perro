import type { PosterMode } from '@/lib/posterRoutes'
import { POSTER_MODES } from '@/lib/posterRoutes'

type Props = {
  mode: PosterMode
  onChange: (m: PosterMode) => void
}

/** 3 configs carteles — compacto. */
export function PosterModeChips({ mode, onChange }: Props) {
  return (
    <div className="poster-mode-row" role="group" aria-label="Modo carteles">
      {POSTER_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          title={m.hint}
          className={`poster-mode-chip${mode === m.id ? ' poster-mode-on' : ''}`}
          aria-pressed={mode === m.id}
          onClick={() => onChange(m.id)}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
