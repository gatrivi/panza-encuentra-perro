# Buscamos a Panza — agent notes

Mobile-first PWA (React 19 + Vite + TS strict + Firebase Firestore/Storage + Leaflet).
No Firebase Auth: login is client-side (`src/lib/operators.ts`) — users `paula`/`rodrigo`/`gaston`,
shared password `LasHeras413`. Session in `localStorage`.

## Cursor Cloud specific instructions

Deps: `yarn install` (root; handled by the startup update script). Node 22 / Yarn 1 / Java 21 are preinstalled.

Local dev runs against the Firebase **emulators** (never prod). `.env` must set `VITE_USE_EMULATORS=true`
(copy from `.env.example`; `.env` is gitignored so recreate it per VM).

Run (two processes):
- Emulators: `npx firebase emulators:start --only firestore,storage --project pancita-busca-perro`.
  Only Firestore+Storage are needed — the app connects just those (`src/lib/firebase/app.ts`). Do NOT use
  `yarn emulators`: it starts the `functions` codebase from `firebase.json`, which needs `functions/lib` built
  and isn't used by the current app.
- App: `yarn dev` → http://localhost:5173 (Vite binds localhost only; `127.0.0.1` won't respond). Public page: `/c/pancita`.

Data bootstraps automatically on first login (`ensurePanzaCase`/`ensureOperatorMember` in `src/lib/firebase/repos.ts`
seed the case, member, leads and sightings into the emulator). The standalone `yarn seed` script is not required for this flow.

Quality gates (all pass): `yarn typecheck`, `yarn lint`, `yarn test`, `yarn build`. Rules tests: `yarn test:rules`
(needs Java + Firestore emulator).

Known caveat: the Leaflet **operational map renders blank** in the automated/headless test browser (base tiles and
pins don't paint even though tiles are reachable and markers exist in data) — likely a viewport/`invalidateSize`
timing issue in that browser. The inbox (`Bandeja`) and the promote-lead→sighting write path work end to end; verify
map data via Firestore instead of the canvas when testing headlessly.
