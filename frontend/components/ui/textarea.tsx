import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2.5 text-[14px] shadow-xs transition-[border-color,box-shadow] duration-fast ease-out placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-brand focus-visible:shadow-[0_0_0_3px_var(--brand-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
