export const CANONICAL_CASE_SLUG = 'pancita'

export const CASE_SLUG_ALIASES = ['pancita', 'pancite', 'panza'] as const

const aliasSet = new Set<string>(CASE_SLUG_ALIASES)

export function normalizeCaseSlug(value: string | undefined): string {
  const slug = value?.trim().toLowerCase() || CANONICAL_CASE_SLUG
  return aliasSet.has(slug) ? CANONICAL_CASE_SLUG : slug
}

export function caseSlugCandidates(value: string | undefined): string[] {
  const requested = value?.trim().toLowerCase()
  const canonical = normalizeCaseSlug(requested)

  return Array.from(
    new Set(
      canonical === CANONICAL_CASE_SLUG
        ? [canonical, requested, ...CASE_SLUG_ALIASES].filter(Boolean)
        : [canonical],
    ),
  ) as string[]
}

export function publicCasePath(value?: string): string {
  return `/c/${normalizeCaseSlug(value)}`
}
