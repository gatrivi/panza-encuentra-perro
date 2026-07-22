/**
 * Sanitized Panza import example — replaceable; no private identities.
 * Florida Oeste must not become active from discarded reports alone.
 */
export const panzaImportExample = {
  slug: 'pancite',
  animal: {
    name: 'Pancite',
    aliases: ['Panza'],
    breed: 'Caniche',
    color: 'Negro',
    sex: 'female' as const,
  },
  seedSightings: [
    {
      label: 'San Ramón y Maipú → 9 de Julio',
      observedLocalTime: '17:30',
      point: [-58.4885, -34.5155] as [number, number],
      direction: 'SE',
      confidence: 'confirmed' as const,
    },
    {
      label: 'Cementerio de Olivos (foco previo)',
      point: [-58.495, -34.508] as [number, number],
      confidence: 'unverified' as const,
    },
  ],
  notes: [
    'Florida Oeste: no activar zona solo por reportes viejos/descartados.',
  ],
}
