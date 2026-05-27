import { useEffect } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'

import { cn } from '../../utils/cn'
import '../../lib/leaflet'  // side-effect: registers default marker icons

type LatLng = [number, number]

export type ApartmentMarker = {
  id: string
  position: LatLng
  title: string
  /** Optional content shown in the popup; if omitted, just the title. */
  content?: React.ReactNode
}

type Props = {
  center: LatLng
  zoom?: number
  markers?: ApartmentMarker[]
  className?: string
  /** Inline height — Leaflet needs an explicit dimension to render. */
  height?: string | number
  scrollWheelZoom?: boolean
}

/**
 * Thin Leaflet wrapper around the OpenStreetMap raster tiles. The map's
 * internal direction stays LTR even in RTL layouts (geographic coordinates
 * are direction-agnostic); the surrounding UI handles localization.
 */
export function ApartmentMap({
  center,
  zoom = 14,
  markers = [],
  className,
  height = 360,
  scrollWheelZoom = false,
}: Props) {
  return (
    <div
      className={cn('overflow-hidden rounded-2xl border border-neutral-200', className)}
      style={{ height }}
      dir="ltr"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={scrollWheelZoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBoundsOnChange markers={markers} center={center} />
        {markers.map((m) => (
          <Marker key={m.id} position={m.position}>
            <Popup>{m.content ?? <strong>{m.title}</strong>}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

/** Auto-fits the viewport to the visible markers, falling back to center. */
function FitBoundsOnChange({ markers, center }: { markers: ApartmentMarker[]; center: LatLng }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) {
      map.setView(center)
      return
    }
    if (markers.length === 1) {
      map.setView(markers[0].position, Math.max(map.getZoom(), 13))
      return
    }
    const bounds = markers.map((m) => m.position)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [markers, center, map])
  return null
}
