import * as React from "react"

import { cn } from "#/lib/utils.ts"

const Switch = ({
  className,
  size = "default",
  variant = "default",
  ...props
}: React.ComponentProps<"button"> & {
  size?: "default" | "small" | "large"
  variant?: "default" | "success" | "error"
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) => {
  const [checked, setChecked] = React.useState(props.checked ?? false)

  React.useEffect(() => {
    if (props.checked !== undefined) setChecked(props.checked)
  }, [props.checked])

  const handleClick = () => {
    const next = !checked
    if (props.checked === undefined) setChecked(next)
    props.onCheckedChange?.(next)
  }

  const sizeClasses = {
    default: "w-[3rem] h-[1.75rem] after:size-[calc(1.75rem-0.25rem)] after:left-[0.125rem]",
    small: "w-[2.25rem] h-[1.25rem] after:size-[calc(1.25rem-0.25rem)] after:left-[0.125rem]",
    large: "w-[3.75rem] h-[2.25rem] after:size-[calc(2.25rem-0.25rem)] after:left-[0.125rem]",
  }

  const variantBg = {
    default: "bg-[var(--color-accent)]",
    success: "bg-[var(--color-success)]",
    error: "bg-[var(--color-heart)]",
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      data-slot="switch"
      className={cn(
        "peer relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size],
        checked ? variantBg[variant] : "bg-[var(--color-border)]",
        "after:pointer-events-none after:absolute after:rounded-full after:bg-white after:shadow-xs after:transition-transform after:content-['']",
        checked && "after:translate-x-[calc(100%+0px)]",
        className
      )}
      onClick={handleClick}
      {...props}
    />
  )
}

export { Switch }
