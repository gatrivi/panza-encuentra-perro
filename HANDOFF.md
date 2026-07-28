# HANDOFF — Operativo Panza · v0.2.2

**Fecha:** 28/7/2026 ~01:10 ART  
**Repo:** `panza-encuentra-perro` · branch `master` (cambios **sin commit**)  
**Fuente de verdad:** `CONTEXT.md` + `OPERATIVO_PANCITE_BUILD_BRIEF.md`

## Qué es

PWA mapa operativo familiar para encontrar a **Panza** (caniche negra).  
Login cliente: `paula` / `rodrigo` / `gaston` + pass familiar (`src/lib/operators.ts`). **Sin Firebase Auth.**

## Estado del caso

- Escape **15/7** Olivos cementerio.
- Último avistaje fuerte **23/7 noche:** banquina Gral Paz → Villa Martelli (Parque Sarmiento). Pin `[-58.508, -34.551]`.
- Regla: no agarrar; solo familia. Tel: 1156194761 / 1130400210.
- Dueña FB: **Pau Trivi** (`pau.trivi`). Secundarios: Rodrii Perez Schmidt, G Alejandro Trivi.

## Hecho en esta línea (no pusheado)

| Área | Archivos clave |
|------|----------------|
| M3 thin mapa | `CoverageLayer`, `AvoidAreasLayer`, `SignsLayer`, `usePatrolGps`, `fieldQueue`, `fieldRepos` |
| OSINT seed | `panzaCase.ts` → `PANZA_OSINT_LEADS` + bootstrap en `repos.ts` |
| Sonnet selectivo | `leadDecay.ts`, `zonaYaPeinada`, tips en mapa, `persistentLocalCache` |
| Ref Sonnet | `_sonnet-direction/` + `INTEGRATED.md` · zip `files (1).zip` |

Tests unit: `yarn test` OK (18). `yarn typecheck` OK.

## NO hacer / no integrado

- Scraper FB autónomo (pedido watcher zona: **no arrancado**).
- Rules Auth de Sonnet (chocan con MVP sin Auth).
- Modelo flat `leads/` de Sonnet — app usa `cases/{id}/…`.
- Commit/push: **pendiente** (user no pidió).

## Brave / OSINT notes

- Brave CDP a veces en `:9222`. Playwright MCP = Chromium aparte → usar **puppeteer-core + connectOverCDP** a Brave.
- Eval `share/p/1DPEuBw7F8/` = **descartar** (Lomas/Zolá, no Panza).

## Próximos pasos útiles (priorizado)

1. Commit local de M3 + OSINT + Sonnet (si user pide).
2. Watcher FB zona norte (grupos caniche / VL) → JSONL → leads (manual promote).
3. M5 calles/OSM.
4. Auth + rules reales cuando salga del MVP familiar.

## Comandos

```
yarn dev   # http://127.0.0.1:8888 (strict)
yarn test
yarn typecheck
```

Bandeja paste: http://127.0.0.1:8888/bandeja?capture=1

Relogin en app para re-seed leads OSINT si Firestore vacío.
