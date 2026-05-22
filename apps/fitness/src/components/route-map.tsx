// @ts-expect-error no type declarations available
import polyline from '@mapbox/polyline'
import type { LngLatBoundsLike } from 'maplibre-gl'

import { Map, MapControls, MapMarker, MarkerContent, MarkerTooltip, MapRoute } from '#/components/ui/map.tsx'

type RouteMapProps = {
  encodedPolyline: string
  distanceMeters?: number
  averagePace?: string
  elevationGain?: number
}

// Calculate distance between two [lng, lat] points in meters (Haversine)
const haversine = (a: [number, number], b: [number, number]): number => {
  const toRad = (deg: number): number => (deg * Math.PI) / 180
  const R = 6371000
  const dLat = toRad(b[1] - a[1])
  const dLng = toRad(b[0] - a[0])
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * sinLng * sinLng
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

// Find coordinates at each km along the route
const getKmMarkers = (coordinates: Array<[number, number]>): Array<{ km: number; coord: [number, number] }> => {
  const markers: Array<{ km: number; coord: [number, number] }> = []
  let accumulatedDistance = 0
  let nextKm = 1000

  for (let i = 1; i < coordinates.length; i++) {
    const segmentDist = haversine(coordinates[i - 1], coordinates[i])
    accumulatedDistance += segmentDist

    if (accumulatedDistance >= nextKm) {
      markers.push({ km: nextKm / 1000, coord: coordinates[i] })
      nextKm += 1000
    }
  }

  return markers
}

export const RouteMap = ({ encodedPolyline }: RouteMapProps) => {
  const decoded: Array<[number, number]> = polyline.decode(encodedPolyline)
  if (decoded.length === 0) return null

  // Convert [lat, lng] to [lng, lat] for MapLibre
  const coordinates = decoded.map(([lat, lng]: [number, number]) => [lng, lat] as [number, number])

  // Calculate bounds
  const lngs = coordinates.map(([lng]) => lng)
  const lats = coordinates.map(([, lat]) => lat)
  const bounds: LngLatBoundsLike = [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ]

  const startCoord = coordinates[0]
  const endCoord = coordinates[coordinates.length - 1]
  const kmMarkers = getKmMarkers(coordinates)

  return (
    <Map
      bounds={bounds}
      fitBoundsOptions={{ padding: 48 }}
      cooperativeGestures
      attributionControl={{ compact: true }}
    >
      <MapRoute
        coordinates={coordinates}
        color="#fc4c02"
        width={3.5}
        opacity={0.9}
        interactive={false}
      />

      {/* Km markers */}
      {kmMarkers.map(({ km, coord }) => (
        <MapMarker key={km} longitude={coord[0]} latitude={coord[1]}>
          <MarkerContent>
            <div className="flex size-5 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
              <span className="text-[9px] font-semibold text-[var(--color-ink-secondary)]">{km}</span>
            </div>
          </MarkerContent>
          <MarkerTooltip>{km} km</MarkerTooltip>
        </MapMarker>
      ))}

      {/* Start marker */}
      <MapMarker longitude={startCoord[0]} latitude={startCoord[1]}>
        <MarkerContent>
          <div className="size-3.5 rounded-full border-2 border-white bg-green-600 shadow-md" />
        </MarkerContent>
        <MarkerTooltip>Start</MarkerTooltip>
      </MapMarker>

      {/* End marker */}
      <MapMarker longitude={endCoord[0]} latitude={endCoord[1]}>
        <MarkerContent>
          <div className="size-3.5 rounded-full border-2 border-white bg-red-600 shadow-md" />
        </MarkerContent>
        <MarkerTooltip>Finish</MarkerTooltip>
      </MapMarker>

      <MapControls position="top-right" showZoom showFullscreen />
    </Map>
  )
}
