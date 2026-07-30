/**
 * Equipos = quién está en campo. No asignan barrio:
 * van donde quieren; la app solo marca dónde rinde parar / desviarse un poco.
 */

import type { OperatorUsername } from '@/lib/operators'
import {
  coveredMartelliSlotIds,
  getMartelliPosterGrid,
  martelliGridProgress,
  type MartelliSlot,
  type SignPoint,
} from '@/lib/martelliPosterGrid'
import { haversineM } from '@/lib/geo'

export type FieldTeamId = 'A' | 'B'

export const FIELD_TEAMS = {
  A: {
    id: 'A' as const,
    label: 'Equipo A',
    short: 'A',
    hint: 'Pau / Rodri',
    members: ['paula', 'rodrigo'] as const satisfies readonly OperatorUsername[],
  },
  B: {
    id: 'B' as const,
    label: 'Equipo B',
    short: 'B',
    hint: 'Gastón',
    members: ['gaston'] as const satisfies readonly OperatorUsername[],
  },
} as const

/** Soft detour: only nudge if a gap is this close (meters). */
export const WORTH_DETOUR_M = 180

export function teamForUsername(username: string | null | undefined): FieldTeamId {
  if (username === 'gaston') return 'B'
  return 'A'
}

export function bothTeamsProgress(signs: readonly SignPoint[]) {
  const prog = martelliGridProgress(signs)
  return {
    shared: prog,
    A: FIELD_TEAMS.A,
    B: FIELD_TEAMS.B,
  }
}

export type WorthStop = MartelliSlot & { meters: number }

/**
 * Huecos Martelli cerca del GPS — “rinde parar / desviarse un toque”.
 * Slots ya cubiertos (cualquier equipo) no se sugieren.
 */
export function worthStoppingNear(
  from: SignPoint,
  signs: readonly SignPoint[],
  limit = 5,
  maxMeters = WORTH_DETOUR_M,
): WorthStop[] {
  const covered = coveredMartelliSlotIds(signs)
  return getMartelliPosterGrid()
    .filter((s) => !covered.has(s.id))
    .map((s) => ({ ...s, meters: haversineM(from, s) }))
    .filter((s) => s.meters <= maxMeters)
    .sort((a, b) => a.meters - b.meters)
    .slice(0, limit)
}
