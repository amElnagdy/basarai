import { cn } from '@/lib/utils'

const variants = {
  info: 'border-border bg-secondary text-foreground',
  warning: 'border-[color-mix(in_srgb,hsl(var(--warning))_35%,hsl(var(--border)))] bg-[color-mix(in_srgb,hsl(var(--warning))_10%,white)] text-warning',
  danger: 'border-[color-mix(in_srgb,hsl(var(--destructive))_35%,hsl(var(--border)))] bg-[color-mix(in_srgb,hsl(var(--destructive))_8%,white)] text-destructive',
  success: 'border-[color-mix(in_srgb,hsl(var(--success))_35%,hsl(var(--border)))] bg-[color-mix(in_srgb,hsl(var(--success))_10%,white)] text-success',
} as const

export function Notice({
  variant = 'info',
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof variants
}) {
  return (
    <div
      role="status"
      className={cn('rounded-md border px-3.5 py-3 text-[13px] leading-snug', variants[variant], className)}
      {...props}
    />
  )
}
