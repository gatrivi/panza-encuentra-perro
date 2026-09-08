# Panza → Herramienta general de búsqueda de perros perdidos

Plan para transformar "Operativo Pancita" (v0.3.21, single-case) en una app multi-caso
para coordinar búsquedas de perros perdidos en una zona (Florida–Martelli y más allá).

## Diagnóstico rápido

**Ya está y sirve tal cual / casi:**
- Mapa operativo en tiempo real con capas (avistamientos, cartels, cobertura, zonas de riesgo),
  GPS de patrulla, voz turno a turno, mapa local + OSM, export Google Maps/Waze.
- Modelo de datos multi-caso completo (`src/domain/schemas.ts`): Case, PublicCase, Member
  (roles owner/coordinator/searcher), Lead (con origen facebook/instagram/whatsapp y estado
  `duplicate`+`duplicateOf` — hoy nadie lo setea), Sighting (con `evidence.photos` y
  `confidence`), Sign, CoverageCell, AvoidArea, AuditEvent.
- Página pública `/c/:slug` + QR `/p/:posterCode` para reportes con geolocalización y dirección (brújula).
- Offline: caché persistente de Firestore + cola de escritura en IndexedDB.
- Firestore con `onSnapshot` → tiempo real entre teléfonos del equipo.

**Bloqueadores para uso público multi-caso:**
- Login hardcodeado (`src/lib/operators.ts`: 3 usuarios + contraseña de la familia en el
  bundle) y reglas de Firestore abiertas (`firestore.rules`: allow all).
- Todo lo Panza-hardcodeado: `src/lib/panzaCase.ts` (18KB de constantes), `fieldZone.ts`,
  `poiCatalog.ts`, `fieldTeams.ts`, rutas en `posterRoutes.ts`, bootstrap single-case en repos.
- La deduplicación existe en el schema pero no hay lógica ni UI.

## Fases

### Fase 0 — Limpieza y seguridad (sin la cual no se puede abrir a otros)
1. Firebase Auth real (login anónimo por teléfono con display name, o phone auth para
   coordinadores). Mapear Member.uid al auth uid; mantener el flujo "sin login" solo para
   la vista pública.
2. Reglas de Firestore por caso: escritura pública solo a `publicCases/*` y al callable
   `submitPublicReport`; `cases/{id}/**`lectura/escritura solo para members del caso con rol.
3. Cambiar `submitPublicReport` para escribir leads vía callable únicamente (ya existe la
   base) y sacar la ruta de escritura directa del cliente.
4. Mover secretos (contraseña, CatTS URL) fuera del bundle; borrar credenciales del repo
   si ya se filtraron.

### Fase 1 — Multi-caso (varios perros a la vez)
1. "Crear búsqueda" wizard (3 min desde el teléfono): nombre del perro, foto, zona
   (tocar el mapa), contacto público, rasgos. Genera Case + PublicCase + slug + posterCode.
2. Deshardcodear: mover animal/contactos/rutas/POIs de `panzaCase.ts` a datos del caso;
   el caso Panza queda como seed histórico (marcar `found`).
3. Lista de casos activos (home nueva: "Búsquedas activas" con mini-mapa y último avistamiento),
   el mapa actual pasa a ser por-caso (`/c/:slug/map`).
4. Estado del caso con ciclo de vida: active → stale/found/archived, y aviso de "sin
   avistamientos hace N días".

### Fase 2 — Checklist de rasgos para avistamientos sin foto (diferenciador clave)
 Hoy un reporte sin foto es texto libre difícil de comparar. Cambio:
1. Formulario estructurado (en la app Y en la página pública) con checkboxes/chips:
   tamaño (chico/mediano/grande), pelaje (corto/largo, color), orejas, cola, collar
   (sí/no + color), chapita, cojera/comportamiento, dirección de movimiento.
2. Extender `Sighting` (o `Lead.claimedObservation`) con `traits: {...}` versionado.
3. **Matching automático**: cada reporte sin foto se puntúa contra el perfil del perro
   del caso (rasgos coincidentes / contradictorios) → semáforo "compatible / dudoso /
   probablemente otro perro" en la bandeja y en el mapa. Los rasgos contradictorios
   (ej. "collar rojo" vs perfil "sin collar") marcan descarte rápido.
4. En el mapa: los sin-foto con traits compatibles se muestran como puntos punteados
   (ya existe el estilo para unverified) con los traits al tocar.

### Fase 3 — Deduplicación de posts repetidos (el dolor de Facebook)
 El schema ya tiene `status='duplicate'` + `duplicateOf`; hay que usarlo:
1. Flujo "pegar post de FB" (ya existe `detectIntake`): al pegar, calcular firma de
   similitud contra leads existentes del caso:
   - texto normalizado (minúsculas, sin acentos/puntuación) con shingles + Jaccard,
   - mismo teléfono extraído, misma foto/adjunto,
   - misma ubicación (H3 res 9-10) ± ventana de 2h,
   - reposts clásicos: mismo texto con "COMPARTIR"/"+1 día" → detectar substring.
2. Si supera umbral: sugerir "esto parece repetido del reporte de X (hace 2h)" con un
   botón **Unir** (merge: conserva el más antiguo, suma el link del repost como evidence,
   sube `priority` si hay múltiples reportes independientes) o "Es otro avistamiento".
3. Vista de línea de tiempo canónica por caso: un solo avistamiento por lugar/tiempo, con
   los N reportes de FB colapsados debajo. Esto es lo que hoy no existe en FB y confunde.
4. Más adelante: botón "publicar en FB" que genera el post con el link al caso público
   para que los nuevos reportes entren por la app y no por comentarios.

### Fase 4 — Fotos en el mapa (segundo diferenciador)
1. Subir foto en la página pública (el schema ya acepta `photoBase64`; falta el input +
   subir a Storage con compresión client-side).
2. Popups del mapa con foto miniatura + hace cuánto + dirección de movimiento.
3. Feed tipo "stories" por caso: últimas fotos en orden temporal para revisar de golpe
   "¿es el mismo perro?" — con botón "confirmar avistamiento" / "es otro perro".

### Fase 5 — Coordinación de campo (ya medio construido, generalizar)
- Patrullas: ya hay GPS + cobertura H3 + "voy a X"; agregar asignación de zonas a
  voluntarios y timestamp de "peinado a las HH:MM".
- Cartels: ya hay Signs con tiers y QR; generar PDF del cartel automáticamente desde el
  caso (foto + QR + teléfono) y "top lugares" por densidad de avistamientos (POI weights
  ya existen).
- Notificaciones push (hoy no hay ninguna): avistamiento confirmado → alerta a members.
- PWA real: el SW actual es un kill-switch; habilitar vite-plugin-pwa para "instalar"
  desde el QR.

## Orden sugerido y esfuerzo relativo
0 → 1 es el camino para poder onboardear a otra familia (fines de semana de trabajo).
2 y 3 son los diferenciadores y son independientes entre sí; 3 (dedup) es el que más
reduce la confusión actual en FB. 4 es chico una vez que 1 existe. 5 se va haciendo.

## Riesgos
- Costo de Firestore/Storage si hay muchas búsquedas públicas (mitigar: compresión de
  fotos, limpieza de casos archivados).
- Moderación: reportes falsos o spam en form público (mitigar: honeypot ya existe +
  rate limit del callable + flag "reporter confiable").
- Escalado geográfico: el mapa local raster es solo Florida–Martelli; fuera de ahí se
  usa OSM (ya está como underlay).
