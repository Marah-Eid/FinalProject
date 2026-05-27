import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import { useTranslation } from 'react-i18next'

import { cn } from '../../utils/cn'
import '../../lib/leaflet'

type LatLng = [number, number]

type Props = {
  value: LatLng
  onChange: (latlng: LatLng) => void
  className?: string
  height?: number | string
}

/**
 * Click-to-pin map for the owner's new-listing form. Always LTR internally
 * (geographic coords are direction-agnostic).
 */
export function LocationPicker({ value, onChange, className, height = 320 }: Props) {
  const { t } = useTranslation()
  return (
    <div className={cn('overflow-hidden rounded-2xl border border-neutral-200', className)} dir="ltr">
      <div className="border-b border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600">
        {t('newListing.location.hint')}
      </div>
      <MapContainer
        center={value}
        zoom={13}
        style={{ height, width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        <Marker position={value} />
      </MapContainer>
    </div>
  )
}

function ClickHandler({ onChange }: { onChange: (latlng: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}
