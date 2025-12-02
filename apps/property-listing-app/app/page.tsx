"use client";

import { useState, useMemo } from "react";
import {
  filterProperties,
  defaultFilters,
  type Property,
  type FilterOptions,
} from "@/lib/properties";
import { PropertyMap } from "@/components/property-map";
import { PropertyDetail } from "@/components/property-detail";
import { PropertyList } from "@/components/property-list";
import { PropertyFilters } from "@/components/property-filters";
import { Button } from "@/components/ui/button";
import { List, Map } from "lucide-react";
import { useProperties } from "@/hooks/use-property";

export default function HomePage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null,
  );
  const [showList, setShowList] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const { data: properties = [], isLoading, isError } = useProperties();

  const handleResetFilters = () => {
    setFilters(defaultFilters);
  };

  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    return filterProperties(properties, filters);
  }, [properties, filters]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load properties.</p>;

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          Pronájem nemovitostí
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowList(!showList)}
          className="md:hidden"
        >
          {showList ? (
            <Map className="h-4 w-4 mr-2" />
          ) : (
            <List className="h-4 w-4 mr-2" />
          )}
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
          <PropertyFilters
            filters={filters}
            onFiltersChange={setFilters}
            onReset={handleResetFilters}
            resultCount={filteredProperties.length}
          />

          <div className="mt-4">
            <PropertyList
              properties={filteredProperties}
              selectedProperty={selectedProperty}
              onSelectProperty={setSelectedProperty}
            />
          </div>
        </aside>

        {/* Map */}
        <main
          className={`flex-1 relative ${showList ? "hidden md:block" : "block"}`}
        >
          <PropertyMap
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onSelectProperty={setSelectedProperty}
          />

          {/* Property Detail Panel */}
          {selectedProperty && (
            <div className="absolute top-4 right-4 bottom-4 w-full max-w-sm z-[1000]">
              <PropertyDetail
                property={selectedProperty}
                onClose={() => setSelectedProperty(null)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
