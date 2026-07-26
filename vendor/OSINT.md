# OSINT Core — v0.2.0

## Repos elegidos

| Rol | Repo | Por qué |
|-----|------|---------|
| **Catálogo** | [jivoi/awesome-osint](https://github.com/jivoi/awesome-osint) | Estándar de la industria (~48k★). Lista curada de herramientas OSINT. |
| **Motor** | [OpenOSINT/OpenOSINT](https://github.com/OpenOSINT/OpenOSINT) | Framework modular MIT: herramientas encadenables, dorks, MCP. Patrón replicado en TS. |

## Implementación en la app

```
src/lib/osint/
  catalog.ts   ← subset awesome-osint (geo, imagen, social, búsqueda)
  dorks.ts     ← generador Google Dorks (estilo OpenOSINT)
  engine.ts    ← pipeline: recon → collect → analyze → hits
  exif.ts      ← GPS local en fotos (sin upload)
src/features/osint/OsintScreen.tsx  ← pantalla principal (home)
```

## Flujo operativo

1. **Intel** (home) → Ejecutar escaneo completo
2. Dorks FB/IG/web + watch queries + análisis de corredor
3. Hallazgos → links directos a búsquedas
4. Pegar texto/foto → extracción local → **Bandeja** para promover avistaje

## Límites (ponytail)

- Sin scraping autónomo de Facebook/Instagram (ToS + bloqueos)
- EXIF parser mínimo (no exiftool completo)
- Investigaciones en `localStorage` (Firestore en próximo hito)
- OpenOSINT Python no embebido — arquitectura portada a TS client-side

## Upgrade path

- Cloud Function Python con `openosint` pip para dork scrape server-side
- Firestore `investigations/` + `mentions/`
- Webhook RSS grupos públicos permitidos
