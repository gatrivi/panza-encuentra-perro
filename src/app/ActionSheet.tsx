import { useNavigate } from 'react-router-dom'
import { t } from '@/i18n/es-AR'

type Props = { onClose: () => void }

export function ActionSheet({ onClose }: Props) {
  const navigate = useNavigate()
  const copy = t()

  const go = (path: string) => {
    onClose()
    void navigate(path)
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-label="Acciones"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Acción rápida</h2>
        <div className="stack">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => go('/bandeja?capture=sighting')}
          >
            {copy.actions.possibleSighting}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => go('/bandeja?capture=1')}
          >
            {copy.actions.pastePost}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => go('/plan?new=sign')}
          >
            {copy.actions.placeSign}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => go('/plan?new=task')}
          >
            {copy.actions.startOuting}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
            {copy.actions.cancel}
          </button>
        </div>
      </div>
    </div>
  )
}
