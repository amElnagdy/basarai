import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-micro font-semibold uppercase tracking-[0.09em]",
  {
    variants: {
      variant: {
        default: "bg-brand-weak text-brand",
        muted: "bg-secondary text-muted-foreground",
        success: "bg-[color-mix(in_srgb,hsl(var(--success))_14%,white)] text-success",
        warning: "bg-[color-mix(in_srgb,hsl(var(--warning))_14%,white)] text-warning",
        danger: "bg-[color-mix(in_srgb,hsl(var(--destructive))_12%,white)] text-destructive",
        outline: "border border-border text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
