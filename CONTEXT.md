# Buscamos a Panza — context

**v0.2.8** · Vista default = **solo mapa** (tools en `···`). P/G/R flotante. Campaña 1 viaje/día → `SIGNS_CAMPAIGN.md`.
**Review completo:** `APP_REVIEW.md`
Later (docs): [PANO OSINT](https://t.co/CGqvwn0HIi) → https://github.com/ALW1EZ/PANO
Salida Fray Justo × Pelliza · 3 modos carteles · CatTS.
**Modo riesgo:** GPS marca hex a evitar.
Rebase v0.1.4: carteles Constituyentes × Maipú + nav GPS in-app conservados.
**No Firebase Auth.** Login = usuario (`paula`/`rodrigo`/`gaston`) + pass familiar en cliente.
Sesión en `localStorage` → mismo dispositivo entra al mapa.

Firestore rules abiertas (MVP familiar). Ceiling: URL pública puede escribir. Upgrade: Auth.

Fotos: `public/panza/*` · Seed: FB Pau + IG `@buscamos.a.panza`

## Sonnet direction (integrado selectivo)

Zip `files (1).zip` → `_sonnet-direction/`. Ver `INTEGRATED.md`.
- **decay** leads/sightings por `observedAt` (rojo→gris)
- **tips sin verificar** en mapa (puntos dashed, no mueven zona)
- **zonaYaPeinada** hint en GPS
- **persistentLocalCache** Firestore (prod; emulator = memory)
- No: rules Auth / modelo flat / replace schemas

## Equipo (FB)

- **Dueña / posts centrales:** Pau Trivi (Poli) — `facebook.com/pau.trivi` · Olivos · `paupocket`
- **Secundarios (tags):** Rodrii Perez Schmidt (`rodrigo`) · G Alejandro Trivi (`gaston`)
- **Contactos flyer:** 1156194761 / 1130400210

## Timeline OSINT FB (Brave, 27/7/2026)

| Fecha | Qué | Dónde |
|-------|-----|-------|
| 15/7 | Escape | Olivos, zona cementerio (fin partido) |
| ~18/7 | Corriendo | Vicente López; posible San Martín |
| ~19/7 | Carteles bici | Olivos, Florida, La Lucila, Martínez, Munro |
| ~21/7 | Sin novedades desde domingo; recompensa; posible retención | Vicente López ampliado |
| ~22/7 | Avistaje: asustada, no se deja | Villa Martelli + Florida |
| **23/7 noche** | Avistaje fuerte (promovido) | Banquina Gral Paz → Villa Martelli (Parque Sarmiento) |

Lead keys en app: `PANZA_OSINT_LEADS` + `fb_gralpaz_2026_07_23`.

## Último foco operativo (carteles)

- **Dónde:** **Av. Constituyentes × Maipú**, Villa Martelli / Villa Maipú.
- **Recorrido 30 paradas / ~2 h:** `public/panza/RECORRIDO-CONSTITUYENTES.md` + app **Plan** (nav GPS in-app).
- **Mapa:** toggle **Carteles** muestra pins numerados + polyline.
- Epicentro: `-34.5633,-58.5152`

## Avistaje anterior (23/7 noche)

- **Dónde:** banquina Av. Gral Paz, cerca Parque Sarmiento, **mano Villa Martelli** (Pista Miguel Sánchez / Plazoleta El Ombú).
- **Estado:** cansada, desorientada, asustada, **no se deja agarrar**, corre. Chapita OK.
- **Regla:** solo familia retiene. Seguir a distancia → llamar 1156194761 / 1130400210.
- **FB:** https://www.facebook.com/share/p/1BgkXzFdgY/
- **Mapa pin (aprox):** `[-58.508, -34.551]` · foto `public/panza/avistaje-gralpaz-2026-07-23.png`
- Al login, bootstrap escribe leads OSINT + sighting `fb_gralpaz_2026_07_23` y recentra el mapa.

## Plan legacy (24/7) — bici · dos mitades

- Esquema: `public/panza/recorrido-bici-gralpaz.png`
- Links: `public/panza/RECORRIDO-BICI.md` · app **Plan** (sección colapsable)
- **Martelli (oeste):** Zufriategui / Tecnópolis (tu ruta ~10 km)
- **Sarmiento (CABA):** bordes parque, pista, Balbín, Lugones/Miller
- **No** calzada Gral Paz

1. Banquina Gral Paz Parque Sarmiento → Villa Martelli (ambos lados, mirando desde paralelo)
2. Plazoleta El Ombú + borde verde Parque Sarmiento
3. Villa Martelli: Zufriategui + Perú/Chile/Venezuela pegadas a Gral Paz
4. Shell/YPF de esa banquina — sin rodear

Origen escape: 15/7 Olivos cementerio. Ya se movió ~Gral Paz / Martelli / Florida / Constituyentes.
