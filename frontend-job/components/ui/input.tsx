import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border-2 border-border/60 bg-card px-4 text-[14px] font-normal",
        "text-foreground placeholder:text-foreground/28",
        "outline-none transition-all duration-150",
        "focus-visible:border-foreground/35 focus-visible:ring-4 focus-visible:ring-foreground/[0.05]",
        "disabled:pointer-events-none disabled:opacity-40",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
