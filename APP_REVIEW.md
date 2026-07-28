# APP REVIEW — Operativo Pancite / Buscamos a Panza

**Versión:** `0.2.8`  
**Fecha review:** 28/7/2026  
**Repo:** `panza-encuentra-perro` · branch `master`  
**Dev:** http://127.0.0.1:8888 (`vite` · `strictPort`)  
**Idioma UI:** es-AR  

Documento único para review del estado actual. Fuentes hermanas: `CONTEXT.md` (caso), `SIGNS_CAMPAIGN.md` (campaña carteles), `HANDOFF.md` (histórico), `OPERATIVO_PANCITE_BUILD_BRIEF.md` (brief original), `_sonnet-direction/INTEGRATED.md`.

---

## 1. Qué es

PWA mobile-first para la familia que busca a **Panza** (caniche/cruza negra, collar violeta + chapita PANZA). Une:

- mapa operativo (avistajes, tips, cobertura H3, carteles, zonas evitar)
- bandeja de leads (pegar post FB/IG → lead → promover a sighting)
- plan de salidas (Maps/Waze + progreso campaña carteles)
- página pública `/c/pancita` (“LA ESTOY VIENDO”)

**Regla operativa:** no agarrar; solo familia retiene. Llamar **1156194761** / **1130400210**.

---

## 2. Stack

| Capa | Tech |
|------|------|
| UI | React 19, React Router 7, CSS propio (`global.css`) |
| Mapa | Leaflet + react-leaflet · tiles OSM / Esri satélite |
| Geo | h3-js (res 10), Turf (intersects/union), decay por edad |
| Datos | Firebase Firestore (+ Storage pensado), Zod schemas |
| Offline | `idb-keyval` drafts · `fieldQueue` acciones campo · Firestore `persistentLocalCache` (prod) |
| PWA | `vite-plugin-pwa` (autoUpdate) |
| Voz | CatTS HTTP (`VITE_CATTS_URL`) → fallback `speechSynthesis` |
| Tests | Vitest + Testing Library · rules tests con emulators |
| Functions | Cloud Function public report (carpeta `functions/`) |

**No hay Firebase Auth.** Sesión local: operadores `paula` / `gaston` / `rodrigo` (UI: **P / G / R**). Pass familiar solo en client (`operators.ts`) — legacy; switch actual sin pass.

---

## 3. Caso Panza (datos seed)

| Campo | Valor |
|-------|--------|
| Case id | `case_panza` |
| Slug público | `pancita` |
| Escape | 15/7 Olivos, zona cementerio |
| Último foco fuerte | **23/7 noche** banquina Gral Paz → Villa Martelli / Parque Sarmiento |
| Pin | `[-58.508, -34.551]` (lng,lat GeoJSON) |
| Salida patrulla | **Fray Justo Sarmiento × Pelliza** ≈ `-34.5154, -58.5077` |
| Dueña | Pau Trivi (`paula`) · FB `pau.trivi` |
| Equipo | Gastón (`gaston`), Rodrigo (`rodrigo`) |
| Fotos | `public/panza/*` |
| Seed keys | `PANZA_OSINT_LEADS` + sighting `fb_gralpaz_2026_07_23` |

Bootstrap: `AuthProvider` muestra UI al toque; `ensurePanzaCase` + seed OSINT en background (flag `meta/seed_osint_v1`).

---

## 4. Rutas UI

| Ruta | Quién | Qué |
|------|-------|-----|
| `/` | familia | **Mapa only** (default) |
| `/bandeja` | familia | Inbox leads + capture paste |
| `/bandeja?capture=1` | familia | Pegar post → lead |
| `/bandeja?capture=sighting` | familia | Flujo avistaje |
| `/plan` | familia | Links Maps/Waze + modos carteles + progreso campaña |
| `/c/pancita` | público | Caso + reportar |
| `/c/pancite`, `/c/panza` | — | redirect → pancita |
| `/p/:posterCode` | QR cartel | redirect a público |

Shell: bottom nav Mapa / Bandeja / Plan · FAB `+` (ActionSheet). En `/` **no hay header**; P/G/R flotante + `···` tools.

---

## 5. Mapa operativo (núcleo)

### Vista default
- Pantalla = mapa a pantalla completa (sin chrome fijo).
- Flotante: **P | G | R** + botón **···**.
- Controles mapa: satélite/calles, mi ubicación, zoom (bottom-left).
- Overlay tools (`···`): modos carteles, HUD puesta de sol, riesgo, voz.

### Capas
| Capa | Archivo | Contenido |
|------|---------|-----------|
| Recorrido día | `DayRouteLayer` | Ida / destino / vuelta desde casa + stops cartel |
| Sightings | markers | Color por confidence + decay por `observedAt` |
| Tips | markers dashed | Leads con punto, no promovidos (no mueven zona oficial) |
| Coverage | `CoverageLayer` | Hex H3 peinados |
| Signs | `SignsLayer` | Carteles activos |
| Avoid | `AvoidAreasLayer` | Polígonos riesgo |
| Suggest | tint hex | `sugerirCarteles` (perímetro riesgo) |
| Yo | `MyLocationMarker` | GPS patrulla |
| Foco 23/7 | CircleMarker | Si Firestore vacío de sightings/tips |

### Modos carteles (`posterRoutes.ts`)
Persistidos en `localStorage` `panza.posterMode`:

| Id | Label | Comportamiento |
|----|-------|----------------|
| `dest_return` | Destino+vuelta | **Default.** Carteles en destino + regreso; ida gris |
| `full` | Ida+dest+vuelta | Carteles en los 3 tramos |
| `dest_only` | Solo destino | Carteles solo zona destino |

Salida fija: casa Fray Justo × Pelliza → foco Martelli → vuelta por Munro/Ugarte.

### Modo riesgo
Al activar: GPS pinta hex “evitar” mientras caminás. Al apagar: commit sweep a Firestore. **No es alarma.**

### GPS / carteles en campo
- `usePatrolGps`: walk cells, risk sweep, stop → `StopPosterPrompt` (“¿pegaste cartel?”).
- FAB / `/?placeSign=1`: coloca cartel en GPS actual.
- Offline: `fieldQueue` encola `place_sign` / `risk_sweep` y flush al volver online.

### Voz
- Botón Voz → `announceNav` → CatTS si vivo, si no `speechSynthesis`.
- Frases cortas en `voiceNav.ts`.

### Sol
- `solar.ts`: puesta de sol local + minutos de luz (HUD en panel tools).

---

## 6. Campaña carteles

Doc: **`SIGNS_CAMPAIGN.md`**. Código: `src/lib/signsCampaign.ts`.

| Parámetro | Valor |
|-----------|--------|
| Meta | **24** carteles activos |
| Ritmo | **1 viaje / día** |
| Start | `2026-07-28` |
| Horizonte | ~7 días planificados |
| Done | stops planeados + hex sugeridos críticos con `sign` active |

**Plan** muestra: `Día N/7 · carteles activos/24 (pct%)`.

Maps/Waze en Plan:
- Casa → Martelli (`PANZA_GMAPS_FROM_HOME_URL`, `PANZA_WAZE_HOME_URL`)
- Loops Martelli / Sarmiento (legacy bike)
- Pin avistaje 23/7

---

## 7. Operadores

| Short | Username | Nombre | Role |
|-------|----------|--------|------|
| P | `paula` | Pau Trivi | owner |
| G | `gaston` | G Alejandro Trivi | coordinator |
| R | `rodrigo` | Rodrii Perez Schmidt | coordinator |

- Switch en header (o flotante en mapa) → `switchOperator` sin password.
- Cache: `localStorage` `panza.operator`.
- Avatares opcionales: `public/operators/{p,g,r}.jpg` (fallback letra).

---

## 8. Bandeja / intake

- Pegar texto/URL/imagen → draft IndexedDB → lead Firestore.
- `detectIntake`: heurística origen (facebook/instagram/…).
- Coordinador puede promover lead → sighting.
- Tips con geo aparecen en mapa grisados hasta promover.

---

## 9. Público

- `/c/pancita`: animal, instrucciones, contacto, CTA reportar.
- Cloud Function crea lead/public report (ver `functions/`).
- Área pública deliberadamente gruesa (no exact team points).

---

## 10. Modelo de datos (Firestore)

Árbol principal:

```
cases/{caseId}
  members/{uid}
  leads/{id}
  sightings/{id}
  coverage/{h3Id}
  signs/{id}
  avoidAreas/{id}
  meta/seed_osint_v1
publicCases/{slug}
```

Entidades Zod (`src/domain/schemas.ts`): Case, Member, Lead, Sighting, Sign (tiers A–D), CoverageCell, AvoidArea, AuditEvent, PublicCase.

Geo: `[lng, lat]`.

**Rules actuales:** abiertas (`allow read, write: if true`) — MVP familiar. Ceiling documentado: cualquiera con URL puede escribir. Upgrade: Auth + roles.

---

## 11. Archivos clave (mapa mental)

```
src/
  app/           App, AppShell, ActionSheet
  domain/        schemas (+ tests)
  features/
    cases/       AuthProvider, useAuth
    map/         MapScreen, OperationalMap, layers, GPS, chips
    leads/       InboxScreen
    coverage/    PlanScreen
    public-report/
    intake/      detectIntake
  lib/
    panzaCase.ts      seed caso + loops + URLs
    posterRoutes.ts   casa + 3 modos carteles
    signsCampaign.ts  meta 24 / 1 viaje-día
    operators.ts      P/G/R
    catts.ts / voiceNav.ts / solar.ts
    geo/              h3Coverage, leadDecay
    firebase/         app, repos, fieldRepos, converters
    offline/          fieldQueue, drafts
  i18n/es-AR.ts
  styles/global.css
```

Docs: `CONTEXT.md`, `SIGNS_CAMPAIGN.md`, `HANDOFF.md`, `public/panza/RECORRIDO-BICI.md`.

Later (no código): **PANO** OSINT — https://t.co/CGqvwn0HIi → https://github.com/ALW1EZ/PANO

---

## 12. Env / comandos

```bash
yarn install
cp .env.example .env   # VITE_FIREBASE_* · VITE_CATTS_URL · VITE_CATTS_API_KEY
yarn dev               # http://127.0.0.1:8888
yarn test
yarn typecheck
yarn emulators         # Firestore local
yarn seed
```

CatTS default Tailscale: `http://100.87.252.18:59200`.

---

## 13. Tests presentes

- `posterRoutes`, `solar`, `voiceNav`, `catts`
- `h3Coverage`, `leadDecay`
- `schemas`, `detectIntake`
- `tests/rules/firestore.rules.test.ts` (emulators)

---

## 14. Qué está / qué no

### Hecho (v0.2.8)
- [x] Mapa fullscreen + capas campo (coverage, signs, avoid, tips, decay)
- [x] Salida casa + 3 modos carteles alteran recorrido
- [x] P/G/R switch
- [x] Campaña 1 viaje/día + progreso en Plan
- [x] GPS patrulla + modo riesgo + prompt cartel
- [x] Offline queue campo
- [x] Bandeja paste → lead → promote
- [x] Público `/c/pancita`
- [x] CatTS + fallback voz
- [x] HUD puesta de sol
- [x] Seed OSINT + sighting 23/7
- [x] PWA installable

### No / deferred
- [ ] Firebase Auth + rules reales
- [ ] Scraper / watcher FB automático
- [ ] Integrar PANO (solo docs)
- [ ] OCR carteles
- [ ] Turn-by-turn real sobre calles OSM (loops son waypoints)
- [ ] Avatares operadores (path listo, user guarda imgs)
- [ ] Commit/push limpio de toda esta línea (pendiente pedido user)

---

## 15. Riesgos conocidos (review)

1. **Rules abiertas** — cualquiera con la URL escribe. OK solo círculo familiar cerrado.
2. **Pass en client** — residual; switch P/G/R no la usa.
3. **Waypoints ≠ calles** — polilíneas aproximadas; navegación real vía Maps/Waze.
4. **Coords casa** — aproximadas cementerio/esquina; ajustar si hace falta precisión.
5. **FitBounds** incluye todo el recorrido casa↔Martelli — zoom amplio al abrir.
6. **Seed idempotente** depende de flag meta; borrar flag = re-seed.

---

## 16. Checklist review rápida (manual)

1. Abrir `/` → solo mapa + P/G/R + `···` + FAB + bottom nav.
2. `···` → cambiar modo carteles → ver colores/paradas ida/destino/vuelta.
3. Plan → ver día campaña + `activos/24` + links casa/Martelli/Sarmiento.
4. Bandeja `?capture=1` → pegar texto FB → lead.
5. GPS + Riesgo ON → caminar → OFF guarda avoid.
6. Voz → CatTS o speech del teléfono.
7. `/c/pancita` carga público.
8. Cambiar P↔G↔R persiste al refresh.

---

## 17. Criterio de “listo campaña carteles”

Una salida por día desde Fray Justo × Pelliza hasta:

- ≥ 24 `signs` `active`, **o**
- cobertura de stops del modo + hex `sugerirCarteles` críticos firmados,

lo que cierre primero la red en zona Martelli / Sarmiento / ida-vuelta Florida.
