"use client"

import { useEffect, useRef, useState } from "react"
import type { Property } from "@/lib/properties"

interface PropertyMapProps {
  properties: Property[]
  selectedProperty: Property | null
  onSelectProperty: (property: Property) => void
}

export function PropertyMap({ properties, selectedProperty, onSelectProperty }: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load Leaflet CSS
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)

    // Load Leaflet JS
    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.onload = () => setIsLoaded(true)
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(link)
      document.head.removeChild(script)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    const L = (window as any).L
    if (!L) return

    // Initialize map centered on Prague
    const map = L.map(mapRef.current).setView([50.0875, 14.4213], 13)
    mapInstanceRef.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)

    // Add markers for each property
    properties.forEach((property) => {
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="width: 36px; height: 36px; background: white; border: 2px solid #6366f1; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      })

      const marker = L.marker([property.latitude, property.longitude], { icon }).addTo(map)

      marker.on("click", () => {
        onSelectProperty(property)
      })

      marker.bindTooltip(
        `<div style="font-weight: 600; font-size: 14px;">${property.price.toLocaleString("cs-CZ")} Kč/měsíc</div>`,
        {
          permanent: false,
          direction: "top",
          offset: [0, -20],
        },
      )

      markersRef.current.set(property.id, marker)
    })

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [isLoaded, properties, onSelectProperty])

  // Update marker styles when selection changes
  useEffect(() => {
    if (!isLoaded) return
    const L = (window as any).L
    if (!L) return

    markersRef.current.forEach((marker, id) => {
      const isSelected = selectedProperty?.id === id
      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="width: ${isSelected ? "44px" : "36px"}; height: ${isSelected ? "44px" : "36px"}; background: ${isSelected ? "#6366f1" : "white"}; border: 2px solid #6366f1; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2); cursor: pointer; transition: all 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="${isSelected ? "22" : "18"}" height="${isSelected ? "22" : "18"}" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? "white" : "#6366f1"}" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>`,
        iconSize: [isSelected ? 44 : 36, isSelected ? 44 : 36],
        iconAnchor: [isSelected ? 22 : 18, isSelected ? 44 : 36],
      })
      marker.setIcon(icon)
    })

    // Pan to selected property
    if (selectedProperty && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([selectedProperty.latitude, selectedProperty.longitude], {
        animate: true,
      })
    }
  }, [selectedProperty, isLoaded])

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-muted-foreground">Načítání mapy...</div>
      </div>
    )
  }

  return <div ref={mapRef} className="w-full h-full rounded-lg" />
}
