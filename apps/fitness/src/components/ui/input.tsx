import * as React from "react"

import { cn } from "#/lib/utils.ts"

const Input = ({ className, type, ...props }: React.ComponentProps<"input">) => (
  <input
    type={type}
    data-slot="input"
    className={cn(
      "flex h-[var(--input-height)] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--input-horizontal-padding)] py-[var(--input-vertical-padding)] text-[length:var(--input-font-size)] transition-colors placeholder:text-[var(--color-ink-faint)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
)

const InputSmall = ({ className, ...props }: React.ComponentProps<"input">) => (
  <input
    data-slot="input-small"
    className={cn(
      "flex h-[var(--small-input-height)] w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-[0.625rem] py-[0.4375rem] text-[length:var(--small-input-font-size)] transition-colors placeholder:text-[var(--color-ink-faint)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
)

const InputLarge = ({ className, ...props }: React.ComponentProps<"input">) => (
  <input
    data-slot="input-large"
    className={cn(
      "flex h-[var(--large-input-height)] w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--large-input-horizontal-padding)] py-[var(--large-input-vertical-padding)] text-[length:var(--large-input-font-size)] transition-colors placeholder:text-[var(--color-ink-faint)] hover:border-[var(--color-border-strong)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]/40 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
)

export { Input, InputSmall, InputLarge }
