# Operativo Pancita (Panza / Pancite)

PWA móvil para coordinar la búsqueda de **Pancita**, también llamada **Panza** o **Pancite**. Convierte reportes públicos, publicaciones pegadas, avistajes, carteles y tareas de campo en un mapa operativo compartido.

**Versión:** `0.2.0` · **Licencia:** AGPL-3.0 · **Idioma:** español (Argentina)

## Qué funciona

- `/c/pancita` es la URL canónica; `/c/pancite` y `/c/panza` siguen funcionando.
- **La estoy viendo** crea un lead privado prioritario mediante Cloud Function.
- **Bandeja** acepta texto, URL o imagen pegada y conserva borradores offline.
- Owner/coordinador verifica leads y los promueve a avistajes con fecha, punto y confianza.
- El mapa muestra avistajes, carteles por tier y una zona operativa ajustable.
- **Plan** ofrece tareas compartidas, responsables, prioridades, carteles y mantenimiento.
- Invitaciones seguras por email para el equipo; producción no tiene “primer usuario = owner”.
- Firestore separa reportería pública, datos privados, roles e invitaciones.

La respuesta de campo sigue principios conservadores usados en búsqueda de perros perdidos: no perseguir ni llamar a un perro huidizo, registrar hora/dirección/evidencia, centralizar información y usar comida, cámaras o trampas sólo con una persona responsable y monitoreo. La organización adopta un ciclo simple de briefing → tareas con responsable → debrief, inspirado en planificación de incidentes. Referencias: [Missing Animal Response Network](https://www.missinganimalresponse.com/lost-dog-behavior/), [Humane World for Animals](https://www.humaneworld.org/en/resources/how-find-lost-dog) y [FEMA Incident Action Planning](https://emilms.fema.gov/is_822/groups/310.html).

## Inicio local

Requiere Node 22+, Yarn 1 y Java para el emulador de Firestore.

```bash
yarn install
yarn --cwd functions install
yarn --cwd functions build
cp .env.example .env
```

Terminal A:

```bash
yarn emulators
```

Terminal B:

```bash
yarn seed
yarn dev
```

- App: http://127.0.0.1:5173
- Página pública: http://127.0.0.1:5173/c/pancita
- Alias compatibles: `/c/pancite`, `/c/panza`
- Emulator UI: http://127.0.0.1:4000
- Login demo owner: `owner@example.com` con cualquier contraseña nueva de 6+ caracteres

## Firebase y Google Auth en producción

1. Creá un proyecto Firebase y una Web App.
2. En **Authentication → Sign-in method**, habilitá **Google** (y Email/Password si lo querés conservar), elegí el email de soporte y agregá el dominio de producción a **Authorized domains**.
3. Copiá la configuración web a `.env` y dejá `VITE_USE_EMULATORS=false`.
4. Copiá `functions/.env.example` a `functions/.env.<project-id>` y configurá `OWNER_BOOTSTRAP_EMAIL` con tu email real. No lo subas al repositorio.
5. Adaptá `seed/seed-demo.ts` o tu import seguro para crear `publicCases/pancita`, `publicCases/pancite` y `publicCases/panza`, sin teléfonos privados.
6. Compilá y desplegá reglas y Functions. Entrá primero con el email configurado; luego invitá a tu hermana y cuñado desde **Plan → Equipo**.

```bash
yarn build
yarn --cwd functions build
firebase deploy --only firestore:rules,storage,functions
```

## Controles de calidad

```bash
yarn typecheck
yarn lint
yarn test
yarn test:rules
yarn build
yarn --cwd functions build
```

## Privacidad y seguridad

- Clientes públicos sólo leen la proyección sanitizada `publicCases/{slug}`.
- Contactos de reporteros, leads, tareas, ubicaciones y zonas de seguridad son privados.
- Invitaciones contienen emails y sólo son accesibles mediante Functions confiables.
- Un reporte sin verificar nunca mueve la zona operativa.
- Los riesgos de recorrido deben describirse con hechos observables; no se etiquetan barrios o personas.

## Próximos pasos

H3 para cobertura por manzana, salidas con GPS temporal, rutas con áreas privadas a evitar, OCR, Share Target y asistencia de navegador para capturar publicaciones públicas. No se incluye scraping autónomo ni acceso a cuentas de Facebook.

El contrato de producto completo permanece en `OPERATIVO_PANCITE_BUILD_BRIEF.md` por compatibilidad histórica; su nombre canónico actual es **Operativo Pancita**.
