"use client"

import type { Property } from "@/lib/properties"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Home } from "lucide-react"

interface PropertyListProps {
  properties: Property[]
  selectedProperty: Property | null
  onSelectProperty: (property: Property) => void
}

export function PropertyList({ properties, selectedProperty, onSelectProperty }: PropertyListProps) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Žádné nemovitosti neodpovídají vašim filtrům.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {properties.map((property) => (
        <Card
          key={property.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedProperty?.id === property.id ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectProperty(property)}
        >
          <CardContent className="p-3">
            <div className="flex gap-3">
              <img
                src={property.imageUrls[0] || "/placeholder.svg"}
                alt={property.title}
                className="w-24 h-20 object-cover rounded-md flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate text-foreground">{property.title}</h3>
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs truncate">{property.address}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                  <Home className="h-3 w-3" />
                  <span className="text-xs">{property.usableArea}</span>
                </div>
                <Badge variant="secondary" className="mt-2 text-xs">
                  {property.price.toLocaleString("cs-CZ")} Kč/měsíc
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

