type Props = {
  active: boolean
  onToggle: () => void
  sweeping: boolean
  cellCount: number
}

const HINT =
  'Al activar: el GPS pinta hexágonos de “evitar” (tráfico, perros sueltos, peligro). Al apagar: guarda esa zona. No es alarma automática.'

export function RiskModeChip({ active, onToggle, sweeping, cellCount }: Props) {
  return (
    <button
      type="button"
      className={`risk-chip${active ? ' risk-chip-on' : ''}`}
      aria-pressed={active}
      title={HINT}
      onClick={onToggle}
    >
      {active ? (sweeping ? `Riesgo ${cellCount}` : 'Riesgo ON') : 'Riesgo'}
    </button>
  )
}
