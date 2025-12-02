"use client"

import { useState } from "react"
import type { Property } from "@/lib/properties"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, ChevronLeft, ChevronRight, MapPin, Home, Zap } from "lucide-react"

interface PropertyDetailProps {
  property: Property
  onClose: () => void
}

export function PropertyDetail({ property, onClose }: PropertyDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % property.imageUrls.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + property.imageUrls.length) % property.imageUrls.length)
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Image Gallery */}
        <div className="relative aspect-video bg-muted">
          <img
            src={property.imageUrls[currentImageIndex] || "/placeholder.svg"}
            alt={`${property.name} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />

          {property.imageUrls.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={prevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={nextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {property.imageUrls.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? "bg-white" : "bg-white/50"
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">{property.name}</h2>
          <div className="flex items-center gap-2 text-muted-foreground mt-1">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Praha 3, Roháčova</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-lg font-bold px-3 py-1">
            {property.price.toLocaleString("cs-CZ")} Kč/měsíc
          </Badge>
        </div>

        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            <span>51 m²</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span>+ energie ~2 300 Kč</span>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2 text-foreground">Popis</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{property.description}</p>
        </div>

        <div className="pt-4">
          <Button className="w-full">Kontaktovat</Button>
        </div>
      </CardContent>
    </Card>
  )
}
