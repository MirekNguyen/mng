import * as React from "react"

import { cn } from "#/lib/utils.ts"

type EmptyStateProps = React.ComponentProps<"div"> & {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  size?: "default" | "large"
}

const EmptyState = ({
  icon,
  title,
  description,
  action,
  size = "default",
  className,
  ...props
}: EmptyStateProps) => (
  <div
    data-slot="empty-state"
    className={cn(
      "flex flex-col items-center text-center px-[var(--content-card-horizontal-padding)]",
      size === "large" ? "mt-[4rem]" : "mt-[4rem]",
      className
    )}
    {...props}
  >
    {icon && (
      <div className="mb-4 text-[var(--color-ink-faint)] [&>svg]:size-10">
        {icon}
      </div>
    )}
    <h3
      className={cn(
        "text-[length:var(--font-size-xl)] font-medium",
        size === "large" && "text-[length:var(--font-size-xxxl)] max-sm:text-[length:var(--font-size-xxl)] max-[450px]:text-[length:var(--font-size-xl)]"
      )}
    >
      {title}
    </h3>
    {description && (
      <p className="mt-2 max-w-[320px] text-sm text-[var(--color-ink-secondary)] leading-relaxed">
        {description}
      </p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
)

export { EmptyState }
