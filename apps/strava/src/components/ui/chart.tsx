import { type ReactNode } from 'react'

export type ChartConfig = Record<string, {
  label: string
  color: string
}>

type ChartContainerProps = {
  config: ChartConfig
  children: ReactNode
  className?: string
}

export const ChartContainer = ({ config, children, className }: ChartContainerProps) => {
  const cssVars = Object.entries(config).reduce<Record<string, string>>((acc, [key, val]) => {
    acc[`--color-${key}`] = val.color
    return acc
  }, {})

  return (
    <div className={className} style={cssVars as React.CSSProperties}>
      {children}
    </div>
  )
}

type ChartTooltipContentProps = {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string; dataKey: string }>
  label?: string
  config: ChartConfig
  formatter?: (value: number, name: string) => string
}

export const ChartTooltipContent = ({ active, payload, label, config, formatter }: ChartTooltipContentProps) => {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 shadow-md">
      {label && <p className="text-xs text-[var(--color-ink-tertiary)] mb-1">{label}</p>}
      {payload.map((entry) => {
        const configEntry = config[entry.dataKey]
        const displayValue = formatter ? formatter(entry.value, entry.dataKey) : entry.value
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || configEntry?.color }} />
            <span className="text-[var(--color-ink-secondary)]">{configEntry?.label ?? entry.name}</span>
            <span className="font-medium ml-auto">{displayValue}</span>
          </div>
        )
      })}
    </div>
  )
}
