# Operativo Pancite

Mobile-first installable web app that turns sightings, social posts and search outings into one verified operational map.

**Version:** `0.1.0` — Milestone 1 vertical slice  
**License:** AGPL-3.0  
**Language:** Spanish (Argentina) first

## Milestone 1 (this release)

- PWA shell + `es-AR` i18n dictionary
- Google / emulator sign-in with Firestore membership roles
- Public page `/c/:slug` + **LA ESTOY VIENDO** via Cloud Function
- Private **Bandeja** paste capture (text/URL/image) with IndexedDB draft then Firestore lead
- Coordinator promote lead → sighting
- Operational map with confidence markers
- Firestore/Storage rules + emulator rule tests
- Demo seed (San Ramón y Maipú; Cementerio de Olivos focus)

Not in M1: OCR, coverage grid, routing, live tracking, Facebook scraping.

## Quick start (local)

```bash
yarn install
yarn --cwd functions install
yarn --cwd functions build
cp .env.example .env
```

Terminal A — emulators:

```bash
yarn emulators
# or: npx firebase emulators:start
```

Terminal B — seed + app:

```bash
yarn seed
yarn dev
```

- App: http://127.0.0.1:5173  
- Public: http://127.0.0.1:5173/c/pancite  
- Emulator UI: http://127.0.0.1:4000  

Local demo login: **Demo local (owner)** uses `owner@example.com` (matches `VITE_OWNER_BOOTSTRAP_EMAIL`). Owner membership is bootstrapped on first sign-in when that email matches.

## Quality gates

```bash
yarn typecheck && yarn lint && yarn test && yarn build
```

Firestore tests need the Firestore emulator (requires **Java** on PATH):

```bash
yarn test:rules
```

If Java is missing, unit tests still run; install a JDK to execute rules tests.

## Firebase setup (production)

1. Create a Firebase project; enable Auth (Google), Firestore, Storage, Functions.
2. Copy web config into `.env` from `.env.example`.
3. Set `VITE_OWNER_BOOTSTRAP_EMAIL` to the owner Google account.
4. Set `VITE_USE_EMULATORS=false`.
5. Deploy rules, functions, and host the Vite `dist/` (or Firebase Hosting).
6. Run a one-time seed/import (adapt `seed/seed-demo.ts`) **without** private phones in the public repo.

Public reports never write Firestore directly; they call `submitPublicReport`.

## Privacy

- Public clients only read `publicCases/{slug}`.
- Reporter contact, leads, live locations and avoid areas stay private.
- Soft-archive evidence; do not silently destroy operational records.

See `OPERATIVO_PANCITE_BUILD_BRIEF.md` for the full product contract.

## Context for agents

- Stack: React 19 + Vite + TS strict + Firebase + Leaflet + Zod + vite-plugin-pwa
- Feature folders under `src/features/*`; domain schemas in `src/domain/schemas.ts`
- Continue **one milestone at a time** after M1 is verified
