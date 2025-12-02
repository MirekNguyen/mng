"use client"

import type { FilterOptions } from "@/lib/properties"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Search, X, SlidersHorizontal } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

interface PropertyFiltersProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  onReset: () => void
  resultCount: number
}

export function PropertyFilters({ filters, onFiltersChange, onReset, resultCount }: PropertyFiltersProps) {
  const hasActiveFilters =
    filters.minPrice > 0 ||
    filters.maxPrice < 100000 ||
    filters.minArea > 0 ||
    filters.maxArea < 500 ||
    filters.searchQuery !== ""

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Hledat podle názvu nebo adresy..."
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          className="pl-9 pr-9"
        />
        {filters.searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onFiltersChange({ ...filters, searchQuery: "" })}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Filter Button with Sheet */}
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1 bg-transparent">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtry
              {hasActiveFilters && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">!</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filtry</SheetTitle>
              <SheetDescription>Upravte parametry vyhledávání</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Cena: {filters.minPrice.toLocaleString("cs-CZ")} - {filters.maxPrice.toLocaleString("cs-CZ")} Kč
                </Label>
                <Slider
                  value={[filters.minPrice, filters.maxPrice]}
                  min={0}
                  max={100000}
                  step={1000}
                  onValueChange={([min, max]) => onFiltersChange({ ...filters, minPrice: min, maxPrice: max })}
                  className="mt-2"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Od</Label>
                    <Input
                      type="number"
                      value={filters.minPrice}
                      onChange={(e) => onFiltersChange({ ...filters, minPrice: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Do</Label>
                    <Input
                      type="number"
                      value={filters.maxPrice}
                      onChange={(e) => onFiltersChange({ ...filters, maxPrice: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Area Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Plocha: {filters.minArea} - {filters.maxArea} m²
                </Label>
                <Slider
                  value={[filters.minArea, filters.maxArea]}
                  min={0}
                  max={500}
                  step={5}
                  onValueChange={([min, max]) => onFiltersChange({ ...filters, minArea: min, maxArea: max })}
                  className="mt-2"
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Od</Label>
                    <Input
                      type="number"
                      value={filters.minArea}
                      onChange={(e) => onFiltersChange({ ...filters, minArea: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">Do</Label>
                    <Input
                      type="number"
                      value={filters.maxArea}
                      onChange={(e) => onFiltersChange({ ...filters, maxArea: Number(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              {hasActiveFilters && (
                <Button variant="outline" className="w-full bg-transparent" onClick={onReset}>
                  <X className="h-4 w-4 mr-2" />
                  Resetovat filtry
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        {resultCount} nemovitost{resultCount !== 1 ? "í" : ""}
      </p>
    </div>
  )
}

