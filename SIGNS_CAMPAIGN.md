# Campaña carteles + tools later

## Later — OSINT tool (no integrar aún)

- Short: https://t.co/CGqvwn0HIi
- Repo: https://github.com/ALW1EZ/PANO
- Qué es: **PANO** (Platform for Analysis and Network Operations) — OSINT desktop (Python/Qt): graph, timeline, map, AI.
- Uso futuro posible: armar grafo FB/IG + timeline avistajes Panza fuera de la PWA.
- Licencia CC BY-NC → no comercial; solo investigación familiar.

## Target operativo (maps + timeline)

**Meta mínima:** **1200** carteles activos (`SIGNS_CAMPAIGN.targetActiveSigns`).

**Regla:** 1 viaje / día desde **Fray Justo Sarmiento × Pelliza** hasta completar la red de carteles.

| Día | Fecha (aprox) | Mapa / foco | Carteles (meta) | Modo app |
|-----|---------------|-------------|-----------------|----------|
| 0 | base | Casa → Martelli (destino+vuelta) | 6 paradas default | `dest_return` |
| 1 | D+1 | Mitad Martelli (Zufriategui / Shell) | +4–6 | `dest_return` |
| 2 | D+2 | Mitad Sarmiento (bordes parque) | +4–6 | `dest_only` o `full` |
| 3 | D+3 | Ida con carteles (Florida / Maipú) | +3–5 | `full` |
| 4 | D+4 | Vuelta distinta (Munro / Ugarte) | +3–5 | `dest_return` |
| 5–7 | D+5… | Huecos hex sugeridos + reposición | hasta **cerrar red** | según gaps |

**Done when:** todos los stops planeados + hex `sugerirCarteles` críticos tienen `sign` activo (status `active`). Una salida por día; no acumular dos zonas el mismo día si falta luz.

**Maps a usar (Plan):**
- Casa→Martelli: `PANZA_GMAPS_FROM_HOME_URL` / Waze casa
- Loop Martelli / Sarmiento existentes
- Pin 23/7

Progreso en app: Plan muestra `signs activos / meta`. Mapa default = **solo mapa**.
