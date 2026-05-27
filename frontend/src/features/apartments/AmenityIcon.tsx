import {
  AirVent,
  Bath,
  Building2,
  ChefHat,
  ParkingCircle,
  Refrigerator,
  Sofa,
  Sun,
  Thermometer,
  Wifi,
  WashingMachine,
} from 'lucide-react'

import { AmenityType } from '../../utils/types'

const MAP: Record<AmenityType, React.ComponentType<{ className?: string }>> = {
  [AmenityType.WiFi]: Wifi,
  [AmenityType.AC]: AirVent,
  [AmenityType.Heating]: Thermometer,
  [AmenityType.WashingMachine]: WashingMachine,
  [AmenityType.Parking]: ParkingCircle,
  [AmenityType.Furnished]: Sofa,
  [AmenityType.Elevator]: Building2,
  [AmenityType.Balcony]: Sun,
  [AmenityType.Kitchen]: ChefHat,
  [AmenityType.PrivateBathroom]: Bath,
}

// Fallback for any future amenity that doesn't yet have an icon.
const FALLBACK = Refrigerator

export function AmenityIcon({
  type,
  className,
}: {
  type: AmenityType
  className?: string
}) {
  const Icon = MAP[type] ?? FALLBACK
  return <Icon className={className ?? 'h-4 w-4'} />
}
