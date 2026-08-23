import { cn } from '@/lib/utils'

export function Eyebrow({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-micro font-semibold uppercase tracking-[0.09em] text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}
