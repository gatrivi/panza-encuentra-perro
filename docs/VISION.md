# Visión del producto

**v0.2.0** · Caso piloto: **Panza**

## Qué queremos construir

Herramienta para que **cualquier familia encuentre su propio perro perdido**:

1. **Filtrar posteos** de redes/grupos por **área**, **horario**, **raza** y **color**
2. **Comparar imágenes** (reverse search + similitud visual) contra fotos del animal
3. **APIs de IA gratuitas** donde alcance (OCR, extracción de entidades, embeddings)
4. **Red colaborativa**: si muchas personas usan la app y cada una ve al mismo perro, el mapa y la bandeja convergen → más fácil encontrarlo

**Hoy (fase 1):** mapa operativo + recorridos de carteles + bandeja manual + OSINT básico.  
**Después:** ingest automático, scoring por foto, alertas por zona.

## Firebase (OK)

Proyecto **`pancita-busca-perro`**. La config web ya está **embebida** en `src/lib/firebase/config.ts` (no hace falta volver a pegar el boilerplate).

`.env` es **opcional** — solo override local. Si está vacío, la app usa los defaults del archivo.

Deploy hosting (desde tu máquina con `firebase login`):

```bash
yarn build && firebase deploy --only hosting
```

URL esperada: `https://pancita-busca-perro.web.app`

## Fase 2 (backlog IA / imágenes)

- [ ] Embeddings locales o API free tier (CLIP / Gemini flash) para comparar avistaje vs fotos Panza
- [ ] Filtro leads: bbox mapa + ventana temporal + raza/color en texto
- [ ] TinEye / Google Lens links automáticos por foto subida
- [ ] Webhook o RSS de grupos públicos (sin scrape FB)

## Fase 1 (ahora)

- [x] Mapa + avistajes
- [x] Bandeja paste
- [x] **Recorrido IDA → Tecnópolis + VUELTA** con carteles → `public/panza/RECORRIDO-TECNOPOLIS.md`
- [ ] Hosting deploy
