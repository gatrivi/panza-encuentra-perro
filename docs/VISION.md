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

Proyecto **`pancita-busca-perro`** en consola Firebase — configuración correcta.

| Campo | Valor |
|-------|--------|
| Project ID | `pancita-busca-perro` |
| Project number | `228835710484` |
| Web app | `pancita-busca-perro` |

Variables en `.env` (copiar de consola → Project settings → Your apps):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=pancita-busca-perro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pancita-busca-perro
VITE_FIREBASE_STORAGE_BUCKET=pancita-busca-perro.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=228835710484
VITE_FIREBASE_APP_ID=1:228835710484:web:...
```

Deploy hosting: `yarn build && firebase deploy --only hosting`

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
