import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Sign } from '@/domain/schemas'

const signIcon = L.divIcon({
  className: 'marker-sign',
  html: `<span style="display:block;width:12px;height:18px;background:#c45c26;border:2px solid #fff;border-radius:2px 2px 0 0;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
  iconSize: [12, 18],
  iconAnchor: [6, 18],
})

export function SignsLayer({ signs }: { signs: Sign[] }) {
  return (
    <>
      {signs
        .filter((s) => s.status === 'active')
        .map((s) => (
          <Marker key={s.id} position={[s.point[1], s.point[0]]} icon={signIcon}>
            <Popup>
              <strong>Cartel {s.tier}</strong>
              <p>{s.createdAt.toLocaleString('es-AR')}</p>
              {s.notes ? <p>{s.notes}</p> : null}
            </Popup>
          </Marker>
        ))}
    </>
  )
}
