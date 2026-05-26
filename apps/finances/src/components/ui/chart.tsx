import * as React from "react"
import { cn } from "#/lib/utils.ts"

type ChartConfig = Record<string, { label: string; color?: string }>

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

const useChart = () => {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a ChartContainer")
  return context
}

function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { config: ChartConfig }) {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        className={cn("", className)}
        {...props}
      >
        <ChartStyle config={config} />
        {children}
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ config }: { config: ChartConfig }) => {
  const cssVars = Object.entries(config).reduce(
    (acc, [key, value]) => {
      if (value?.color) {
        acc[`--color-${key}`] = value.color
      }
      return acc
    },
    {} as Record<string, string>,
  )

  return Object.keys(cssVars).length ? (
    <style
      dangerouslySetInnerHTML={{
        __html: `:root { ${Object.entries(cssVars)
          .map(([key, value]) => `${key}: ${value};`)
          .join("\n")} }`,
      }}
    />
  ) : null
}

function ChartTooltipContent({
  config,
  formatter,
  label,
}: {
  config: ChartConfig
  formatter?: (value: number) => string
  label?: string
}) {
  const active = true
  const payload = true

  if (!active || !payload) return null

  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-sm text-xs">
      {label && <p className="text-muted-foreground mb-1">{label}</p>}
      {Object.entries(config).map(([key, cfg]) => (
        <div key={key} className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full shrink-0"
            style={{ backgroundColor: cfg.color ?? "var(--color-accent)" }}
          />
          <span className="text-muted-foreground">{cfg.label}:</span>
          <span className="font-medium">{formatter ? formatter(0) : ""}</span>
        </div>
      ))}
    </div>
  )
}

export { ChartContainer, ChartTooltipContent }
