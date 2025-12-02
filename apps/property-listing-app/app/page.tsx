"use client"

import { useState } from "react"
import { properties, type Property } from "@/lib/properties"
import { PropertyMap } from "@/components/property-map"
import { PropertyDetail } from "@/components/property-detail"
import { PropertyList } from "@/components/property-list"
import { Button } from "@/components/ui/button"
import { List, Map } from "lucide-react"

export default function HomePage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showList, setShowList] = useState(false)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Pronájem nemovitostí</h1>
        <Button variant="outline" size="sm" onClick={() => setShowList(!showList)} className="md:hidden">
          {showList ? <Map className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
          {showList ? "Mapa" : "Seznam"}
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Property List (hidden on mobile unless toggled) */}
        <aside
          className={`w-full md:w-80 border-r bg-background overflow-y-auto p-4 ${
            showList ? "block" : "hidden md:block"
          }`}
        >
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {properties.length} nemovitost{properties.length !== 1 ? "í" : ""}
            </p>
          </div>
          <PropertyList
            properties={properties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
          />
        </aside>

        {/* Map */}
        <main className={`flex-1 relative ${showList ? "hidden md:block" : "block"}`}>
          <PropertyMap
            properties={properties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
          />

          {/* Property Detail Panel */}
          {selectedProperty && (
            <div className="absolute top-4 right-4 bottom-4 w-full max-w-sm z-[1000]">
              <PropertyDetail property={selectedProperty} onClose={() => setSelectedProperty(null)} />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
